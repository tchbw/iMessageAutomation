import { electronAPI } from "@electron-toolkit/preload";
import {
  ChatsConfig,
  chatsConfigSchema,
  QuickReplySuggestions,
  CheckUpSuggestions,
  ChatTranslations,
  ChatMessage,
} from "@shared/types/config";
import { contextBridge, ipcRenderer } from "electron";

// Custom APIs for renderer
const api = {
  getChatConfiguration: async (): Promise<ChatsConfig> => {
    return chatsConfigSchema.parse(
      await ipcRenderer.invoke(`get-chat-configuration`)
    );
  },

  setAutoChats: async (chatIds: number[]): Promise<number[]> => {
    return await ipcRenderer.invoke(`set-auto-chats`, chatIds);
  },

  setQuickReplySuggestionChats: async (
    chatIds: number[]
  ): Promise<QuickReplySuggestions> => {
    return await ipcRenderer.invoke(`set-quick-reply-chats`, chatIds);
  },

  setCheckupSuggestionChats: async (
    chatIds: number[]
  ): Promise<CheckUpSuggestions> => {
    return await ipcRenderer.invoke(`set-checkup-chats`, chatIds);
  },

  setTranslatedChats: async (chatIds: number[]): Promise<ChatTranslations> => {
    return await ipcRenderer.invoke(`set-translated-chats`, chatIds);
  },

  onQuickReplySuggestionsUpdated: (
    callback: (
      event: Electron.IpcRendererEvent,
      suggestions: QuickReplySuggestions
    ) => void
  ): (() => void) => {
    ipcRenderer.on(`quick-reply-suggestions-updated`, callback);
    return () => {
      ipcRenderer.removeListener(`quick-reply-suggestions-updated`, callback);
    };
  },

  onCheckupSuggestionsUpdated: (
    callback: (
      event: Electron.IpcRendererEvent,
      suggestions: CheckUpSuggestions
    ) => void
  ): (() => void) => {
    ipcRenderer.on(`checkup-suggestions-updated`, callback);
    return () => {
      ipcRenderer.removeListener(`checkup-suggestions-updated`, callback);
    };
  },

  onTranslatedChatsUpdated: (
    callback: (
      event: Electron.IpcRendererEvent,
      translations: ChatTranslations
    ) => void
  ): (() => void) => {
    ipcRenderer.on(`translated-chats-updated`, callback);
    return () => {
      ipcRenderer.removeListener(`translated-chats-updated`, callback);
    };
  },

  sendMessage: async (phoneNumber: string, message: string): Promise<void> => {
    await ipcRenderer.invoke(`send-message`, { phoneNumber, message });
  },

  sendTranslatedMessage: async (
    phoneNumber: string,
    message: string
  ): Promise<ChatMessage> => {
    return await ipcRenderer.invoke(`send-translated-message`, {
      phoneNumber,
      message,
    });
  },
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld(`electron`, electronAPI);
    contextBridge.exposeInMainWorld(`api`, api);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.api = api;
}
