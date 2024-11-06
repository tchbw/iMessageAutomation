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
import { getGptCompletion } from "@main/util/ai";
import { sendIMessage } from "@main/util/mac";
import { chatModelMapper } from "@main/util/mappers/chat";
import { ChatMessage, ChatsConfig } from "@shared/types/config";
import schedule from "node-schedule";

async function createWindow(): Promise<BrowserWindow> {
  // const chat = await prisma.chat.findUniqueOrThrow({
  //   where: {
  //     ROWID: 1
  //   },
  //   include: {
  //     Messages: {
  //       orderBy: {
  //         message: {
  //           date: 'desc'
  //         }
  //       },
  //       take: 5,
  //       include: {
  //         message: true
  //       }
  //     }
  //   }
  // })

  // const user = await db

  // const chatResult = await db
  //   .select({
  //     ROWID: chat.ROWID,
  //     guid: chat.guid,
  //     Messages: {
  //       messageId: chatMessageJoin.messageId,
  //       message: {
  //         ROWID: message.ROWID,
  //         guid: message.guid,
  //         text: message.text,
  //         handle_id: message.handle_id,
  //         date: message.date
  //       }
  //     }
  //   })
  //   .from(chat)
  //   .leftJoin(chatMessageJoin, eq(chat.ROWID, chatMessageJoin.chatId))
  //   .leftJoin(message, eq(chatMessageJoin.messageId, message.ROWID))
  //   .where(eq(chat.ROWID, 1))
  //   .orderBy(desc(message.date))
  //   .limit(5)

  // console.log(chatResult)
  // console.log(chatResult.map((m) => getContentFromIMessage(m.Message)))

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

  ipcMain.on(`ping`, () => console.log(`pong`));

  ipcMain.handle(`get-chat-configuration`, async () => {
    const chats = await chatsModel.all();

    // Get configured chats from database
    const [autoChats, replyChats, checkupChats, translatedChats] =
      await Promise.all([
        prisma.configuredAutomatedChat.findMany(),
        prisma.configuredReplySuggestionChat.findMany(),
        prisma.configuredCheckupSuggestionChat.findMany(),
        prisma.configuredTranslatedChat.findMany(),
      ]);

    return {
      automatedChats: autoChats.map((c) => c.chatId),
      ignoredChats: [],
      checkUpSuggestions: {
        enabledChats: checkupChats.map((c) => c.chatId),
        suggestions: [],
      },
      quickReplySuggestions: {
        enabledChats: replyChats.map((c) => c.chatId),
        suggestions: [],
      },
      chats: chats.map(chatModelMapper.fromModel),
      translatedChats: {
        enabledChats: translatedChats.map((c) => c.chatId),
        translations: [],
      },
    } satisfies ChatsConfig;
  });

  ipcMain.handle(`set-auto-chats`, async (_event, chatIds: number[]) => {
    // Clear existing configurations
    await prisma.configuredAutomatedChat.deleteMany();

    // Insert new configurations
    await prisma.configuredAutomatedChat.createMany({
      data: chatIds.map((chatId) => ({ chatId })),
    });

    return chatIds;
  });

  ipcMain.handle(`set-quick-reply-chats`, async (_event, chatIds: number[]) => {
    await prisma.configuredReplySuggestionChat.deleteMany();

    await prisma.configuredReplySuggestionChat.createMany({
      data: chatIds.map((chatId) => ({ chatId })),
    });

    return {
      enabledChats: chatIds,
      suggestions: [],
    };
  });

  ipcMain.handle(`set-checkup-chats`, async (_event, chatIds: number[]) => {
    await prisma.configuredCheckupSuggestionChat.deleteMany();

    await prisma.configuredCheckupSuggestionChat.createMany({
      data: chatIds.map((chatId) => ({ chatId })),
    });

    return {
      enabledChats: chatIds,
      suggestions: [],
    };
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

  ipcMain.handle(`set-translated-chats`, async (_event, chatIds: number[]) => {
    await prisma.configuredTranslatedChat.deleteMany();

    await prisma.configuredTranslatedChat.createMany({
      data: chatIds.map((chatId) => ({
        chatId,
        targetLanguage: `ko`, // Default to Korean
      })),
    });

    return {
      enabledChats: chatIds,
      translations: [],
    };
  });

  ipcMain.handle(
    `send-translated-message`,
    async (
      _event,
      { phoneNumber, message }: { phoneNumber: string; message: string }
    ): Promise<ChatMessage> => {
      const translatedMessage = await getGptCompletion({
        messages: [
          {
            role: `system`,
            content: `You are a language translator. Translate the following text to Korean. Only respond with the translation, nothing else.`,
          },
          {
            role: `user`,
            content: message,
          },
        ],
      });

      // Send the translated message
      await sendIMessage({ phoneNumber, message: translatedMessage });
      return {
        id: 0,
        content: message,
        date: new Date().toISOString(),
        handleId: 0,
        isFromMe: true,
      };
    }
  );

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
    const suggestions = await processReplySuggestions({
      enabledChats: replyChats.map((c) => c.chatId),
      suggestions: [],
    });

    mainWindow.webContents.send(`quick-reply-suggestions-updated`, {
      enabledChats: replyChats.map((c) => c.chatId),
      suggestions,
    });
  });

  schedule.scheduleJob(`*/30 * * * * *`, async () => {
    const checkupChats =
      await prisma.configuredCheckupSuggestionChat.findMany();
    const suggestions = await processCheckupSuggestions({
      enabledChats: checkupChats.map((c) => c.chatId),
      suggestions: [],
    });

    mainWindow.webContents.send(`checkup-suggestions-updated`, {
      enabledChats: checkupChats.map((c) => c.chatId),
      suggestions,
    });
  });

  // Add translation job
  schedule.scheduleJob(`*/15 * * * * *`, async () => {
    const translatedChats = await prisma.configuredTranslatedChat.findMany();
    const translations = await processTranslations({
      enabledChats: translatedChats.map((c) => c.chatId),
    });

    mainWindow.webContents.send(`translated-chats-updated`, {
      enabledChats: translatedChats.map((c) => c.chatId),
      translations,
    });
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
