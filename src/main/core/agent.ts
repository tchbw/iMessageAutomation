import db from "@main/init/db";
import { chat, chatMessageJoin, handle, message } from "@main/schemas/imessage";
import { getGptCompletion } from "@main/util/ai";
import { iMessageMapper, sendIMessage } from "@main/util/mac";
import { desc, eq } from "drizzle-orm";
import { ChatCompletionMessageParam } from "openai/resources";

export async function processIMessageChats(): Promise<void> {
  const chatResult = await db
    .select()
    .from(chat)
    .innerJoin(chatMessageJoin, eq(chatMessageJoin.chatId, chat.ROWID))
    .innerJoin(message, eq(chatMessageJoin.messageId, message.ROWID))
    .where(eq(chat.ROWID, 1))
    // .where(eq(chat.ROWID, 5))
    .orderBy(desc(message.date))
    .limit(50);

  // Put the messages into ascending order
  chatResult.reverse();

  const messages = chatResult.map(({ Message }) =>
    iMessageMapper.getMessageFromDbMessage(Message)
  );
  console.log(messages);

  if (messages[messages.length - 1].isFromMe) {
    return;
  }

  const conversation: string = messages
    .map(
      (message) =>
        // `${message.isFromMe ? `Me:` : `Friend:`}
        `${message.isFromMe ? `Me:` : `Hannah:`}
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
          `Respond with my response to Hannah. Do not include any other text other than a response to send directly to Hannah.`,
      },
    ],
  });

  const sendHandle = await db
    .select()
    .from(handle)
    .where(eq(handle.ROWID, messages[0]!.handleId))
    .limit(1);

  console.log(`Send Handle:`, sendHandle[0]!.id);
  console.log(completion);
  await sendIMessage({
    //   phoneNumber: `+16614762102`,
    phoneNumber: sendHandle[0]!.id,
    message: completion,
  });
}
