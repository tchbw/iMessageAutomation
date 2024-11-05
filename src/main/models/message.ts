import db from "@main/init/db";
import { chat, chatMessageJoin, message } from "@shared/schemas/imessage";
import { ChatMessageModel } from "@shared/types/chat";
import { desc, eq } from "drizzle-orm";

class MessagesModel {
  all(): Promise<ChatMessageModel[]> {
    return db.select().from(message).orderBy(desc(message.date));
  }

  async recent({
    chatId,
    limit,
    reverse = false,
  }: {
    chatId: number;
    limit: number;
    reverse?: boolean;
  }): Promise<ChatMessageModel[]> {
    const query = await db
      .select({
        ROWID: message.ROWID,
        guid: message.guid,
        text: message.text,
        isFromMe: message.isFromMe,
        date: message.date,
        handleId: message.handleId,
        attributedBody: message.attributedBody,
      })
      .from(chat)
      .innerJoin(chatMessageJoin, eq(chat.ROWID, chatMessageJoin.chatId))
      .innerJoin(message, eq(chatMessageJoin.messageId, message.ROWID))
      .where(eq(chat.ROWID, chatId))
      .orderBy(desc(message.date))
      .limit(limit);

    return reverse ? query.reverse() : query;
  }
}

const messagesModel = new MessagesModel();
export default messagesModel;
