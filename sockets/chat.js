const Chat = require("../schemas/chat");
const cloudinary = require("cloudinary").v2;
const { translateSingleMessage } = require("./ai_proxy");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

module.exports = (io, socket, UsersStore) => {
  const sendMessage = async (
    { fromuid, touid, message, type },
    acknowledgmentCallback,
  ) => {
    console.log(message);
    let newChat;
    if (type === "text") {
      if (message.trim() == "") {
        return acknowledgmentCallback(false);
      }
    } else if (type === "image") {
      console.log("got image");
      const buffer = Buffer.from(message?.data);
      const extension = message?.type.split("/")[1];

      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "images",
            resource_type: "image",
            format: extension,
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          },
        );

        uploadStream.end(buffer);
      });

      const downloadurl = result.secure_url;

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
        { seen: true },
      );
      socket.to(fromuid).emit("seenmessages", { uid: touid });
    } catch (error) {
      console.log(error);
    }
  };
  socket.on("chat:sendmessage", sendMessage);
  socket.on("chat:seenmessages", receiverSeenMessages);
};
