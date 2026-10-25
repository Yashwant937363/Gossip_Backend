import dotenv from "dotenv";
dotenv.config();

interface ENV {
  port: number;
  jwtSecret: string;
  dbUrl: string;
  logLevel: string;
  aiServerUrl: string;
  email: string;
  appPassword: string;
  cloudinaryCloudName: string;
  cloudinaryApiKey: string;
  cloudinaryApiSecret: string;
  groqApiKey: string;
  groqDefaultModel: string;
  groqVisionModel: string;
}

export const env: ENV = {
  port: Number(process.env.PORT) || 5000,
  jwtSecret: process.env.JWT_SECRET || "",
  dbUrl: process.env.DATABASE || "",
  logLevel: process.env.LOG_LEVEL || "debug",
  aiServerUrl: process.env.AIServerURL || "",
  email: process.env.Email || "",
  appPassword: process.env.AppPassword || "",
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || "",
  groqApiKey: process.env.GROQ_API_KEY || "",
  groqDefaultModel: process.env.GROQ_DEFAULT_MODEL || "openai/gpt-oss-120b",
  groqVisionModel: process.env.GROQ_VISION_MODEL || "qwen/qwen3.8-27b",
};
