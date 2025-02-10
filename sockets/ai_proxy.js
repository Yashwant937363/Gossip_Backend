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
  socket.on("ai:chatbot:fromclient", handleChatbotRequest);
  socket.on("ai:image-analyze", handleImageAnalyze);
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
    Chat.findByIdAndUpdate(id, {
      $addToSet: {
        translatedText: {
          language: data.data.language,
          translatedText: data.data.translatedText,
        },
      },
    });
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
