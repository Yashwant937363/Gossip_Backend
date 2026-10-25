import Groq from "groq-sdk";
import { env } from "./env.js";

export const GROQ_MODELS = {
  VISION: env.groqVisionModel,
  DEFAULT: env.groqDefaultModel,
} as const;

const groq = new Groq({
  apiKey: env.groqApiKey,
});

export default groq;
