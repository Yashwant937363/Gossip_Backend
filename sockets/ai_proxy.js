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
  socket.on("ai:chatbot:fromclient", handleChatbotRequest);
};
