import React, { useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@renderer/components/ui/card";
import { SettingsIcon } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@renderer/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@renderer/components/ui/form";
import { Button } from "@renderer/components/ui/button";
import { Checkbox } from "@renderer/components/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChatsConfig } from "@shared/types/config";
import { CheckupSuggestionItem } from "./CheckupSuggestionItem";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@renderer/components/ui/accordion";

const FormSchema = z.object({
  chats: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: `You have to select at least one chat.`,
  }),
});

type CheckupSuggestionsCardProps = {
  chatsConfig: ChatsConfig;
  onUpdateConfig: React.Dispatch<React.SetStateAction<ChatsConfig>>;
};

export function CheckupSuggestionsCard({
  chatsConfig,
  onUpdateConfig,
}: CheckupSuggestionsCardProps): React.ReactElement {
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  useEffect(() => {
    const unsubscribe = window.api.onCheckupSuggestionsUpdated(
      (_, suggestions) => {
        console.log(`new checkup suggestions`, suggestions);
        onUpdateConfig((prevConfig) => ({
          ...prevConfig,
          checkUpSuggestions: suggestions,
        }));
      }
    );

    return unsubscribe;
  }, [onUpdateConfig]);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      chats: [],
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>): Promise<void> {
    const checkUpSuggestions = await window.api.setCheckupSuggestionChats(
      data.chats.map(Number)
    );
    onUpdateConfig((prevConfig) => ({
      ...prevConfig,
      checkUpSuggestions,
    }));
    setIsSettingsOpen(false);
  }

  const handleRemoveSuggestion = (chatId: number): void => {
    onUpdateConfig((prevConfig) => ({
      ...prevConfig,
      checkUpSuggestions: {
        ...prevConfig.checkUpSuggestions,
        suggestions: prevConfig.checkUpSuggestions.suggestions.filter(
          (s) => s.chatId !== chatId
        ),
      },
    }));
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Checkup Suggestions
          </CardTitle>
          <SettingsIcon
            className="h-4 w-4 cursor-pointer text-muted-foreground"
            onClick={() => setIsSettingsOpen(true)}
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <>
            {chatsConfig.checkUpSuggestions.suggestions.map((suggestion) => {
              const chat = chatsConfig.chats.find(
                (c) => c.id === suggestion.chatId
              );
              if (!chat) return null;

              return (
                <CheckupSuggestionItem
                  key={suggestion.chatId}
                  chat={chat}
                  suggestion={suggestion}
                  onRemove={() => handleRemoveSuggestion(suggestion.chatId)}
                />
              );
            })}
            <Accordion type="single" collapsible>
              <AccordionItem value="enabled-chats">
                <AccordionTrigger>Enabled Chats</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-5">
                    {chatsConfig.checkUpSuggestions.enabledChats.map(
                      (chatId) => {
                        const chat = chatsConfig.chats.find(
                          (c) => c.id === chatId
                        );
                        return chat ? (
                          <li key={chat.id}>{chat.chatName}</li>
                        ) : null;
                      }
                    )}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </>
        </CardContent>
      </Card>

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Checkup Settings</DialogTitle>
            <DialogDescription>
              Select the chats where you want to enable checkup suggestions.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="chats"
                render={() => (
                  <FormItem className="max-h-[50vh] overflow-y-auto">
                    {chatsConfig?.chats.map((chat) => (
                      <FormField
                        key={chat.id}
                        control={form.control}
                        name="chats"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={chat.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(
                                    chat.id.toString()
                                  )}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([
                                          ...field.value,
                                          chat.id.toString(),
                                        ])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) =>
                                              value !== chat.id.toString()
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {chat.chatName}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Submit</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
