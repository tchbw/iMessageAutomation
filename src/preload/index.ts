import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from "@electron-toolkit/preload";
import { ChatsConfig, chatsConfigSchema } from "@shared/types/config";

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
