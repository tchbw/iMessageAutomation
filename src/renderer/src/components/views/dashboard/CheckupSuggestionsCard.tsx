import React from "react";
import { Card } from "@renderer/components/ui/card";
import { ChatsConfig } from "@shared/types/config";

type CheckupSuggestionsCardProps = {
  chatsConfig: ChatsConfig;
};

export function CheckupSuggestionsCard({
  chatsConfig,
}: CheckupSuggestionsCardProps): React.ReactElement {
  return (
    <Card>
      <h2 className="mb-2 text-xl font-semibold">Checkup Suggestions</h2>
      <p>
        {chatsConfig.checkUpSuggestions.suggestions.length === 0
          ? `No checkup suggestions available.`
          : `${chatsConfig.checkUpSuggestions.suggestions.length} suggestions available.`}
      </p>
    </Card>
  );
}
