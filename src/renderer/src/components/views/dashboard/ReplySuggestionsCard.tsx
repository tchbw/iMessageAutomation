import React from "react";
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
import { ReplySuggestionItem } from "./ReplySuggestionItem";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@renderer/components/ui/accordion";
import { useEffect } from "react";

const FormSchema = z.object({
  chats: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: `You have to select at least one chat.`,
  }),
});

type ReplySuggestionsCardProps = {
  chatsConfig: ChatsConfig;
  onUpdateConfig: React.Dispatch<React.SetStateAction<ChatsConfig>>;
};

export function ReplySuggestionsCard({
  chatsConfig,
  onUpdateConfig,
}: ReplySuggestionsCardProps): React.ReactElement {
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  useEffect(() => {
    const unsubscribe = window.api.onQuickReplySuggestionsUpdated(
      (_, suggestions) => {
        console.log(`new suggestions`, suggestions);
        onUpdateConfig((prevConfig) => ({
          ...prevConfig,
          quickReplySuggestions: suggestions,
        }));
      }
    );

    console.log(unsubscribe);

    return unsubscribe;
  }, [onUpdateConfig]);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      chats: [],
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>): Promise<void> {
    const quickReplySuggestions = await window.api.setQuickReplySuggestionChats(
      data.chats.map(Number)
    );
    onUpdateConfig((prevConfig) => ({
      ...prevConfig,
      quickReplySuggestions,
    }));
    setIsSettingsOpen(false);
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Quick reply suggestions
          </CardTitle>
          <SettingsIcon
            className="h-4 w-4 cursor-pointer text-muted-foreground"
            onClick={() => setIsSettingsOpen(true)}
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <>
            {chatsConfig.quickReplySuggestions.suggestions.map((suggestion) => {
              const chat = chatsConfig.chats.find(
                (c) => c.id === suggestion.chatId
              );
              if (!chat) return null;

              return (
                <ReplySuggestionItem
                  key={suggestion.chatId}
                  chat={chat}
                  suggestion={suggestion}
                />
              );
            })}
            <Accordion type="single" collapsible>
              <AccordionItem value="enabled-chats">
                <AccordionTrigger className="text-sm font-medium text-muted-foreground/70">
                  Enabled chats
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-5">
                    {chatsConfig.quickReplySuggestions.enabledChats.map(
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
            <DialogTitle>Quick Reply Settings</DialogTitle>
            <DialogDescription>
              Select the chats where you want to enable quick reply suggestions.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit, (e) => {
                console.log(e);
              })}
              className="space-y-8"
            >
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
