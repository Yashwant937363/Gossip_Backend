import Chat from "../models/chat.js";
import { translateMessages } from "../services/groq-service.js";
import type { UserStore } from "../store/sessionStore.js";
import type {
  SeenMessagesPayload,
  SendMessagePayload,
  TypedServer,
  TypedSocket,
} from "../types/socket-types.js";

export default function registerChatHandlers(
  _io: TypedServer,
  socket: TypedSocket,
  usersStore: UserStore,
): void {
  const sendMessage = async (
    { touid, message, type }: SendMessagePayload,
    acknowledgmentCallback: (result: any) => void,
  ) => {
    try {
      const fromuid = socket.data.uid;
      let newChat: any;

      if (type === "text") {
        if (!message || message.trim() === "") {
          return acknowledgmentCallback(false);
        }
      }

      const receiver = usersStore.getUser(touid);

      if (receiver) {
        let getTranslated: { language: string; translatedText: string } | undefined;

        if (receiver.settings?.translation?.alwaysTranslate && type === "text") {
          try {
            const translationRes = await translateMessages({
              messages: [{ id: "new", text: message }],
              to: receiver.settings.translation.language,
            });

            if (translationRes.messages.length > 0) {
              getTranslated = {
                language: translationRes.language,
                translatedText: translationRes.messages[0].translatedText,
              };
            }
          } catch (err) {
            console.error("Translation during chat send error:", err);
          }
        }

        newChat = await Chat.create({
          Sender_ID: fromuid,
          Receiver_ID: touid,
          text: message,
          type: type,
          seen: false,
          translatedText: getTranslated ? [getTranslated] : [],
        });

        socket.to(touid).emit("chat:receivemessage", newChat);
      } else {
        newChat = await Chat.create({
          Sender_ID: fromuid,
          Receiver_ID: touid,
          type: type,
          text: message,
          seen: false,
        });
      }

      acknowledgmentCallback(newChat);
    } catch (error) {
      console.error("Error in chat:sendmessage handler:", error);
      acknowledgmentCallback(false);
    }
  };

  const receiverSeenMessages = async ({ fromuid }: SeenMessagesPayload) => {
    try {
      const touid = socket.data.uid;
      await Chat.updateMany(
        { Sender_ID: fromuid, Receiver_ID: touid },
        { seen: true },
      );
      socket.to(fromuid).emit("seenmessages", { uid: touid });
    } catch (error) {
      console.error("Error in chat:seenmessages handler:", error);
    }
  };

  socket.on("chat:sendmessage", sendMessage);
  socket.on("chat:seenmessages", receiverSeenMessages);
}
