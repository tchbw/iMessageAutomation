import { ElectronAPI } from "@electron-toolkit/preload";
import { QuickReplySuggestions } from "@shared/types/config";

declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      getChatConfiguration: () => Promise<ChatsConfig>;
      setAutoChats: (chatIds: number[]) => Promise<number[]>;
      setQuickReplySuggestionChats: (
        chatIds: number[]
      ) => Promise<QuickReplySuggestions>;
      onQuickReplySuggestionsUpdated: (
        callback: (
          event: Electron.IpcRendererEvent,
          suggestions: QuickReplySuggestions
        ) => void
      ) => () => void;
    };
  }
}
