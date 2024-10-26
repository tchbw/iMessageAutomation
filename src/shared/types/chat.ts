import { chat, handle, message } from "@shared/schemas/imessage";
import { InferSelectModel } from "drizzle-orm";

export type ChatModel = InferSelectModel<typeof chat>;
export type ChatHandleModel = InferSelectModel<typeof handle>;
export type ChatMessageModel = InferSelectModel<typeof message>;

export type iMessageChatMessage = {
  id: number;
  content: string;
  handleId: number;
  isFromMe: boolean;
};
