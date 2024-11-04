import chatHandlesModel from "@main/models/chatHandle";
import { getGptCompletion, getStructuredGptCompletion } from "@main/util/ai";
import { ChatMessageModel } from "@shared/types/chat";
import { ChatCompletionMessageParam } from "openai/resources";
import { z } from "zod";

class ImpersonationService {
  async generateResponse({
    pastMessages,
  }: {
    pastMessages: ChatMessageModel[];
  }): Promise<string> {
    const sendHandle = await chatHandlesModel.get(pastMessages[0]!.handleId);

    const conversation: string = pastMessages
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
        `I am a software engineer by trade.`,
      ].join(``),
    };

    const userMessage: ChatCompletionMessageParam = {
      role: `user`,
      content: [
        `You are given a list of messages between me and a friend, and your job is to roleplay as me and respond to them in a way that is consistent with who I am.\n`,
        `Your responses should reflect who I am as a person, not just a helpful assistant.\n`,
        `Match the personality of previous messages from me in the conversation, and roughly match the message length and tone.\n`,
        `Do not reply with anything other than my responses to my friend. Only reply with a message response that would be sent directly to them.\n`,
        `Respond with my quick reply message to my friend. It's been more than 6 hours since their last message.`,
        `Do not include any other text other than a response to send directly to them.`,
        `Use my past messages to mimic my texting style as closely as possible.`,
        `\n\n`,
        `Here is the current conversation:\n`,
        `=========\n\n${conversation}\n\n=========\n\n`,
        `My response:\n`,
      ].join(``),
    };

    const completion = await getGptCompletion({
      messages: [systemMessage, userMessage],
    });

    const verificationCompletion = await getStructuredGptCompletion({
      messages: [
        {
          role: `system`,
          content: [
            `You are an expert in impersonation.\n`,
            `You will be given a text message chat of mine, along with a response`,
            ` generated on my behalf by an AI assistant.`,
            `Your job is to determine whether the response is consistent with my personality based on my previous messages.\n`,
            `Make sure the response length and tone is consistent and could pass easily as a message from me.\n`,
            `If the response is not consistent with my personality, also return a reason why it's not consistent.`,
            `Make sure to return your response as valid JSON.`,
          ].join(``),
        },
        {
          role: `user`,
          content: [
            `Here is the conversation:\n`,
            `=========\n\n${conversation}\n\n==== END CONVERSATION =====\n\n`,
            `And here is the response generated by the AI assistant:\n`,
            `=========\n\n${completion}\n\n==== END RESPONSE =====\n\n`,
            `Is this response consistent with my personality? If not, also return a reason why it's not consistent.`,
          ].join(``),
        },
      ],
      schema: z.object({
        result: z.discriminatedUnion(`isConsistent`, [
          z.object({ isConsistent: z.literal(true) }),
          z.object({ isConsistent: z.literal(false), reason: z.string() }),
        ]),
      }),
    });

    if (verificationCompletion.result.isConsistent) {
      console.log(`Verification of original response succeeded. Returning it.`);
      return completion;
    }

    const updatedCompletion = await getGptCompletion({
      messages: [
        {
          role: `system`,
          content: [
            `You are an expert in impersonation.\n`,
            `Another assistant read my chat messages with someone, and generated a response on my behalf.\n`,
            `However, the response did not accurately reflect my personality and texting style.\n`,
            `You job is to take my feedback and generate a better response.\n`,
            `Make sure to return your response as valid JSON.`,
          ].join(``),
        },
        {
          role: `user`,
          content: [
            `Here is the conversation:\n`,
            `=========\n\n${conversation}\n\n==== END CONVERSATION =====\n\n`,
            `And here is the response generated by the AI assistant:\n`,
            `=========\n\n${completion}\n\n==== END RESPONSE =====\n\n`,
            `Here is my feedback about this response: ${verificationCompletion.result.reason}\n`,
            `Generate a new response that addresses my feedback.`,
            `Reply with only the updated message that I would send directly to the person I am messaging. Do not include any other text except the updated response.`,
          ].join(``),
        },
      ],
    });

    console.log(`Updated completion:`, updatedCompletion);
    return updatedCompletion;
  }
}

const impersonationService = new ImpersonationService();
export default impersonationService;