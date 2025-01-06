const { default: axios } = require("axios");
const AIServerURL = process.env.AIServerURL;
module.exports = (io, socket, UsersStore) => {
  const handleChatbotRequest = async ({ message, tone, uid }, response) => {
    const data = await axios.post(AIServerURL + "/api/ai/chatbot", {
      session_id: uid,
      tone,
      message,
    });
    console.log(data.data);
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
