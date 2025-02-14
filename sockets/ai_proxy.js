const { default: axios } = require("axios");
const Chat = require("../schemas/chat");
const AIServerURL = process.env.AIServerURL;
module.exports = (io, socket, UsersStore) => {
  const handleChatbotRequest = async ({ message, tone, uid }, response) => {
    const data = await axios.post(AIServerURL + "/api/ai/chatbot", {
      session_id: uid,
      tone,
      message,
    });
    response(data.data);
  };
  const handleImageAnalyze = async ({ url }, response) => {
    const data = await axios.post(AIServerURL + "/api/ai/analyze-image", {
      url,
    });
    response(data.data?.caption);
  };
  const handleTranslateMultipleMessages = async ({ messages, to }, uid) => {
    console.log("translate multiple messages request received");
    console.log("outside uid", socket.id);
    let response = await module.exports.translateMultipleMessages({
      messages,
      to,
    });

    socket.emit("ai:translated:multiple-messages", response); // ✅ Sends data over the socket
  };

  const handleTranslateSingleMessage = async ({ id, text, to }, response) => {
    console.log("single translate");
    let translated = await module.exports.translateSingleMessage({
      id,
      text,
      to,
    });
    response(translated);
  };
  socket.on("ai:chatbot:fromclient", handleChatbotRequest);
  socket.on("ai:image-analyze", handleImageAnalyze);
  socket.on("ai:translate:multiple-messages", handleTranslateMultipleMessages);
  socket.on("ai:translate:single-message", handleTranslateSingleMessage);
};

module.exports.translateSingleMessage = async ({ id, text, to }) => {
  const data = await axios.post(
    AIServerURL + "/api/ai/translate/single-message",
    {
      text,
      to,
    }
  );
  if (id !== "new") {
    Chat.findByIdAndUpdate(
      id,
      {
        $set: {
          translatedText: {
            $concatArrays: [
              {
                $filter: {
                  input: "$translatedText",
                  as: "t",
                  cond: { $ne: ["$$t.language", data.data.language] }, // Keep only entries with a different language
                },
              },
              [
                {
                  language: data.data.language,
                  translatedText: data.data.translatedText,
                },
              ],
            ],
          },
        },
      },
      { new: true }
    );
  }
  return data.data;
};

module.exports.translateMultipleMessages = async ({ messages, to }) => {
  if (messages.length === 0) return false;
  const data = await axios.post(
    AIServerURL + "/api/ai/translate/multiple-messages",
    {
      messages,
      to,
    }
  );
  bulkUpdateChats(data.data);
  return data.data;
};

async function bulkUpdateChats(data) {
  try {
    const { messages, language } = data;

    const bulkOps = messages.map((message) => ({
      updateOne: {
        filter: { _id: message.id },
        update: {
          $addToSet: {
            translatedText: {
              language: language,
              translatedText: message.translatedText,
            },
          },
        },
      },
    }));

    await Chat.bulkWrite(bulkOps);
    console.log("Bulk chat translations updated successfully!");
  } catch (error) {
    console.error("Error updating chats:", error);
  }
}
