import { openai } from "@main/init/openai";
import { ChatCompletionMessageParam } from "openai/resources";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

// export async function getGptCompletion({ messages }: { messages: Message[] }): Promise<string> {
//   const ollama = new Ollama()
//   const response = await ollama.chat({
//     model: 'llama3.1',
//     messages
//   })

//   return response.message.content
// }

export async function getGptCompletion({
  messages,
}: {
  messages: ChatCompletionMessageParam[];
}): Promise<string> {
  // const ollama = new Ollama()
  // const response = await ollama.chat({
  //   model: 'llama3.1',
  //   messages
  // })

  // return response.message.content
  const response = await openai.chat.completions.create({
    model: `gpt-4o-mini`,
    messages,
  });
  return response.choices[0].message.content!;
}

export async function getStructuredGptCompletion<T>({
  messages,
  schema,
}: {
  messages: ChatCompletionMessageParam[];
  schema: z.ZodSchema<T>;
}): Promise<T> {
  const response = await openai.beta.chat.completions.parse({
    messages,
    model: `gpt-4o-mini`,
    response_format: zodResponseFormat(schema, `Response`),
  });
  return response.choices[0]!.message.parsed!;
}
