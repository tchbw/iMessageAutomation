import { Card } from "@renderer/components/ui/card";
import { ScrollArea } from "@renderer/components/ui/scroll-area";
import dayjs from "@shared/init/dayjs";

// type RecentActivityProps = {
//   chatsConfig: ChatsConfig;
// };

export function RecentActivity(): React.ReactElement {
  // This would need to be replaced with actual activity data
  const activities = [
    {
      id: 1,
      type: `automated_reply`,
      chatName: `Toireasa`,
      timestamp: new Date(),
      message: `Automated reply sent`,
    },
    {
      id: 2,
      type: `checkup_suggestion`,
      chatName: `Hannah`,
      timestamp: new Date(Date.now() - 3600000),
      message: `Checkup reminder created`,
    },
  ];

  return (
    <Card className="p-6">
      <h3 className="font-semibold">Recent Activity</h3>
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-4 pt-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-4 border-b border-border pb-4 last:border-0"
            >
              <div className="flex-1">
                <p className="font-medium">{activity.chatName}</p>
                <p className="text-sm text-muted-foreground">
                  {activity.message}
                </p>
                <p className="text-xs text-muted-foreground">
                  {dayjs(activity.timestamp).fromNow()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
