import db from "@main/init/db";
import { chat } from "@shared/schemas/imessage";
import { ChatModel } from "@shared/types/chat";
import { desc } from "drizzle-orm";

class ChatsModel {
  all(): Promise<ChatModel[]> {
    return db.select().from(chat).orderBy(desc(chat.lastReadMessageTimestamp));
  }
}

const chatsModel = new ChatsModel();
export default chatsModel;
