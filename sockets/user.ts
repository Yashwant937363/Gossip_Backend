import Chat from "../models/chat.js";
import type { UserStore } from "../store/sessionStore.js";
import type { TypedServer, TypedSocket } from "../types/socket-types.js";

/**
 * Automatically initializes the session when an authenticated socket connects.
 * Called automatically from index.ts upon connection (replaces manual user:connection).
 */
export async function setupUserSession(
  socket: TypedSocket,
  usersStore: UserStore,
): Promise<void> {
  try {
    const user = socket.data.user;
    const uid = socket.data.uid;

    usersStore.saveUser(uid, {
      uid,
      profile: user.ProfilePicture || "",
      username: user.Username || "",
      settings: user.settings,
      connected: true,
    });

    socket.join(uid);

    const friends = await Chat.find({
      $or: [{ Sender_ID: uid }, { Receiver_ID: uid }],
      type: "friend",
    });

    friends.forEach((item) => {
      const friendUid =
        item.Sender_ID === uid ? item.Receiver_ID : item.Sender_ID;
      socket.to(friendUid).emit("friendonline", { uid });
    });

    await Chat.updateMany({ Receiver_ID: uid, seen: null }, { seen: false });
  } catch (error) {
    console.error("Error setting up user socket session:", error);
  }
}

export default function registerUserHandlers(
  _io: TypedServer,
  socket: TypedSocket,
  usersStore: UserStore,
): void {
  const findUser = (
    uid: string,
    sendusers: (users: ReturnType<UserStore["findUser"]>) => void,
  ) => {
    const users = usersStore.findUser(uid, socket.data.uid);
    sendusers(users);
  };

  const sendRequestUser = async (
    fromuid: string,
    touid: string,
    userfeedback: (msg: string) => void,
  ) => {
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
        const fromuser = usersStore.getUser(fromuid);
        const touser = usersStore.getUser(touid);

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
    } else {
      userfeedback("Please Give Complete Uid");
    }
  };

  const requestAnswer = async (
    {
      tousername,
      fromuid,
      touid,
      answer,
    }: {
      tousername: string;
      fromuid: string;
      touid: string;
      answer: boolean;
    },
    userfeedback: (msg: string) => void,
  ) => {
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
        const user = usersStore.getUser(touid);
        socket.to(fromuid).emit("successmessage", {
          msg: "Request Accepted by " + tousername,
          user: user
            ? {
                username: user.username,
                uid: user.uid,
                profile: user.profile,
                online: true,
              }
            : undefined,
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

  const handleDisconnect = async () => {
    const uid = socket.data.uid;
    if (uid) {
      const friends = await Chat.find({
        $or: [{ Sender_ID: uid }, { Receiver_ID: uid }],
        type: "friend",
      });
      friends.forEach((item) => {
        const friendUid =
          item.Sender_ID === uid ? item.Receiver_ID : item.Sender_ID;
        socket.to(friendUid).emit("friendoffline", { uid });
      });
      usersStore.userDisconnected(uid);
    }
    console.log("User Disconnected:", socket.id, "UID:", uid);
  };

  socket.on("user:finduser", findUser);
  socket.on("user:sendchatrequest", sendRequestUser);
  socket.on("user:requestanswer", requestAnswer);
  socket.on("disconnect", handleDisconnect);
}
