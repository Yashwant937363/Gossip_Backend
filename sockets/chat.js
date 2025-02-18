const Chat = require("../schemas/chat");
const {
  ref,
  getStorage,
  uploadBytes,
  getDownloadURL,
} = require("firebase/storage");
const { initializeApp } = require("firebase/app");
const { translateSingleMessage } = require("./ai_proxy");

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
    console.log(message);
    let newChat;
    if (type === "text") {
      if (message.trim() == "") {
        return acknowledgmentCallback(false);
      }
    } else if (type === "image") {
      const buffer = Buffer.from(message?.data);
      const extension = message?.type.split("/")[1];
      const fileName = `image_${Date.now() + "." + extension}`;
      const storageRef = ref(storage, `images/${fileName}`);
      const snapshot = await uploadBytes(storageRef, buffer, {
        contentType: message?.type,
      });
      const downloadurl = await getDownloadURL(snapshot.ref);
      message = downloadurl;
      console.log(downloadurl);
    }
    const user = UsersStore.getUser(touid);
    if (user) {
      let getTranslated;
      if (user.settings?.translation.alwaysTranslate && type === "text") {
        getTranslated = await translateSingleMessage({
          id: "new",
          text: message,
          to: user.settings?.translation.language,
        });
      }
      newChat = await Chat.create({
        Sender_ID: fromuid,
        Receiver_ID: touid,
        text: message,
        type: type,
        seen: false,
        translatedText: [getTranslated],
      });
      socket.to(touid).emit("chat:receivemessage", newChat);
    } else {
      newChat = await Chat.create({
        Sender_ID: fromuid,
        Receiver_ID: touid,
        type: type,
        text: message,
      });
    }

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
