import { ElectronAPI } from "@electron-toolkit/preload";
import {
  ChatsConfig,
  QuickReplySuggestions,
  CheckUpSuggestions,
  TranslatedChats,
} from "@shared/types/config";

declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      getChatConfiguration: () => Promise<ChatsConfig>;
      setAutoChats: (chatIds: number[]) => Promise<number[]>;
      setQuickReplySuggestionChats: (
        chatIds: number[]
      ) => Promise<QuickReplySuggestions>;
      setCheckupSuggestionChats: (
        chatIds: number[]
      ) => Promise<CheckUpSuggestions>;
      onQuickReplySuggestionsUpdated: (
        callback: (
          event: Electron.IpcRendererEvent,
          suggestions: QuickReplySuggestions
        ) => void
      ) => () => void;
      onCheckupSuggestionsUpdated: (
        callback: (
          event: Electron.IpcRendererEvent,
          suggestions: CheckUpSuggestions
        ) => void
      ) => () => void;
      sendMessage: (phoneNumber: string, message: string) => Promise<void>;
      setTranslatedChats: (chatIds: number[]) => Promise<TranslatedChats>;
      onTranslatedChatsUpdated: (
        callback: (
          event: Electron.IpcRendererEvent,
          translations: TranslatedChats
        ) => void
      ) => () => void;
      sendTranslatedMessage: (
        phoneNumber: string,
        message: string
      ) => Promise<ChatMessage>;
    };
  }
}
