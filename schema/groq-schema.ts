import * as z from "zod";

// ========================
// 1. Image Analysis Schema
// ========================
export const imageAnalysisSchema = z.object({
  title: z.string(),
  description: z.string(),
  details: z.array(z.string()),
  mood: z.string().default(""),
});

export type ImageAnalysisSchemaType = z.infer<typeof imageAnalysisSchema>;

// ========================
// 2. Translation Schema (Unified)
// ========================
export const translatedMessageItemSchema = z.object({
  id: z.string(),
  translatedText: z.string(),
});

export const translateMessagesResponseSchema = z.object({
  messages: z.array(translatedMessageItemSchema),
  language: z.string(),
});

export type TranslateMessagesResponseSchemaType = z.infer<
  typeof translateMessagesResponseSchema
>;

// ========================
// 3. Summarization Schemas
// ========================
export const bulletSummarySchema = z.object({
  summary: z.array(z.string()),
});

export const paragraphSummarySchema = z.object({
  summary: z.string(),
});

export const structuredSummarySchema = z.object({
  summary: z.object({
    topic: z.string(),
    keyPoints: z.array(z.string()),
    conclusion: z.string(),
  }),
});

export type BulletSummarySchemaType = z.infer<typeof bulletSummarySchema>;
export type ParagraphSummarySchemaType = z.infer<typeof paragraphSummarySchema>;
export type StructuredSummarySchemaType = z.infer<
  typeof structuredSummarySchema
>;
