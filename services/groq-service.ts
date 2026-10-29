import type {
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionMessageParam,
} from "groq-sdk/resources/chat/completions.js";
import groq, { GROQ_MODELS } from "../config/groq.js";
import ANALYZE_IMAGE_SYSTEM_PROMPT from "../prompts/analyze-image-prompt.js";
import {
  human_behavior_message,
  tone_templates,
} from "../prompts/chatbot-prompts.js";
import input_system_prompt, {
  output_bullet_points,
  output_paragraph,
  output_structured,
} from "../prompts/summarization-prompt.js";
import TRANSLATE_CHAT_SYSTEM_PROMPT from "../prompts/translate-chat-prompt.js";
import {
  bulletSummarySchema,
  imageAnalysisSchema,
  paragraphSummarySchema,
  structuredSummarySchema,
  translateMessagesResponseSchema,
} from "../schema/groq-schema.js";
import type {
  AnalyzeImageInput,
  ChatbotInput,
  ChatbotResult,
  ImageAnalysisResult,
  SummarizationFormat,
  SummarizationInput,
  SummarizationResult,
  Tone,
  TranslateMessagesInput,
  TranslateMessagesResult,
} from "../types/groq-types.js";

/**
 * Type definition for Groq chat completion runner.
 * Takes parameters and returns the string text response.
 */
export type GroqRunner = (
  params: ChatCompletionCreateParamsNonStreaming,
) => Promise<string>;

/**
 * Default production runner that executes the call using the real Groq client.
 */
export async function executeGroqChat(
  params: ChatCompletionCreateParamsNonStreaming,
): Promise<string> {
  const response = await groq.chat.completions.create(params);
  return response.choices[0]?.message?.content || "";
}

/**
 * Helper to safely parse JSON from model responses, stripping markdown code fences if present.
 */
export function safeParseJson(content: string | null | undefined): any {
  if (!content) {
    throw new Error("Empty response received from Groq AI model");
  }
  try {
    return JSON.parse(content);
  } catch (error) {
    // If wrapped in markdown code blocks, strip them
    const cleaned = content
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();
    return JSON.parse(cleaned);
  }
}

/**
 * 1. Image Analysis using Qwen 3.8 Multimodal Vision
 * Model: qwen/qwen3.8-27b
 */
export async function analyzeImage(
  input: AnalyzeImageInput,
  runner: GroqRunner = executeGroqChat,
): Promise<ImageAnalysisResult> {
  const userContent: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } }
  > = [
    {
      type: "text",
      text:
        input.prompt ||
        "Analyze this image and return the JSON structure as instructed.",
    },
    {
      type: "image_url",
      image_url: {
        url: input.url,
      },
    },
  ];

  const messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: ANALYZE_IMAGE_SYSTEM_PROMPT,
    },
    {
      role: "user",
      content: userContent,
    },
  ];

  const content = await runner({
    model: GROQ_MODELS.VISION,
    messages,
    response_format: { type: "json_object" },
  });

  const parsed = safeParseJson(content);
  return imageAnalysisSchema.parse(parsed);
}

/**
 * 2. Conversational Chatbot using GPT-OSS 120B
 * Model: openai/gpt-oss-120b
 */
export async function generateChatbotReply(
  input: ChatbotInput,
  runner: GroqRunner = executeGroqChat,
): Promise<ChatbotResult> {
  const selectedTone: Tone = input.tone || "normal";
  const toneInstruction =
    tone_templates[selectedTone] || tone_templates.normal;

  const systemContent = `${human_behavior_message}\n\nTone instruction: ${toneInstruction}`;

  const messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: systemContent,
    },
  ];

  if (input.history && input.history.length > 0) {
    for (const msg of input.history) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }
  }

  messages.push({
    role: "user",
    content: input.message,
  });

  const reply = await runner({
    model: GROQ_MODELS.DEFAULT,
    messages,
  });

  return {
    reply,
    tone: selectedTone,
  };
}

/**
 * 3. Unified Message Translation using GPT-OSS 120B
 * Model: openai/gpt-oss-120b
 * Handles both single and multiple message translations.
 */
export async function translateMessages(
  input: TranslateMessagesInput,
  runner: GroqRunner = executeGroqChat,
): Promise<TranslateMessagesResult> {
  if (!input.messages || input.messages.length === 0) {
    return {
      messages: [],
      language: input.to,
    };
  }

  const payload = {
    messages: input.messages,
    to: input.to,
  };

  const messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: TRANSLATE_CHAT_SYSTEM_PROMPT,
    },
    {
      role: "user",
      content: JSON.stringify(payload),
    },
  ];

  const content = await runner({
    model: GROQ_MODELS.DEFAULT,
    messages,
    response_format: { type: "json_object" },
  });

  const parsed = safeParseJson(content);
  return translateMessagesResponseSchema.parse(parsed);
}

/**
 * 4. Conversation Summarization using GPT-OSS 120B
 * Model: openai/gpt-oss-120b
 * Formats: "bullet" | "paragraph" | "structured"
 */
export async function summarizeConversation(
  input: SummarizationInput,
  runner: GroqRunner = executeGroqChat,
): Promise<SummarizationResult> {
  const format: SummarizationFormat = input.format || "paragraph";

  let formatPrompt: string;
  switch (format) {
    case "bullet":
      formatPrompt = output_bullet_points;
      break;
    case "structured":
      formatPrompt = output_structured;
      break;
    case "paragraph":
    default:
      formatPrompt = output_paragraph;
      break;
  }

  const systemContent = `${input_system_prompt}\n\n${formatPrompt}`;

  const payload = {
    conversation: input.conversation,
  };

  const messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: systemContent,
    },
    {
      role: "user",
      content: JSON.stringify(payload),
    },
  ];

  const content = await runner({
    model: GROQ_MODELS.DEFAULT,
    messages,
    response_format: { type: "json_object" },
  });

  const parsed = safeParseJson(content);

  switch (format) {
    case "bullet":
      return bulletSummarySchema.parse(parsed);
    case "structured":
      return structuredSummarySchema.parse(parsed);
    case "paragraph":
    default:
      return paragraphSummarySchema.parse(parsed);
  }
}
