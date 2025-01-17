import React from "react";
import { Button } from "@renderer/components/ui/button";
import { MessageSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@renderer/components/ui/dialog";
import { Chat, ChatMessage } from "@shared/types/config";
import { ScrollArea } from "@renderer/components/ui/scroll-area";

type BaseSuggestionItemProps = {
  chat: Chat;
  chatMessages: ChatMessage[];
  children?: React.ReactNode;
};

export function BaseSuggestionItem({
  chat,
  chatMessages,
  children,
}: BaseSuggestionItemProps): React.ReactElement {
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{chat.chatName}</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsPreviewOpen(true)}
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          View Chat
        </Button>
      </div>

      <div className="space-y-2 rounded-md bg-muted p-3">
        {chatMessages.slice(-4).map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.isFromMe ? `justify-end` : `justify-start`}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 ${
                msg.isFromMe
                  ? `bg-blue-600 text-white`
                  : `bg-gray-200 text-gray-900`
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      {children}

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-h-[80vh] sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Chat History</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-2">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    msg.isFromMe ? `justify-end` : `justify-start`
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      msg.isFromMe
                        ? `bg-blue-600 text-white`
                        : `bg-gray-200 text-gray-900`
                    }`}
                  >
                    <p>{msg.content}</p>
                    <p className="mt-1 text-xs opacity-70">
                      {new Date(msg.date).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
