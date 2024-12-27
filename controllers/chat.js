const Chat = require("../schemas/chat");
const User = require("../schemas/user");
const { UsersStore } = require("../store/sessionStore");

const getFriendsandChats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: "User not Found" });
    }

    const uid = user.uid;
    const friends = await Chat.find({
      $or: [{ Sender_ID: uid }, { Receiver_ID: uid }],
      text: "friend",
    });

    if (friends.length == 0) {
      return res.json({
        error: "no friends found",
      });
    }

    const newFriends = await Promise.all(
      friends.map(async (item) => {
        let finduser;
        let onlineuser = {
          uid: null,
          profile: null,
          username: null,
          online: false,
        };
        if (item.Sender_ID === uid) {
          onlineuser.uid = item.Receiver_ID;
          finduser = UsersStore.findUser(item.Receiver_ID);
        } else {
          onlineuser.uid = item.Sender_ID;
          finduser = UsersStore.findUser(item.Sender_ID);
        }
        finduser = new Array(...finduser);
        if (finduser.length) {
          (onlineuser.uid = finduser[0]?.uid),
            (onlineuser.profile = finduser[0]?.profile),
            (onlineuser.username = finduser[0]?.username),
            (onlineuser.online = true);
        } else {
          const finduser = await User.findOne({ uid: onlineuser.uid });
          onlineuser.profile = finduser?.ProfilePicture;
          onlineuser.username = finduser.Username;
        }
        return onlineuser;
      })
    );

    const chats = await Chat.find({
      $or: [{ Sender_ID: uid }, { Receiver_ID: uid }],
      text: { $ne: "friend" },
    }).select({ _id: 0, __v: 0 });

    res.status(200).json({ msg: "ok", friends: newFriends, chats: chats });
  } catch (error) {
    console.log(error);
  }
};

module.exports = { getFriendsandChats };
