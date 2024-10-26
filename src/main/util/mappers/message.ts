import { getContentFromIMessage } from "@main/util/mac";
import { ChatMessageModel } from "@shared/types/chat";
import { ChatMessage } from "@shared/types/config";

export const messageMapper = {
  fromModel: (dbMessage: ChatMessageModel): ChatMessage => {
    return {
      id: dbMessage.ROWID,
      content: getContentFromIMessage(dbMessage),
      handleId: dbMessage.handleId,
      isFromMe: dbMessage.isFromMe === 1,
      date: dbMessage.date,
    };
  },
};
