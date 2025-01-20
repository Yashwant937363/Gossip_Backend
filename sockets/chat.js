const Chat = require("../schemas/chat");
const {
  ref,
  getStorage,
  uploadBytes,
  getDownloadURL,
} = require("firebase/storage");
const { initializeApp } = require("firebase/app");

const firebaseConfig = {
  apiKey: process.env.apiKey,
  authDomain: process.env.authDomain,
  projectId: process.env.projectId,
  storageBucket: process.env.storageBucket,
  messagingSenderId: process.env.messagingSenderId,
  appId: process.env.appId,
  measurementId: process.env.measurementId,
};
initializeApp(firebaseConfig);

const storage = getStorage();

module.exports = (io, socket, UsersStore) => {
  const sendMessage = async (
    { fromuid, touid, message, type },
    acknowledgmentCallback
  ) => {
    let newChat;
    if (type === "text") {
      if (message.trim() == "") {
        return acknowledgmentCallback(false);
      }
    } else if (type === "image") {
      console.log(message);
      const buffer = Buffer.from(message?.data);
      const extension = message?.type.split("/")[1];
      const fileName = `image_${Date.now() + "." + extension}`;
      const storageRef = ref(storage, `images/${fileName}`);
      const snapshot = await uploadBytes(storageRef, buffer, {
        contentType: message?.type,
      });
      const downloadurl = await getDownloadURL(snapshot.ref);
      console.log(downloadurl);
      message = downloadurl;
    }
    const user = UsersStore.getUser(touid);
    if (user) {
      newChat = await Chat.create({
        Sender_ID: fromuid,
        Receiver_ID: touid,
        text: message,
        type: type,
        seen: false,
      });
    } else {
      newChat = await Chat.create({
        Sender_ID: fromuid,
        Receiver_ID: touid,
        type: type,
        text: message,
      });
    }
    delete newChat._id;
    socket.to(touid).emit("chat:receivemessage", newChat);
    acknowledgmentCallback(newChat);
  };

  const receiverSeenMessages = async ({ fromuid, touid }) => {
    try {
      await Chat.updateMany(
        { Sender_ID: fromuid, Receiver_ID: touid },
        { seen: true }
      );
      socket.to(fromuid).emit("seenmessages", { uid: touid });
    } catch (error) {
      console.log(error);
    }
  };
  socket.on("chat:sendmessage", sendMessage);
  socket.on("chat:seenmessages", receiverSeenMessages);
};
