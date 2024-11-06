import React from "react";
import { Chat, ChatTranslation } from "@shared/types/config";
import { BaseSuggestionItem } from "./BaseSuggestionItem";
import { Button } from "@renderer/components/ui/button";
import { Input } from "@renderer/components/ui/input";
import { Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
} from "@renderer/components/ui/form";

const formSchema = z.object({
  response: z.string().min(1, `Response cannot be empty`),
});

type TranslatedChatsItemProps = {
  chat: Chat;
  translation: ChatTranslation;
};

export function TranslatedChatsItem({
  chat,
  translation,
}: TranslatedChatsItemProps): React.ReactElement {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const handleSendResponse = async (
    values: z.infer<typeof formSchema>
  ): Promise<void> => {
    try {
      setIsSubmitting(true);
      const sentMessage = await window.api.sendTranslatedMessage(
        chat.chatName,
        values.response
      );

      // Add new message and remove first if over 50
      translation.messages.push(sentMessage);
      if (translation.messages.length > 50) {
        translation.messages.shift();
      }

      form.reset();
    } catch (error) {
      console.error(`Failed to send translated message:`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseSuggestionItem chat={chat} chatMessages={translation.messages}>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSendResponse)}
          className="mt-4 flex gap-2"
        >
          <FormField
            control={form.control}
            name="response"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input placeholder="Type your response..." {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <Button type="submit" size="icon" disabled={isSubmitting}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </Form>
    </BaseSuggestionItem>
  );
}
