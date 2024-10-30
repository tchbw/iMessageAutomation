import { z } from "zod";

export const chatSchema = z.object({
  id: z.number(),
  chatName: z.string(),
  // Add the new field
  lastReadMessageTimestamp: z.date().nullable(),
});
export type Chat = z.infer<typeof chatSchema>;

export const chatMessageSchema = z.object({
  id: z.number(),
  content: z.string(),
  date: z.string(),
  handleId: z.number(),
  isFromMe: z.boolean(),
});
export type ChatMessage = z.infer<typeof chatMessageSchema>;

export const chatMessageSuggestionSchema = z.object({
  chatId: z.number(),
  suggestedResponse: z.string(),
  pastMessagesPreview: z.array(chatMessageSchema),
});
export type ChatMessageSuggestion = z.infer<typeof chatMessageSuggestionSchema>;

export const chatsConfigSchema = z.object({
  automatedChats: z.array(z.number()),
  ignoredChats: z.array(z.number()),
  checkUpSuggestions: z.object({
    enabledChats: z.array(z.number()),
    suggestions: z.array(chatMessageSuggestionSchema),
  }),
  quickReplySuggestions: z.object({
    enabledChats: z.array(z.number()),
    suggestions: z.array(chatMessageSuggestionSchema),
  }),
  chats: z.array(chatSchema),
});
export type CheckUpSuggestions = z.infer<
  typeof chatsConfigSchema.shape.checkUpSuggestions
>;
export type QuickReplySuggestions = z.infer<
  typeof chatsConfigSchema.shape.quickReplySuggestions
>;

export type ChatsConfig = z.infer<typeof chatsConfigSchema>;
export type ChatId = number;