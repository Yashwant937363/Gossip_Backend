const { filter } = require("fuzzy");
const Chat = require("../schemas/chat");
const User = require("../schemas/user");
const { UsersStore } = require("../store/sessionStore");
const { translateMultipleMessages } = require("../sockets/ai_proxy");

const getFriendsandChats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: "User not Found" });
    }

    const uid = user.uid;
    const friends = await Chat.find({
      $or: [{ Sender_ID: uid }, { Receiver_ID: uid }],
      type: "friend",
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

    let chats = await Chat.find({
      $or: [{ Sender_ID: uid }, { Receiver_ID: uid }],
      type: { $ne: "friend" },
    }).select({ __v: 0 });
    // TODO: check for user settings
    if (
      user.settings.translation.alwaysTranslate &&
      user.settings.translation.language !== "original"
    ) {
      const filterChatsForTranslation = chats.filter(
        (chat) =>
          chat.Receiver_ID === uid &&
          chat.type === "text" &&
          !chat.translatedText.some(
            (t) => t.language === user.settings.translation.language
          )
      );
      const inputTranslateText = filterChatsForTranslation.map((chat) => {
        return {
          id: chat._id.toString(),
          text: chat.text,
        };
      });
      const translatedReceivedChats = await translateMultipleMessages({
        messages: inputTranslateText,
        to: user.settings.translation.language,
      });
      const { messages, language } = translatedReceivedChats;
      if (translatedReceivedChats) {
        chats = chats.map((chat) => {
          const translatedText = messages.find(
            (message) => message.id === chat._id.toString()
          );
          if (translatedText) {
            chat.translatedText.push({
              language,
              translatedText: translatedText.translatedText,
            });
          }
          return chat;
        });
      }
    }
    // console.log("Updated", chats);
    res.status(200).json({ msg: "ok", friends: newFriends, chats: chats });
  } catch (error) {
    console.log(error);
  }
};

module.exports = { getFriendsandChats };
