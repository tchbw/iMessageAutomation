import db from "@main/init/db";
import { messageMapper } from "@main/util/mappers/message";
import { chat, chatMessageJoin, message } from "@shared/schemas/imessage";
import { ChatId, ChatMessage } from "@shared/types/config";
import { desc, eq } from "drizzle-orm";

export const iMessageUtil = {
  getRecentChatMessages: async ({
    chatId,
    limit,
  }: {
    chatId: ChatId;
    limit: number;
  }): Promise<ChatMessage[]> => {
    const chatResult = await db
      .select()
      .from(chat)
      .innerJoin(chatMessageJoin, eq(chatMessageJoin.chatId, chat.ROWID))
      .innerJoin(message, eq(chatMessageJoin.messageId, message.ROWID))
      .where(eq(chat.ROWID, chatId))
      .orderBy(desc(message.date))
      .limit(limit);

    // Put the messages into ascending order
    chatResult.reverse();

    const messages = chatResult.map(({ Message }) =>
      messageMapper.fromModel(Message)
    );

    return messages;
  },
};
