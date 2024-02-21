const Chat = require("../schemas/chat");

module.exports = (io, socket, UsersStore) => {
  const sendMessage = async (
    { fromuid, touid, message },
    acknowledgmentCallback
  ) => {
    const user = UsersStore.getUser(touid);
    let newChat;
    if (user) {
      newChat = await Chat.create({
        Sender_ID: fromuid,
        Receiver_ID: touid,
        text: message,
        seen: false,
      });
    } else {
      newChat = await Chat.create({
        Sender_ID: fromuid,
        Receiver_ID: touid,
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
