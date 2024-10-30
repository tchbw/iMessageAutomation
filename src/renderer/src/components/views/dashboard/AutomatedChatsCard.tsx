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

const FormSchema = z.object({
  chats: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: `You have to select at least one chat.`,
  }),
});

type AutomatedChatsCardProps = {
  chatsConfig: ChatsConfig;
  onUpdateConfig: (newConfig: ChatsConfig) => void;
};

export function AutomatedChatsCard({
  chatsConfig,
  onUpdateConfig,
}: AutomatedChatsCardProps): React.ReactElement {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      chats: [],
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>): Promise<void> {
    const autoChats = await window.api.setAutoChats(data.chats.map(Number));
    onUpdateConfig({
      ...chatsConfig,
      automatedChats: autoChats,
    });
    setIsModalOpen(false);
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Auto chats</CardTitle>
          <SettingsIcon
            className="h-4 w-4 cursor-pointer text-muted-foreground"
            onClick={() => setIsModalOpen(true)}
          />
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5">
            {chatsConfig.automatedChats.map((chatId) => {
              const chat = chatsConfig.chats.find((c) => c.id === chatId);
              return chat ? <li key={chat.id}>{chat.chatName}</li> : null;
            })}
          </ul>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Chat Configuration</DialogTitle>
            <DialogDescription>
              Select the chats you want to include.
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
