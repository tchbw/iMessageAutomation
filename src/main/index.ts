import { electronApp, is, optimizer } from "@electron-toolkit/utils";
import { app, BrowserWindow, ipcMain, shell } from "electron";
import { join } from "path";
import icon from "../../resources/icon.png?asset";

import schedule from "node-schedule";
import {
  ChatsConfig,
  QuickReplySuggestions,
  CheckUpSuggestions,
} from "@shared/types/config";
import chatsModel from "@main/models/chat";
import { chatModelMapper } from "@main/util/mappers/chat";
import { processAutoMessages } from "@main/jobs/autoMessage";
import { processReplySuggestions } from "@main/jobs/replySuggestion";
import { processCheckupSuggestions } from "@main/jobs/checkupSuggestion";

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

  let autoChats: number[] = [];
  const quickReplySuggestions: QuickReplySuggestions = {
    enabledChats: [],
    suggestions: [],
  };
  const checkUpSuggestions: CheckUpSuggestions = {
    enabledChats: [],
    suggestions: [],
  };

  // IPC test
  ipcMain.on(`ping`, () => console.log(`pong`));
  ipcMain.handle(`get-chat-configuration`, async () => {
    const chats = await chatsModel.all();
    return {
      automatedChats: [],
      ignoredChats: [],
      checkUpSuggestions: checkUpSuggestions,
      quickReplySuggestions: quickReplySuggestions,
      chats: chats.map(chatModelMapper.fromModel),
    } satisfies ChatsConfig;
  });

  ipcMain.handle(`set-auto-chats`, (_event, chatIds: number[]) => {
    autoChats = chatIds;
    console.log(chatIds);
    return autoChats;
  });

  ipcMain.handle(`set-quick-reply-chats`, (_event, chatIds: number[]) => {
    quickReplySuggestions.enabledChats = chatIds;
    console.log(chatIds);
    return quickReplySuggestions;
  });

  ipcMain.handle(`set-checkup-chats`, (_event, chatIds: number[]) => {
    checkUpSuggestions.enabledChats = chatIds;
    console.log(chatIds);
    return checkUpSuggestions;
  });

  const mainWindow = await createWindow();

  // Setup iMessage reader schedule every minute
  schedule.scheduleJob(`*/30 * * * * *`, () => {
    processAutoMessages({ automatedChats: autoChats });
  });
  schedule.scheduleJob(`*/30 * * * * *`, async () => {
    const suggestions = await processReplySuggestions(quickReplySuggestions);
    quickReplySuggestions.suggestions = suggestions;
    mainWindow.webContents.send(
      `quick-reply-suggestions-updated`,
      quickReplySuggestions
    );
  });

  schedule.scheduleJob(`*/30 * * * * *`, async () => {
    const suggestions = await processCheckupSuggestions(checkUpSuggestions);
    checkUpSuggestions.suggestions = suggestions;
    mainWindow.webContents.send(
      `checkup-suggestions-updated`,
      checkUpSuggestions
    );
  });

  // schedule.scheduleJob(`0 */1 * * *`, async () => {
  //   const suggestions = await processCheckupSuggestions(checkUpSuggestions);
  //   checkUpSuggestions.suggestions = suggestions;
  //   mainWindow.webContents.send(
  //     `checkup-suggestions-updated`,
  //     checkUpSuggestions
  //   );
  // });

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
