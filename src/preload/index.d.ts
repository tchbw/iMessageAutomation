import { ElectronAPI } from "@electron-toolkit/preload";

declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      getChatConfiguration: () => Promise<ChatsConfig>;
      setAutoChats: (chatIds: number[]) => Promise<number[]>;
    };
  }
}
