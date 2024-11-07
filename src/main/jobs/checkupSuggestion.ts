import { prisma } from "@main/init/prisma";
import messagesModel from "@main/models/message";
import impersonationService from "@main/services/impersonation/service";
import { messageMapper } from "@main/util/mappers/message";
import dayjs from "@shared/init/dayjs";
import { ChatId, ChatMessageSuggestion } from "@shared/types/config";

export async function processCheckupSuggestions(
  enabledChats: number[]
): Promise<ChatMessageSuggestion[]> {
  console.log(`Processing Checkup Messages for Chats:`, enabledChats);
  const suggestionsPromises = enabledChats.map((chatId) =>
    processCheckupMessage(chatId)
  );

  const suggestions = await Promise.all(suggestionsPromises);

  return suggestions.filter(
    (suggestion): suggestion is ChatMessageSuggestion => suggestion !== null
  );
}

async function processCheckupMessage(
  chatId: ChatId
): Promise<ChatMessageSuggestion | null> {
  console.log(`Processing Checkup Message for Chat:`, chatId);

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
  const lastMessageDate = new Date(Number(lastMessage.date) * 1000);
  const weeksSinceLastMessage = dayjs().diff(dayjs(lastMessageDate), `week`);

  if (weeksSinceLastMessage < 2) {
    console.log(`Last message too recent for checkup:`, chatId);
    return null;
  }

  // Check if we already have a suggestion for this latest message
  const existingSuggestion = await prisma.checkupSuggestion.findFirst({
    where: {
      chatId,
      latestMessageId: lastMessage.ROWID,
    },
  });

  if (existingSuggestion) {
    console.log(
      `Using existing checkup suggestion for message:`,
      lastMessage.ROWID
    );
    return {
      chatId,
      suggestedResponse: existingSuggestion.content,
      pastMessagesPreview: messages.map(messageMapper.fromModel),
    };
  }

  const completion = await impersonationService.generateCheckupMessage({
    pastMessages: messages,
    weeksSinceLastMessage,
  });

  // Persist the new suggestion
  await prisma.checkupSuggestion.create({
    data: {
      chatId,
      latestMessageId: lastMessage.ROWID,
      content: completion,
    },
  });

  return {
    chatId,
    suggestedResponse: completion,
    pastMessagesPreview: messages.map(messageMapper.fromModel),
  };
}
