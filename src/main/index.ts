import { app, BrowserWindow, shell } from "electron";
import { join } from "path";
import { initDb, closeDb } from "./db/client";
import { registerAllIpcHandlers } from "./ipc/registerAll";
import { startHabitReminders, stopHabitReminders } from "./habits/reminderScheduler";
import { registerMainWindow } from "./workout/workoutSessionEngine";
import { registerMediaProtocolHandler, registerMediaScheme } from "./mediaProtocol";

// In dev this resolves to <root>/build/icon.png (out/main -> up two levels
// -> project root -> build/icon.png). Packaged builds don't ship the
// build/ directory (it's electron-builder's own icon source), so there we
// read the copy electron-builder places under resources/ via extraResources
// (see package.json's build.extraResources).
const iconPath = app.isPackaged ? join(process.resourcesPath, "icon.png") : join(__dirname, "../../build/icon.png");

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

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  if (!app.isPackaged && process.env["ELECTRON_RENDERER_URL"]) {
    win.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    win.loadFile(join(__dirname, "../renderer/index.html"));
  }

  registerMainWindow(win);
}

// Must run before the app is ready, otherwise the scheme never gets its
// streaming/standard privileges.
registerMediaScheme();

app.whenReady().then(() => {
  initDb();
  registerMediaProtocolHandler();
  registerAllIpcHandlers();

  createWindow();
  startHabitReminders();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  stopHabitReminders();
  closeDb();
  if (process.platform !== "darwin") app.quit();
});
