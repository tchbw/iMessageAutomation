import { getDateIMessageInt } from "@main/util/dates";
import { ChatModel } from "@shared/types/chat";
import { Chat } from "@shared/types/config";

export const chatModelMapper = {
  fromModel: (model: ChatModel): Chat => {
    // See https://apple.stackexchange.com/questions/114168/dates-format-in-messages-chat-db
    const lastReadMessageTimestamp = model.lastReadMessageTimestamp as number;
    let localDate: Date | null = null;

    if (lastReadMessageTimestamp) {
      localDate = getDateIMessageInt(lastReadMessageTimestamp);
    }

    return {
      id: model.ROWID,
      chatName:
        model.displayName && model.displayName !== ``
          ? model.displayName
          : model.chatIdentifier,
      // Map the new field
      lastReadMessageTimestamp: localDate,
    };
  },
};
