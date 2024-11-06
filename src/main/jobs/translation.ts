import { prisma } from "@main/init/prisma";
import messagesModel from "@main/models/message";
import { messageMapper } from "@main/util/mappers/message";
import { getGptCompletion } from "@main/util/ai";
import { ChatCompletionMessageParam } from "openai/resources";
import { ChatId, ChatMessage, ChatTranslation } from "@shared/types/config";

export async function processTranslations({
  enabledChats,
}: {
  enabledChats: ChatId[];
}): Promise<ChatTranslation[]> {
  console.log(`Processing translations for chats:`, enabledChats);
  const translationsPromises = enabledChats.map((chatId) =>
    processChatTranslations(chatId)
  );

  return await Promise.all(translationsPromises);
}

async function processChatTranslations(
  chatId: ChatId
): Promise<ChatTranslation> {
  console.log(`Processing translations for chat:`, chatId);

  const messages = await messagesModel.recent({
    chatId,
    limit: 50,
    reverse: true,
  });

  if (messages.length === 0) {
    console.log(`No messages found for chat:`, chatId);
    return {
      chatId,
      messages: [],
    };
  }

  const translations: ChatMessage[] = [];
  const mappedMessages = messages.map(messageMapper.fromModel);
  for (const message of mappedMessages) {
    if (message.isFromMe) {
      translations.push(message);
      continue;
    }

    // Check for existing translation
    const existingTranslation = await prisma.messageTranslation.findFirst({
      where: {
        messageId: message.id,
      },
    });

    if (existingTranslation) {
      console.log(`Using existing translation for message:`, message.id);
      translations.push({
        ...message,
        content: existingTranslation.translatedText,
      });
      continue;
    }

    // Translate new message
    const systemMessage: ChatCompletionMessageParam = {
      role: `system`,
      content: [
        `You are a Korean to English translator.`,
        `Only respond with the translation, nothing else.`,
      ].join(`\n`),
    };

    const translatedText = await getGptCompletion({
      messages: [
        systemMessage,
        {
          role: `user`,
          content: `Translate the following Korean/English text to English. Only respond with the translation.\n\nText: ${
            message.content !== `` ? message.content : `(No text)`
          }`,
        },
      ],
    });

    // Store translation in database
    await prisma.messageTranslation.create({
      data: {
        messageId: message.id,
        originalText: message.content,
        translatedText,
        languageCode: `en`, // English is the target language
      },
    });

    translations.push({
      ...message,
      content: translatedText,
    });
  }

  return {
    chatId,
    messages: translations,
  };
}
