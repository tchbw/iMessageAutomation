import messagesModel from "@main/models/message";
import impersonationService from "@main/services/impersonation/service";
import { messageMapper } from "@main/util/mappers/message";
import {
  ChatId,
  ChatMessageSuggestion,
  QuickReplySuggestions,
} from "@shared/types/config";

export async function processReplySuggestions(
  quickReplySuggestions: QuickReplySuggestions
): Promise<ChatMessageSuggestion[]> {
  console.log(
    `Processing Quick Reply Messages for Chats:`,
    quickReplySuggestions.enabledChats
  );
  const suggestionsPromises = quickReplySuggestions.enabledChats.map((chatId) =>
    processQuickReplyMessage(chatId)
  );

  const suggestions = await Promise.all(suggestionsPromises);

  return suggestions.filter(
    (suggestion): suggestion is ChatMessageSuggestion => suggestion !== null
  );
}

async function processQuickReplyMessage(
  chatId: ChatId
): Promise<ChatMessageSuggestion | null> {
  console.log(`Processing Quick Reply Message for Chat:`, chatId);

  // const messages = await db
  //   .select({
  //     ROWID: message.ROWID,
  //     guid: message.guid,
  //     text: message.text,
  //     isFromMe: message.isFromMe,
  //     date: message.date,
  //     handleId: message.handleId,
  //     attributedBody: message.attributedBody,
  //   })
  //   .from(chat)
  //   .innerJoin(chatMessageJoin, eq(chat.ROWID, chatMessageJoin.chatId))
  //   .innerJoin(message, eq(chatMessageJoin.messageId, message.ROWID))
  //   .where(eq(chat.ROWID, chatId))
  //   .orderBy(desc(message.date))
  //   .limit(50);

  const messages = await messagesModel.recent({
    chatId,
    limit: 50,
  });

  if (messages.length === 0) {
    console.log(`No messages found for chat:`, chatId);
    return null;
  }

  const lastMessage = messages[0]!;
  if (lastMessage.isFromMe) {
    console.log(`No need for quick reply message for chat:`, chatId);
    return null;
  }

  const completion = await impersonationService.generateResponse({
    pastMessages: messages,
  });

  console.log(`Suggested quick reply message:`, {
    chatId: chatId,
    pastMessagesPreview: messages.map(messageMapper.fromModel),
    suggestedResponse: completion,
  });
  //   await sendIMessage({
  //     phoneNumber: sendHandle[0]!.id,
  //     message: completion,
  //   });

  return {
    chatId: chatId,
    suggestedResponse: completion,
    pastMessagesPreview: messages.map(messageMapper.fromModel),
  };
}
