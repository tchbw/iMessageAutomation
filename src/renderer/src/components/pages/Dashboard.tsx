import { Card } from "@renderer/components/ui/card";
import { Skeleton } from "@renderer/components/ui/skeleton";
import { TypographyH2 } from "@renderer/components/ui/typography/H2";
import { AutomatedChatsCard } from "@renderer/components/views/dashboard/AutomatedChatsCard";
import { CheckupSuggestionsCard } from "@renderer/components/views/dashboard/CheckupSuggestionsCard";
import { ReplySuggestionsCard } from "@renderer/components/views/dashboard/ReplySuggestionsCard";
import { ChatsConfig } from "@shared/types/config";
import { useQuery } from "@tanstack/react-query";
import React from "react";

function Dashboard(): React.ReactElement {
  const [chatsConfig, setChatsConfig] = React.useState<ChatsConfig>({
    automatedChats: [],
    ignoredChats: [],
    checkUpSuggestions: {
      enabledChats: [],
      suggestions: [],
    },
    quickReplySuggestions: {
      enabledChats: [],
      suggestions: [],
    },
    chats: [],
  });

  async function getChatConfiguration(): Promise<ChatsConfig> {
    const data = await window.api.getChatConfiguration();
    setChatsConfig(data);
    return data;
  }

  const query = useQuery({
    queryKey: [`getChatConfiguration`],
    queryFn: getChatConfiguration,
  });

  if (query.isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-4 sm:col-span-1">
            <Card className="p-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </Card>
          </div>
          <div className="sm:col-span-1">
            <Card className="p-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <TypographyH2>Dashboard</TypographyH2>
      <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-4 sm:col-span-1">
          <AutomatedChatsCard
            chatsConfig={chatsConfig}
            onUpdateConfig={setChatsConfig}
          />
          <ReplySuggestionsCard
            chatsConfig={chatsConfig}
            onUpdateConfig={setChatsConfig}
          />
        </div>
        <div className="sm:col-span-1">
          <CheckupSuggestionsCard chatsConfig={chatsConfig} />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
