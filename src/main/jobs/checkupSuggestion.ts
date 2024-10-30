import db from "@main/init/db";
import chatHandlesModel from "@main/models/chatHandle";
import { getGptCompletion } from "@main/util/ai";
import { messageMapper } from "@main/util/mappers/message";
import { chat, chatMessageJoin, message } from "@shared/schemas/imessage";
import {
  ChatId,
  ChatMessageSuggestion,
  CheckUpSuggestions,
} from "@shared/types/config";
import { desc, eq } from "drizzle-orm";
import { ChatCompletionMessageParam } from "openai/resources";
import dayjs from "@shared/init/dayjs";

export async function processCheckupSuggestions(
  checkUpSuggestions: CheckUpSuggestions
): Promise<ChatMessageSuggestion[]> {
  console.log(
    `Processing Checkup Messages for Chats:`,
    checkUpSuggestions.enabledChats
  );
  const suggestionsPromises = checkUpSuggestions.enabledChats.map((chatId) =>
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
  const lastMessageDate = new Date(Number(lastMessage.date) * 1000);
  const weeksSinceLastMessage = dayjs().diff(dayjs(lastMessageDate), `week`);

  if (weeksSinceLastMessage < 2) {
    console.log(`Last message too recent for checkup:`, chatId);
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
      `You are given a list of messages between me and a friend, and your job is to roleplay as me and create a friendly checkup message since we haven't talked in a while.\n`,
      `Your responses should be honest and reflect who I am as a person, not just a helpful assistant.\n`,
      `You should be very friendly and warm, acknowledging the time that has passed.\n`,
      `Match the personality of previous messages from me in the conversation.\n`,
      `Do not reply with anything other than my responses. Only reply with a message response that would be sent directly to them.\n`,
      `Here is our last conversation:\n`,
      `=========\n\n${conversation}\n\n=========\n\n`,
    ].join(``),
  };

  const completion = await getGptCompletion({
    messages: [
      systemMessage,
      {
        role: `user`,
        content: `Create a friendly checkup message since it's been ${weeksSinceLastMessage} weeks since we last talked. Reference something from our previous conversation if relevant. Be natural and casual.`,
      },
    ],
  });

  return {
    chatId: chatId,
    suggestedResponse: completion,
    pastMessagesPreview: messages.map(messageMapper.fromModel),
  };
}
