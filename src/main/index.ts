import { app, BrowserWindow, shell } from "electron";
import { join } from "path";
import { initDb, closeDb } from "./db/client";
import { registerAllIpcHandlers } from "./ipc/registerAll";
import { startHabitReminders, stopHabitReminders } from "./habits/reminderScheduler";
import { registerMainWindow } from "./workout/workoutSessionEngine";
import { registerMediaProtocolHandler, registerMediaScheme } from "./mediaProtocol";
import { createTray, refreshTrayMenu } from "./tray";
import { closeWidget } from "./widgetWindow";
import { setMainWindowControls } from "./ipc/widget";

// In dev these resolve to <root>/build/ (out/main -> up two levels -> project
// root). Packaged builds don't ship the build/ directory (it's
// electron-builder's own icon source), so there we read the copies
// electron-builder places under resources/ via extraResources.
function assetPath(name: string): string {
  return app.isPackaged ? join(process.resourcesPath, name) : join(__dirname, "../../", "build", name);
}

// Windows wants the .ico: it carries every size the shell asks for, so the
// taskbar button and Alt-Tab get a crisp icon instead of a downscaled PNG.
// Everywhere else the PNG is the right choice.
const windowIconPath = process.platform === "win32" ? assetPath("icon.ico") : assetPath("icon.png");
const trayIconPath = assetPath("icon.png");

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
    icon: windowIconPath,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      // The focus timer keeps counting while the user works in another app, so
      // the clock must not be throttled just because this window lost focus.
      backgroundThrottling: false
    }
  });

  // Setting it again after construction is not redundant on Windows: the
  // constructor icon is applied before the window has a native handle, and the
  // taskbar button can otherwise keep Electron's default.
  win.setIcon(windowIconPath);

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
    setMainWindowControls({ show: showMainWindow, hide: () => mainWindow?.hide() });

    createWindow();
    createTray({
      iconPath: trayIconPath,
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
