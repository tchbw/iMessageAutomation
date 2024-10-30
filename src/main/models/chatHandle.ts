import db from "@main/init/db";
import { handle } from "@shared/schemas/imessage";
import { ChatHandleModel } from "@shared/types/chat";
import { eq } from "drizzle-orm";

class ChatHandlesModel {
  async get(handleId: number): Promise<ChatHandleModel> {
    const result = await db
      .select()
      .from(handle)
      .where(eq(handle.ROWID, handleId))
      .limit(1);

    return result[0]!;
  }
}

const chatHandlesModel = new ChatHandlesModel();
export default chatHandlesModel;
