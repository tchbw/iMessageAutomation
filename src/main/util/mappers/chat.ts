import { ChatModel } from "@shared/types/chat";
import { Chat } from "@shared/types/config";

export const chatModelMapper = {
  fromModel: (model: ChatModel): Chat => {
    // See https://apple.stackexchange.com/questions/114168/dates-format-in-messages-chat-db
    const lastReadMessageTimestamp = model.lastReadMessageTimestamp as number;
    let localDate: Date | null = null;

    if (lastReadMessageTimestamp) {
      const messageDate = lastReadMessageTimestamp / 1000000000; // Scale down the timestamp

      // Get the Unix timestamp for January 1, 2001
      const baseDate = new Date(`2001-01-01T00:00:00Z`).getTime() / 1000; // in seconds

      // Add the messageDate to baseDate
      const unixTimestamp = messageDate + baseDate;

      // Convert the timestamp to a local datetime
      localDate = new Date(unixTimestamp * 1000); // Convert seconds to milliseconds for JS Date
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
