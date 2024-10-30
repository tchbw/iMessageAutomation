import db from "@main/init/db";
import { getGptCompletion } from "@main/util/ai";
import { iMessageUtil } from "@main/util/imessage";
import { sendIMessage } from "@main/util/mac";
import { handle } from "@shared/schemas/imessage";
import { ChatId } from "@shared/types/config";
import { eq } from "drizzle-orm";
import { ChatCompletionMessageParam } from "openai/resources";

export async function processAutoMessages({
  automatedChats,
}: {
  automatedChats: ChatId[];
}): Promise<void> {
  console.log(`Processing Auto Messages for Chats:`, automatedChats);
  for (const chatId of automatedChats) {
    await processAutoMessage({ chatId });
  }
}

async function processAutoMessage({
  chatId,
}: {
  chatId: ChatId;
}): Promise<void> {
  console.log(`Processing Auto Message for Chat:`, chatId);
  const messages = await iMessageUtil.getRecentChatMessages({
    chatId,
    limit: 75,
  });

  // If the last message is from me, we don't need to send a new message
  if (messages[messages.length - 1].isFromMe) {
    return;
  }

  const sendHandle = await db
    .select()
    .from(handle)
    .where(eq(handle.ROWID, messages[0]!.handleId))
    .limit(1);

  const conversation: string = messages
    .map(
      (message) =>
        // `${message.isFromMe ? `Me:` : `Friend:`}
        `${message.isFromMe ? `Me:` : `${sendHandle[0]!.id}:`}
  ${message.content}`
    )
    .join(`\n\n`);

  //   const systemMessage: Message = {
  //     role: 'system',
  //     content: [
  //       'You are a helpful assistant that roleplays as me, a 27 year old Asian male who lives in San Francisco and is trying to found my own startup.\n',
  //       'I am a software engineer by trade\n',
  //       'You are given a list of messages between me and a friend, and your job is to roleplay as me and respond to them in a way that is consistent with who I am.\n',
  //       'Your responses should be honest and reflect who I am being as a person, not just a helpful assistant.\n',
  //       'You should also be very friendly and warm.\n',
  //       'Do not reply with anything other than my responses to my friend. Only reply with a message response that would be sent directly to them.\n',
  //       'Here is the current conversation:\n',
  //       `=========\n\n${conversation}\n\n=========\n\n`
  //     ].join()
  //   }

  const systemMessage: ChatCompletionMessageParam = {
    role: `system`,
    content: [
      `You are a helpful assistant that roleplays as me, a 27 year old Asian male who lives in San Francisco.\n`,
      `I am a software engineer by trade, and have a girlfriend named Hannah.\n`,
      `You are given a list of messages between me and Hannah, and your job is to roleplay as me and respond to Hannah in a way that is consistent with who I am.\n`,
      `Your responses should be honest and reflect who I am as a person, not just a helpful assistant.\n`,
      `You should also be very friendly and warm, and show lots of love for Hannah.\n`,
      `Match the personality of previous messages from me in the conversation, and roughly match the message length and tone.\n`,
      `Do not reply with anything other than my responses to Hannah. Only reply with a message response that would be sent directly to Hannah.\n`,
      `Here is the current conversation:\n`,
      `=========\n\n${conversation}\n\n=========\n\n`,
    ].join(),
  };

  console.log(`System Message:`, systemMessage);
  const completion = await getGptCompletion({
    messages: [
      systemMessage,
      {
        role: `user`,
        content:
          //   'Respond with my response to my friend. Do not include any other text other than a response to send directly to them.'
          `Respond with my response to Hannah. Do not include any other text other than a response to send directly to Hannah. Use my past messages to mimic my texting style as closely as possible.`,
      },
    ],
  });

  console.log(`Send Handle:`, sendHandle[0]!.id);
  console.log(completion);
  await sendIMessage({
    phoneNumber: sendHandle[0]!.id,
    message: completion,
  });
}
