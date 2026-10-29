import cors from "cors";
import express from "express";
import pinoHttp from "pino-http";
import { logger } from "./config/logger.js";
import aiRouter from "./routes/ai.js";
import authRouter from "./routes/auth.js";
import chatRouter from "./routes/chat.js";
import userRouter from "./routes/user.js";

const app = express();

app.use(pinoHttp.default({ logger, redact: ["req.headers.authorization"] }));

app.use(express.json());
app.use(cors());

app.get("/", (_req, res) => {
  res.send("hello world");
});

app.use("/api/auth/", authRouter);
app.use("/api/chat/", chatRouter);
app.use("/api/ai/", aiRouter);
app.use("/api/user/", userRouter);

export default app;
