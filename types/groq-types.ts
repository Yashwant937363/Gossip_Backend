import type { Tone } from "../prompts/chatbot-prompts.js";

export type { Tone };

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// ========================
// 1. Image Analysis Types
// ========================
export interface AnalyzeImageInput {
  url: string; // Public URL or Base64 Data URI (e.g., data:image/jpeg;base64,...)
  prompt?: string;
}

export interface ImageAnalysisResult {
  title: string;
  description: string;
  details: string[];
  mood: string;
}

// ========================
// 2. Chatbot Types
// ========================
export interface ChatbotInput {
  message: string;
  tone?: Tone;
  sessionId?: string;
  history?: ChatMessage[];
}

export interface ChatbotResult {
  reply: string;
  tone: Tone;
}

// ========================
// 3. Translation Types (Unified)
// ========================
export interface MessageToTranslate {
  id: string;
  text: string;
}

export interface TranslateMessagesInput {
  messages: MessageToTranslate[];
  to: string;
}

export interface TranslatedMessageItem {
  id: string;
  translatedText: string;
}

export interface TranslateMessagesResult {
  messages: TranslatedMessageItem[];
  language: string;
}

// ========================
// 4. Summarization Types
// ========================
export type SummarizationFormat = "bullet" | "paragraph" | "structured";

export interface ConversationTurn {
  username: string;
  message: string;
}

export interface SummarizationInput {
  conversation: ConversationTurn[];
  format?: SummarizationFormat;
}

export interface BulletSummaryResult {
  summary: string[];
}

export interface ParagraphSummaryResult {
  summary: string;
}

export interface StructuredSummaryResult {
  summary: {
    topic: string;
    keyPoints: string[];
    conclusion: string;
  };
}

export type SummarizationResult =
  | BulletSummaryResult
  | ParagraphSummaryResult
  | StructuredSummaryResult;
