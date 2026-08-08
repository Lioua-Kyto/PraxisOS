import { app, BrowserWindow, dialog, shell } from "electron";
import { join } from "path";
import { initDb, closeDb } from "./db/client";
import { registerAllIpcHandlers } from "./ipc/registerAll";
import { startHabitReminders, stopHabitReminders } from "./habits/reminderScheduler";
import { registerMainWindow } from "./workout/workoutSessionEngine";
import { registerMediaProtocolHandler, registerMediaScheme } from "./mediaProtocol";
import { createTray, refreshTrayMenu } from "./tray";
import { closeWidget } from "./widgetWindow";
import { setMainWindowControls } from "./ipc/widget";
import { getSettings } from "./ipc/settings";
import { hasActiveFocusSession } from "./ipc/focusTimer";
import { installAppMenu } from "./appMenu";
import { registerUpdater } from "./updater";
import { setQuitHandler } from "./ipc/window";

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
// The tray uses its own small artwork (see build/tray.*), never the 1024 app
// icon — a runtime downscale of that muddied the tray glyph. Windows takes the
// multi-size .ico; other platforms take a 32px png.
const trayIconPath = process.platform === "win32" ? assetPath("tray.ico") : assetPath("tray.png");

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
    // The custom title bar (a themed strip with a burger menu, sidebar toggle
    // and our own min/max/close buttons) fully replaces the native one. We use
    // no titleBarOverlay: its native buttons can't be themed, its tooltips
    // double up, and its backdrop paints over the ribbon's bottom border. The
    // renderer draws the controls instead — see TitleBar.tsx.
    titleBarStyle: "hidden",
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

  // Tell the renderer when the maximise state changes, so the custom control's
  // icon (maximise vs restore) stays in sync however the window got there —
  // our button, a double-click on the drag strip, or a Windows snap gesture.
  win.on("maximize", () => win.webContents.send("window:maximizeChanged", true));
  win.on("unmaximize", () => win.webContents.send("window:maximizeChanged", false));

  // What closing the window does is the user's choice (Settings → When I close
  // the window). Default: park in the tray so a running timer and the habit
  // reminders survive. If they've chosen to quit instead, warn first when a
  // focus session is still running, since quitting stops it.
  win.on("close", (event) => {
    if (quitting) return;
    event.preventDefault();

    if (getSettings().closeToTray) {
      win.hide();
      return;
    }
    if (confirmQuit(win)) {
      quitting = true;
      app.quit();
    }
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

/**
 * Guards an explicit quit. Returns true to proceed. When a focus session is
 * still running, a modal asks whether to quit anyway — because quitting stops
 * the timer, and staying in the tray would have kept it going.
 */
function confirmQuit(win: BrowserWindow): boolean {
  if (!hasActiveFocusSession()) return true;
  const choice = dialog.showMessageBoxSync(win, {
    type: "warning",
    buttons: ["Cancel", "Quit anyway"],
    defaultId: 0,
    cancelId: 0,
    title: "A focus timer is still running",
    message: "A focus timer is still running.",
    detail: "Quitting will stop the running session. Minimise to the tray instead to keep it counting."
  });
  return choice === 1;
}

/** Called from the tray Quit and the title-bar close when tray-minimise is off. */
function requestQuit(): void {
  const win = mainWindow && !mainWindow.isDestroyed() ? mainWindow : BrowserWindow.getAllWindows()[0];
  if (win && !confirmQuit(win)) return;
  quitting = true;
  app.quit();
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
    installAppMenu();
    registerUpdater();
    setMainWindowControls({ show: showMainWindow, hide: () => mainWindow?.hide() });

    createWindow();
    createTray({ iconPath: trayIconPath, showMainWindow, quit: requestQuit });
    setQuitHandler(requestQuit);
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
