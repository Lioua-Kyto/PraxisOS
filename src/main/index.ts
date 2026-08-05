import { app, BrowserWindow, shell } from "electron";
import { join } from "path";
import { initDb, closeDb } from "./db/client";
import { registerAllIpcHandlers } from "./ipc/registerAll";
import { startHabitReminders, stopHabitReminders } from "./habits/reminderScheduler";
import { registerMainWindow } from "./workout/workoutSessionEngine";
import { registerMediaProtocolHandler, registerMediaScheme } from "./mediaProtocol";
import { createTray, refreshTrayMenu } from "./tray";
import { closeWidget } from "./widgetWindow";
import { setShowMainWindow } from "./ipc/widget";

// In dev this resolves to <root>/build/icon.png (out/main -> up two levels
// -> project root -> build/icon.png). Packaged builds don't ship the
// build/ directory (it's electron-builder's own icon source), so there we
// read the copy electron-builder places under resources/ via extraResources
// (see package.json's build.extraResources).
const iconPath = app.isPackaged ? join(process.resourcesPath, "icon.png") : join(__dirname, "../../build/icon.png");

let mainWindow: BrowserWindow | null = null;
/** Distinguishes "user closed the window" from "user chose Quit". */
let quitting = false;

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    show: false,
    backgroundColor: "#0b0d10",
    autoHideMenuBar: true,
    icon: iconPath,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  win.on("ready-to-show", () => win.show());

  // Closing the window parks the app in the tray instead of ending it — a
  // running focus timer and the habit reminders have to survive the user
  // clearing their desktop. Quit is an explicit choice from the tray menu.
  win.on("close", (event) => {
    if (quitting) return;
    event.preventDefault();
    win.hide();
  });

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  if (!app.isPackaged && process.env["ELECTRON_RENDERER_URL"]) {
    win.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    win.loadFile(join(__dirname, "../renderer/index.html"));
  }

  mainWindow = win;
  registerMainWindow(win);
}

function showMainWindow(): void {
  if (!mainWindow || mainWindow.isDestroyed()) {
    createWindow();
    return;
  }
  if (!mainWindow.isVisible()) mainWindow.show();
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.focus();
}

// Windows drops toast notifications from a process with no AppUserModelID —
// silently, with no error. It has to match the installer's appId, and it has
// to be set before anything tries to notify.
if (process.platform === "win32") app.setAppUserModelId("com.lioua.praxisos");

// With a tray icon, a second launch should surface the existing window rather
// than start a rival instance holding the same SQLite file.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", showMainWindow);

  // Must run before the app is ready, otherwise the scheme never gets its
  // streaming/standard privileges.
  registerMediaScheme();

  app.whenReady().then(() => {
    initDb();
    registerMediaProtocolHandler();
    registerAllIpcHandlers();
    setShowMainWindow(showMainWindow);

    createWindow();
    createTray({
      iconPath,
      showMainWindow,
      quit: () => {
        quitting = true;
        app.quit();
      }
    });
    refreshTrayMenu();
    startHabitReminders();

    app.on("activate", showMainWindow);
  });
}

app.on("before-quit", () => {
  quitting = true;
  closeWidget();
  stopHabitReminders();
  closeDb();
});

// Deliberately does nothing: the tray keeps the app alive after the last
// window closes. Quitting goes through the tray menu (or before-quit above).
app.on("window-all-closed", () => {});
