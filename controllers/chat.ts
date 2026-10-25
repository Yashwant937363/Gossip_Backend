import type { Request, Response } from "express";
import fs from "node:fs";
import Chat from "../models/chat.js";
import User from "../models/user.js";
import { JWTPayload } from "../schema/auth-schema.js";
import { uploadImage } from "../services/cloudinary-service.js";
import { UsersStore } from "../store/sessionStore.js";
import {
  GetFriendsAndChatsResponse,
  UploadChatImageResponse,
} from "../schema/chat-schema.js";

export const getFriendsandChats = async (
  req: Request,
  res: Response<GetFriendsAndChatsResponse | { error: string }, JWTPayload>,
) => {
  try {
    const user = await User.findById(res.locals.id);
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
    console.log(
      friends.map((item) => {
        if (item.Sender_ID === uid) {
          return item.Receiver_ID;
        } else {
          return item.Sender_ID;
        }
      }),
    );

    const friendUids = friends.map((item) =>
      item.Sender_ID === uid ? item.Receiver_ID : item.Sender_ID,
    );

    const offlineUids = [
      ...new Set(
        friendUids.filter((friendUid) => !UsersStore.getUser(friendUid)),
      ),
    ];

    const databaseUsers = offlineUids.length
      ? await User.find(
          { uid: { $in: offlineUids } },
          { uid: 1, ProfilePicture: 1, Username: 1, _id: 0 },
        ).lean()
      : [];

    const databaseUserMap = new Map(
      databaseUsers.map((user) => [user.uid, user]),
    );

    const newFriends = friendUids.map((friendUid) => {
      const onlineUser = UsersStore.getUser(friendUid);

      if (onlineUser) {
        return {
          uid: onlineUser.uid,
          profile: onlineUser.profile,
          username: onlineUser.username,
          online: true,
        };
      }

      const databaseUser = databaseUserMap.get(friendUid);
      if (!databaseUser) {
        return {
          uid: friendUid,
          profile: "",
          username: "Unknown",
          online: false,
        };
      }
      return {
        uid: friendUid,
        profile: databaseUser.ProfilePicture,
        username: databaseUser.Username,
        online: false,
      };
    });

    let chats = await Chat.find({
      $or: [{ Sender_ID: uid }, { Receiver_ID: uid }],
      type: { $ne: "friend" },
    }).select({ __v: 0 });
    // if (
    //   user.settings.translation.alwaysTranslate &&
    //   user.settings.translation.language !== "original"
    // ) {
    //   const filterChatsForTranslation = chats.filter(
    //     (chat) =>
    //       chat.Receiver_ID === uid &&
    //       chat.type === "text" &&
    //       !chat.translatedText.some(
    //         (t) => t?.language === user.settings.translation.language,
    //       ),
    //   );
    //   const inputTranslateText = filterChatsForTranslation.map((chat) => {
    //     return {
    //       id: chat._id.toString(),
    //       text: chat.text,
    //     };
    //   });
    //   const translatedReceivedChats = await translateMultipleMessages({
    //     messages: inputTranslateText,
    //     to: user.settings.translation.language,
    //   });
    //   const { messages, language } = translatedReceivedChats;
    //   if (translatedReceivedChats) {
    //     chats = chats.map((chat) => {
    //       const translatedText = messages.find(
    //         (message) => message.id === chat._id.toString(),
    //       );
    //       if (translatedText) {
    //         chat.translatedText.push({
    //           language,
    //           translatedText: translatedText.translatedText,
    //         });
    //       }
    //       return chat;
    //     });
    //   }
    // }
    // console.log("Updated", chats);
    res.status(200).json({ msg: "ok", friends: newFriends, chats: chats });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ error: "Something went wrong while fetching chats data" });
  }
};

export const uploadChatImage = async (
  req: Request<{}, {}, UploadChatImageResponse>,
  res: Response<any, JWTPayload>,
) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    const secureUrl = await uploadImage(req.file.path);

    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(200).json({ success: true, url: secureUrl });
  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error("Error uploading chat image:", error);
    return res.status(500).json({ error: "Failed to upload chat image" });
  }
};
