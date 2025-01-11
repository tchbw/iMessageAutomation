import { electronApp, is, optimizer } from "@electron-toolkit/utils";
import { app, BrowserWindow, ipcMain, shell } from "electron";
import { join } from "path";
import icon from "../../resources/icon.png?asset";

import { prisma } from "@main/init/prisma";
import { processAutoMessages } from "@main/jobs/autoMessage";
import { processCheckupSuggestions } from "@main/jobs/checkupSuggestion";
import { processReplySuggestions } from "@main/jobs/replySuggestion";
import { processTranslations } from "@main/jobs/translation";
import chatsModel from "@main/models/chat";
import { sendIMessage } from "@main/util/mac";
import { chatModelMapper } from "@main/util/mappers/chat";
import { ChatsConfig } from "@shared/types/config";
import schedule from "node-schedule";

let chatsConfigState: ChatsConfig = {
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
  translatedChats: {
    enabledChats: [],
    translations: [],
  },
};

async function createWindow(): Promise<BrowserWindow> {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === `linux` ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, `../preload/index.js`),
      sandbox: false,
    },
  });

  mainWindow.on(`ready-to-show`, () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: `deny` };
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env[`ELECTRON_RENDERER_URL`]) {
    mainWindow.loadURL(process.env[`ELECTRON_RENDERER_URL`]);
  } else {
    mainWindow.loadFile(join(__dirname, `../renderer/index.html`));
  }

  return mainWindow;
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId(`com.electron`);

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on(`browser-window-created`, (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  const chats = await chatsModel.all();

  // Get configured chats from database
  const [autoChats, replyChats, checkupChats, translatedChats] =
    await Promise.all([
      prisma.configuredAutomatedChat.findMany(),
      prisma.configuredReplySuggestionChat.findMany(),
      prisma.configuredCheckupSuggestionChat.findMany(),
      prisma.configuredTranslatedChat.findMany(),
    ]);

  const replySuggestions = await processReplySuggestions(
    replyChats.map((c) => c.chatId)
  );
  const checkupSuggestions = await processCheckupSuggestions(
    checkupChats.map((c) => c.chatId)
  );
  const translations = await processTranslations({
    enabledChats: translatedChats.map((c) => c.chatId),
  });

  chatsConfigState = {
    automatedChats: autoChats.map((c) => c.chatId),
    ignoredChats: [],
    checkUpSuggestions: {
      enabledChats: checkupChats.map((c) => c.chatId),
      suggestions: checkupSuggestions,
    },
    quickReplySuggestions: {
      enabledChats: replyChats.map((c) => c.chatId),
      suggestions: replySuggestions,
    },
    chats: chats.map(chatModelMapper.fromModel),
    translatedChats: {
      enabledChats: translatedChats.map((c) => c.chatId),
      translations,
    },
  };

  // Handlers
  ipcMain.handle(`get-chat-configuration`, async () => {
    return chatsConfigState;
  });

  ipcMain.handle(`set-auto-chats`, async (_event, chatIds: number[]) => {
    await prisma.configuredAutomatedChat.deleteMany();
    await prisma.configuredAutomatedChat.createMany({
      data: chatIds.map((chatId) => ({ chatId })),
    });

    chatsConfigState.automatedChats = chatIds;
    return chatIds;
  });

  ipcMain.handle(`set-quick-reply-chats`, async (_event, chatIds: number[]) => {
    await prisma.configuredReplySuggestionChat.deleteMany();
    await prisma.configuredReplySuggestionChat.createMany({
      data: chatIds.map((chatId) => ({ chatId })),
    });

    chatsConfigState.quickReplySuggestions = {
      enabledChats: chatIds,
      suggestions: chatsConfigState.quickReplySuggestions.suggestions,
    };
    return chatsConfigState.quickReplySuggestions;
  });

  ipcMain.handle(`set-checkup-chats`, async (_event, chatIds: number[]) => {
    await prisma.configuredCheckupSuggestionChat.deleteMany();
    await prisma.configuredCheckupSuggestionChat.createMany({
      data: chatIds.map((chatId) => ({ chatId })),
    });

    chatsConfigState.checkUpSuggestions = {
      enabledChats: chatIds,
      suggestions: chatsConfigState.checkUpSuggestions.suggestions,
    };
    return chatsConfigState.checkUpSuggestions;
  });

  ipcMain.handle(
    `send-message`,
    async (
      _event,
      { phoneNumber, message }: { phoneNumber: string; message: string }
    ) => {
      await sendIMessage({ phoneNumber, message });
    }
  );

  // ipcMain.handle(`set-translated-chats`, async (_event, chatIds: number[]) => {
  //   await prisma.configuredTranslatedChat.deleteMany();
  //   await prisma.configuredTranslatedChat.createMany({
  //     data: chatIds.map((chatId) => ({
  //       chatId,
  //       targetLanguage: `ko`, // Default to Korean
  //     })),
  //   });

  //   chatsConfigState.translatedChats = {
  //     enabledChats: chatIds,
  //     translations: chatsConfigState.translatedChats.translations,
  //   };
  //   return chatsConfigState.translatedChats;
  // });

  // ipcMain.handle(
  //   `send-translated-message`,
  //   async (
  //     _event,
  //     { phoneNumber, message }: { phoneNumber: string; message: string }
  //   ): Promise<ChatMessage> => {
  //     const translatedMessage = await getGptLanguageTranslation({
  //       text: message,
  //       targetLanguage: `ko`, // We can make this configurable later
  //     });

  //     await sendIMessage({ phoneNumber, message: translatedMessage });
  //     return {
  //       id: 0,
  //       content: message,
  //       date: new Date(),
  //       handleId: 0,
  //       isFromMe: true,
  //     };
  //   }
  // );

  const mainWindow = await createWindow();

  // Update scheduled jobs to fetch from database
  schedule.scheduleJob(`*/30 * * * * *`, async () => {
    const autoChats = await prisma.configuredAutomatedChat.findMany();
    await processAutoMessages({
      automatedChats: autoChats.map((c) => c.chatId),
    });
  });

  schedule.scheduleJob(`*/30 * * * * *`, async () => {
    const replyChats = await prisma.configuredReplySuggestionChat.findMany();
    const suggestions = await processReplySuggestions(
      replyChats.map((c) => c.chatId)
    );

    chatsConfigState.quickReplySuggestions = {
      enabledChats: replyChats.map((c) => c.chatId),
      suggestions,
    };
    mainWindow.webContents.send(
      `quick-reply-suggestions-updated`,
      chatsConfigState.quickReplySuggestions
    );
  });

  schedule.scheduleJob(`*/30 * * * * *`, async () => {
    const checkupChats =
      await prisma.configuredCheckupSuggestionChat.findMany();
    const suggestions = await processCheckupSuggestions(
      checkupChats.map((c) => c.chatId)
    );

    chatsConfigState.checkUpSuggestions = {
      enabledChats: checkupChats.map((c) => c.chatId),
      suggestions,
    };
    mainWindow.webContents.send(
      `checkup-suggestions-updated`,
      chatsConfigState.checkUpSuggestions
    );
  });

  // Add translation job
  schedule.scheduleJob(`*/15 * * * * *`, async () => {
    const translatedChats = await prisma.configuredTranslatedChat.findMany();
    const translations = await processTranslations({
      enabledChats: translatedChats.map((c) => c.chatId),
    });

    chatsConfigState.translatedChats = {
      enabledChats: translatedChats.map((c) => c.chatId),
      translations,
    };
    mainWindow.webContents.send(
      `translated-chats-updated`,
      chatsConfigState.translatedChats
    );
  });

  app.on(`activate`, function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on(`window-all-closed`, () => {
  if (process.platform !== `darwin`) {
    app.quit();
  }
});

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
