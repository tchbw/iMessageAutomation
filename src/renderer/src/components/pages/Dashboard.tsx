import { Card } from "@renderer/components/ui/card";
import { Skeleton } from "@renderer/components/ui/skeleton";
import { TypographyH2 } from "@renderer/components/ui/typography/H2";
import { AutomatedChatsCard } from "@renderer/components/views/dashboard/AutomatedChatsCard";
import { CheckupSuggestionsCard } from "@renderer/components/views/dashboard/CheckupSuggestionsCard";
import { RecentActivity } from "@renderer/components/views/dashboard/RecentActivity";
import { ReplySuggestionsCard } from "@renderer/components/views/dashboard/ReplySuggestionsCard";
import { StatsOverview } from "@renderer/components/views/dashboard/StatsOverview";
import { TranslatedChatsCard } from "@renderer/components/views/dashboard/TranslatedChatsCard";
import { ChatsConfig } from "@shared/types/config";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

function Dashboard(): React.ReactElement {
  const [chatsConfig, setChatsConfig] = useState<ChatsConfig>({
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
    translatedChats: {
      enabledChats: [],
      translations: [],
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
    return (
      <div className="container mx-auto p-6">
        <Card className="p-6">
          <div className="text-center text-destructive">
            <h3 className="text-lg font-semibold">Error Loading Dashboard</h3>
            <p className="text-sm text-muted-foreground">
              {query.error.message}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-8 p-6">
      <div className="flex items-center justify-between">
        <TypographyH2>Dashboard</TypographyH2>
        <LastUpdatedIndicator date={query.dataUpdatedAt} />
      </div>

      <StatsOverview chatsConfig={chatsConfig} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <ReplySuggestionsCard
            chatsConfig={chatsConfig}
            onUpdateConfig={setChatsConfig}
          />

          <CheckupSuggestionsCard
            chatsConfig={chatsConfig}
            onUpdateConfig={setChatsConfig}
          />

          <TranslatedChatsCard
            chatsConfig={chatsConfig}
            onUpdateConfig={setChatsConfig}
          />
        </div>
        <div className="space-y-6 lg:col-span-1">
          <AutomatedChatsCard
            chatsConfig={chatsConfig}
            onUpdateConfig={setChatsConfig}
          />

          <RecentActivity />
        </div>
      </div>
    </div>
  );
}

function LastUpdatedIndicator({
  date,
}: {
  date?: number;
}): React.ReactElement | null {
  if (!date) return null;

  return (
    <span className="text-sm text-muted-foreground">
      Last updated: {new Date(date).toLocaleTimeString()}
    </span>
  );
}

export default Dashboard;
