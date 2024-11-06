import React from "react";
import { Button } from "@renderer/components/ui/button";
import { Input } from "@renderer/components/ui/input";
import { Send } from "lucide-react";
import { Chat, ChatMessageSuggestion } from "@shared/types/config";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
} from "@renderer/components/ui/form";
import { BaseSuggestionItem } from "./BaseSuggestionItem";

const formSchema = z.object({
  response: z.string().min(1, `Response cannot be empty`),
});

type CheckupSuggestionItemProps = {
  chat: Chat;
  suggestion: ChatMessageSuggestion;
  onRemove: () => void;
};

export function CheckupSuggestionItem({
  chat,
  suggestion,
  onRemove,
}: CheckupSuggestionItemProps): React.ReactElement {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      response: suggestion.suggestedResponse,
    },
  });

  const handleSendResponse = async (
    values: z.infer<typeof formSchema>
  ): Promise<void> => {
    try {
      setIsSubmitting(true);
      await window.api.sendMessage(chat.chatName, values.response);
      form.reset(); // Clear the form after successful send
      onRemove(); // Remove this suggestion after successful send
    } catch (error) {
      console.error(`Failed to send checkup message:`, error);
      // You might want to add error handling UI here
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseSuggestionItem
      chat={chat}
      chatMessages={suggestion.pastMessagesPreview}
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSendResponse)}
          className="flex gap-2"
        >
          <FormField
            control={form.control}
            name="response"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input
                    placeholder="Edit suggested checkup message..."
                    {...field}
                  />
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
