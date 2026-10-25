import type { Request, Response } from "express";
import {
  analyzeImage,
  generateChatbotReply,
  summarizeConversation,
  translateMessages,
} from "../services/groq-service.js";
import type {
  AnalyzeImageInput,
  ChatbotInput,
  SummarizationInput,
  TranslateMessagesInput,
} from "../types/groq-types.js";

export const handleChatbot = async (req: Request, res: Response) => {
  try {
    const { message, tone, history, sessionId } = req.body as ChatbotInput;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message string is required" });
    }

    const result = await generateChatbotReply({
      message,
      tone,
      history,
      sessionId,
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("AI Chatbot Error:", error);
    return res.status(500).json({ error: error?.message || "Chatbot service failed" });
  }
};

export const handleImageAnalyze = async (req: Request, res: Response) => {
  try {
    const { url, prompt } = req.body as AnalyzeImageInput;

    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "Image url is required" });
    }

    const result = await analyzeImage({ url, prompt });
    return res.status(200).json({ data: result });
  } catch (error: any) {
    console.error("AI Image Analyze Error:", error);
    return res.status(500).json({ error: error?.message || "Image analysis failed" });
  }
};

export const handleTranslate = async (req: Request, res: Response) => {
  try {
    const { messages, to } = req.body as TranslateMessagesInput;

    if (!to || typeof to !== "string") {
      return res.status(400).json({ error: "Target language 'to' is required" });
    }

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    const result = await translateMessages({ messages, to });
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("AI Translation Error:", error);
    return res.status(500).json({ error: error?.message || "Translation failed" });
  }
};

export const handleSummarize = async (req: Request, res: Response) => {
  try {
    const { conversation, format } = req.body as SummarizationInput;

    if (!Array.isArray(conversation)) {
      return res.status(400).json({ error: "Conversation array is required" });
    }

    const result = await summarizeConversation({ conversation, format });
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("AI Summarize Error:", error);
    return res.status(500).json({ error: error?.message || "Summarization failed" });
  }
};
