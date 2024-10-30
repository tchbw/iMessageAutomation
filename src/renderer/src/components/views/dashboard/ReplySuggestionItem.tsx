import React from "react";
import { Button } from "@renderer/components/ui/button";
import { Input } from "@renderer/components/ui/input";
import { MessageSquare, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@renderer/components/ui/dialog";
import { Chat, ChatMessageSuggestion } from "@shared/types/config";
import { ScrollArea } from "@renderer/components/ui/scroll-area";

type ReplySuggestionItemProps = {
  chat: Chat;
  suggestion: ChatMessageSuggestion;
};

export function ReplySuggestionItem({
  chat,
  suggestion,
}: ReplySuggestionItemProps): React.ReactElement {
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
  const [response, setResponse] = React.useState(suggestion.suggestedResponse);

  const handleSendResponse = (): void => {
    // Implementation will be added later
    console.log(`Sending response for chat ${chat.id}:`, response);
  };

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
        {suggestion.pastMessagesPreview.slice(-4).map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.isFromMe ? `justify-end` : `justify-start`}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 ${
                msg.isFromMe
                  ? `bg-primary text-primary-foreground`
                  : `bg-secondary`
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          placeholder="Edit suggested response..."
          className="flex-1"
        />
        <Button size="icon" onClick={handleSendResponse}>
          <Send className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-h-[80vh] sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Chat History</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-2">
              {suggestion.pastMessagesPreview.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    msg.isFromMe ? `justify-end` : `justify-start`
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      msg.isFromMe
                        ? `bg-primary text-primary-foreground`
                        : `bg-secondary`
                    }`}
                  >
                    <p>{msg.content}</p>
                    <p className="mt-1 text-xs opacity-70">
                      {new Date(msg.date).toLocaleTimeString()}
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
