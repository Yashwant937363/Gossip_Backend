const Chat = require("../schemas/chat");
const User = require("../schemas/user");

module.exports = (io, socket, UsersStore) => {
  const createConnection = async function (
    { profile, uid, username, settings },
    acknowledgmentCallback
  ) {
    try {
      UsersStore.saveUser(uid, {
        uid,
        profile,
        username,
        settings,
        connected: true,
      });
      socket.uid = uid;
      socket.join(uid);
      const friends = await Chat.find({
        $or: [{ Sender_ID: uid }, { Receiver_ID: uid }],
        type: "friend",
      });

      friends.map(async (item) => {
        if (item.Sender_ID === uid) {
          socket.to(item.Receiver_ID).emit("friendonline", { uid });
        } else {
          socket.to(item.Sender_ID).emit("friendonline", { uid });
        }
      });
      await Chat.updateMany({ Receiver_ID: uid, seen: null }, { seen: false });
      acknowledgmentCallback({
        success: true,
        msg: "user connected succesfully",
      });
    } catch (err) {
      acknowledgmentCallback({
        success: false,
        msg: "something went wrong you are not online",
      });
    }
  };
  const findUser = function (uid, sendusers) {
    const Users = UsersStore.findUser(uid, socket.uid);
    sendusers(Users);
  };

  const sendRequestUser = async function (fromuid, touid, userfeedback) {
    if (fromuid.length === 5 && touid.length === 5) {
      const friend = await Chat.findOne({
        $or: [
          { Sender_ID: fromuid, Receiver_ID: touid },
          { Sender_ID: touid, Receiver_ID: fromuid },
        ],
      });
      if (friend) {
        userfeedback("Your Already Friends");
      } else {
        const fromuser = UsersStore.getUser(fromuid);
        const touser = UsersStore.getUser(touid);

        if (fromuser?.uid && touser?.uid) {
          socket.to(touser.uid).emit("requestfromuser", {
            uid: fromuser.uid,
            profile: fromuser.profile,
            username: fromuser.username,
          });
          userfeedback("Request Sent");
        } else {
          userfeedback("User not Online");
        }
      }
      //write code for user might be offline
    } else {
      userfeedback("Please Give Complete Uid");
    }
  };

  const handleDisconnect = async function () {
    const uid = socket.uid;
    if (socket.uid) {
      const friends = await Chat.find({
        $or: [{ Sender_ID: uid }, { Receiver_ID: uid }],
        type: "friend",
      });
      friends.map(async (item) => {
        if (item.Sender_ID === uid) {
          socket.to(item.Receiver_ID).emit("friendoffline", { uid });
        } else {
          socket.to(item.Sender_ID).emit("friendoffline", { uid });
        }
      });
      UsersStore.userDisconnected(uid);
    }
    console.log("Username Disconnected : ", socket.id);
  };

  const requestAnswer = async function (
    { tousername, fromuid, touid, answer },
    userfeedback
  ) {
    if (answer) {
      const friend = await Chat.findOne({
        $or: [
          { Sender_ID: fromuid, Receiver_ID: touid },
          { Sender_ID: touid, Receiver_ID: fromuid },
        ],
      });
      if (friend) {
        userfeedback("Your Already Friends");
      } else {
        await Chat.create({
          Sender_ID: fromuid,
          Receiver_ID: touid,
          type: "friend",
          text: "friend",
        });
        const user = UsersStore.getUser(touid);
        socket.to(fromuid).emit("successmessage", {
          msg: "Request Accepted by " + tousername,
          user: {
            username: user.username,
            uid: user.uid,
            profile: user.profile,
            online: true,
          },
        });
        userfeedback("You Accepted the Request");
      }
    } else {
      socket
        .to(fromuid)
        .emit("errormessage", "Request Rejected by " + tousername);
      userfeedback("You Rejected the Request");
    }
  };

  socket.on("user:connection", createConnection);
  socket.on("user:finduser", findUser);
  socket.on("user:sendchatrequest", sendRequestUser);
  socket.on("user:requestanswer", requestAnswer);
  socket.on("disconnect", handleDisconnect);
};
