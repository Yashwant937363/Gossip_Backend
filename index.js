const express = require("express");
const connectDatabase = require("./database");
const cors = require("cors");
require("dotenv").config();

const PORT = process.env.PORT || 5000;

const conStr = process.env.DATABASE;
connectDatabase(conStr);
const app = express();
const registerUserHandlers = require("./sockets/user");
const registerChatHandlers = require("./sockets/chat");
const server = require("http").createServer(app);
const { Server } = require("socket.io");
const { UsersStore } = require("./store/sessionStore");
const io = new Server(server, {
  cors: {
    origin: "https://gossipapp-by-yashwant.netlify.app",
  },
});

const onConnection = (socket) => {
  console.log("a user connected", socket.id);
  registerUserHandlers(io, socket, UsersStore);
  registerChatHandlers(io, socket, UsersStore);
};

io.on("connection", onConnection);

app.use(express.json());
app.use(
  cors({
    origin: "https://gossip-app-dz7b.onrender.com",
  })
);

app.get("/", (req, res) => {
  res.send("hello world");
});

app.use("/api/auth/", require("./routes/auth"));
app.use("/api/chat/", require("./routes/chat"));

server.listen(PORT, () => console.log("Server running on PORT : " + PORT));
