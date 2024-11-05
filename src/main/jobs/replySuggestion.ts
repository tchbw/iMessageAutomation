import { prisma } from "@main/init/prisma";
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

  const messages = await messagesModel.recent({
    chatId,
    limit: 50,
    reverse: true,
  });

  if (messages.length === 0) {
    console.log(`No messages found for chat:`, chatId);
    return null;
  }

  const lastMessage = messages[messages.length - 1]!;
  if (lastMessage.isFromMe) {
    console.log(`No need for quick reply message for chat:`, chatId);
    return null;
  }

  const existingSuggestion = await prisma.replySuggestion.findFirst({
    where: {
      chatId,
      replyToMessageId: lastMessage.ROWID,
    },
    orderBy: {
      createdAt: `desc`,
    },
  });

  if (existingSuggestion) {
    console.log(`Using existing suggestion for message:`, lastMessage.ROWID);
    return {
      chatId,
      suggestedResponse: existingSuggestion.content,
      pastMessagesPreview: messages.map(messageMapper.fromModel),
    };
  }

  const completion = await impersonationService.generateResponse({
    pastMessages: messages,
  });

  await prisma.replySuggestion.create({
    data: {
      chatId,
      replyToMessageId: lastMessage.ROWID,
      content: completion,
    },
  });

  console.log(`Suggested quick reply message:`, {
    chatId: chatId,
    pastMessagesPreview: messages.map(messageMapper.fromModel),
    suggestedResponse: completion,
  });

  return {
    chatId: chatId,
    suggestedResponse: completion,
    pastMessagesPreview: messages.map(messageMapper.fromModel),
  };
}
