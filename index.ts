import { createServer } from "node:http";
import { Server } from "socket.io";
import connectDatabase from "./config/database.js";
import { env } from "./config/env.js";
import { authSocket } from "./middlewares/authSocket.js";
import registerCallHandlers from "./sockets/call.js";
import registerChatHandlers from "./sockets/chat.js";
import registerSettingsHandlers from "./sockets/settings.js";
import registerUserHandlers, { setupUserSession } from "./sockets/user.js";
import { UsersStore } from "./store/sessionStore.js";
import app from "./app.js";
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
  TypedServer,
  TypedSocket,
} from "./types/socket-types.js";

const httpServer = createServer(app);

const io: TypedServer = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(httpServer, {
  cors: {
    origin: "*",
  },
});

connectDatabase(env.dbUrl);

// Socket Handshake Authentication Middleware
io.use(authSocket);

const onConnection = async (socket: TypedSocket) => {
  console.log(
    "Authenticated user connected:",
    socket.id,
    "UID:",
    socket.data.uid,
  );

  // Automatically register session, join room, broadcast friendonline, update unseen messages
  await setupUserSession(socket, UsersStore);

  // Register real-time event handlers
  registerUserHandlers(io, socket, UsersStore);
  registerChatHandlers(io, socket, UsersStore);
  registerCallHandlers(io, socket);
  registerSettingsHandlers(io, socket, UsersStore);
};

io.on("connection", onConnection);

httpServer.listen(env.port, () =>
  console.log("Server running on PORT : " + env.port),
);
