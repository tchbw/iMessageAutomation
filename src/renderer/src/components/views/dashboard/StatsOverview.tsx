import { Card } from "@renderer/components/ui/card";
import { ChatsConfig } from "@shared/types/config";
import { MessageSquare, Zap } from "lucide-react";

type StatsOverviewProps = {
  chatsConfig: ChatsConfig;
};

export function StatsOverview({
  chatsConfig,
}: StatsOverviewProps): React.ReactElement {
  const stats = [
    {
      label: `Active Chats`,
      value: chatsConfig.chats.length,
      icon: MessageSquare,
      description: `Total monitored conversations`,
    },
    {
      label: `Automated Responses`,
      value: chatsConfig.automatedChats.length,
      icon: Zap,
      description: `Chats with auto-replies enabled`,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="p-6">
          <div className="flex items-center gap-4">
            <stat.icon className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <h3 className="font-semibold text-muted-foreground">
                {stat.label}
              </h3>
              <p className="text-sm text-muted-foreground">
                {stat.description}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
