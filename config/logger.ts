import fs from "node:fs";
import path from "node:path";
import pino from "pino";
import { env } from "./env.js";

const logDir = path.resolve(process.cwd(), "logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

export const logger = pino(
  { level: env.logLevel },
  pino.destination(path.join(logDir, "app.log")),
);
