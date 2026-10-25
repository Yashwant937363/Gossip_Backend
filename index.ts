import cors from "cors";
import express from "express";
import { createServer } from "node:http";
import pinoHttp from "pino-http";
import { Server } from "socket.io";
import connectDatabase from "./config/database.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { authSocket } from "./middlewares/authSocket.js";
import aiRouter from "./routes/ai.js";
import authRouter from "./routes/auth.js";
import chatRouter from "./routes/chat.js";
import userRouter from "./routes/user.js";
import registerCallHandlers from "./sockets/call.js";
import registerChatHandlers from "./sockets/chat.js";
import registerSettingsHandlers from "./sockets/settings.js";
import registerUserHandlers, { setupUserSession } from "./sockets/user.js";
import { UsersStore } from "./store/sessionStore.js";
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
  TypedServer,
  TypedSocket,
} from "./types/socket-types.js";

const app = express();
const httpServer = createServer(app);

app.use(pinoHttp.default({ logger, redact: ["req.headers.authorization"] }));

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

app.use(express.json());
app.use(cors());

app.get("/", (_req, res) => {
  res.send("hello world");
});

app.use("/api/auth/", authRouter);
app.use("/api/chat/", chatRouter);
app.use("/api/ai/", aiRouter);
app.use("/api/user/", userRouter);

httpServer.listen(env.port, () =>
  console.log("Server running on PORT : " + env.port),
);
