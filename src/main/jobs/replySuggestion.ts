import db from "@main/init/db";
import chatHandlesModel from "@main/models/chatHandle";
import { getGptCompletion } from "@main/util/ai";
import { messageMapper } from "@main/util/mappers/message";
import { chat, chatMessageJoin, message } from "@shared/schemas/imessage";
import {
  ChatId,
  ChatMessageSuggestion,
  QuickReplySuggestions,
} from "@shared/types/config";
import { desc, eq } from "drizzle-orm";
import { ChatCompletionMessageParam } from "openai/resources";

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

  const messages = await db
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
    .limit(50);

  if (messages.length === 0) {
    console.log(`No messages found for chat:`, chatId);
    return null;
  }

  const lastMessage = messages[0]!;
  if (lastMessage.isFromMe) {
    console.log(`No need for quick reply message for chat:`, chatId);
    return null;
  }

  const sendHandle = await chatHandlesModel.get(messages[0]!.handleId);

  const conversation: string = messages
    .reverse()
    .map(
      (message) =>
        `${message.isFromMe ? `Me:` : `${sendHandle.id}:`}
  ${message.text}`
    )
    .join(`\n\n`);

  const systemMessage: ChatCompletionMessageParam = {
    role: `system`,
    content: [
      `You are a helpful assistant that roleplays as me, a 27 year old Asian male who lives in San Francisco.\n`,
      `I am a software engineer by trade.\n`,
      `You are given a list of messages between me and a friend, and your job is to roleplay as me and respond to them in a way that is consistent with who I am.\n`,
      `Your responses should be honest and reflect who I am as a person, not just a helpful assistant.\n`,
      `You should also be very friendly and warm.\n`,
      `Match the personality of previous messages from me in the conversation, and roughly match the message length and tone.\n`,
      `Do not reply with anything other than my responses to my friend. Only reply with a message response that would be sent directly to them.\n`,
      `Here is the current conversation:\n`,
      `=========\n\n${conversation}\n\n=========\n\n`,
    ].join(``),
  };

  console.log(`System Message:`, systemMessage);
  const completion = await getGptCompletion({
    messages: [
      systemMessage,
      {
        role: `user`,
        content: `Respond with my quick reply message to my friend. It's been more than 6 hours since their last message. Be friendly and natural, as if continuing the conversation. Do not include any other text other than a response to send directly to them. Use my past messages to mimic my texting style as closely as possible.`,
      },
    ],
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
