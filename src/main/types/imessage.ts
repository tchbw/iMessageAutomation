import { message } from "@main/schemas/imessage";
import { InferSelectModel } from "drizzle-orm";

export type iMessageChatMessage = {
  id: number;
  content: string;
  handleId: number;
  isFromMe: boolean;
};

export type DBIMessageChatMessage = InferSelectModel<typeof message>;
