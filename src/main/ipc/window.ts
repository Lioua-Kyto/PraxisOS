import { app, BrowserWindow, ipcMain } from "electron";
import { showAbout } from "../appMenu";

/**
 * Commands the burger menu can run. Edit and View items map to webContents
 * roles so their behaviour (and the app-menu accelerators) stay identical to a
 * native menu; the rest are app-level actions.
 */
type MenuCommand =
  | "reload"
  | "toggleDevTools"
  | "zoomIn"
  | "zoomOut"
  | "zoomReset"
  | "toggleFullscreen"
  | "undo"
  | "redo"
  | "cut"
  | "copy"
  | "paste"
  | "selectAll"
  | "about"
  | "quit";

// Supplied by main so the "Quit" command routes through the same warning-and-
// tray logic as the window's close button, instead of a bare app.quit().
let quitHandler: () => void = () => app.quit();
export function setQuitHandler(fn: () => void): void {
  quitHandler = fn;
}

export function registerWindowHandlers(): void {
  const senderWindow = (event: Electron.IpcMainInvokeEvent) => BrowserWindow.fromWebContents(event.sender);

  ipcMain.handle("window:minimize", (e) => senderWindow(e)?.minimize());

  ipcMain.handle("window:toggleMaximize", (e) => {
    const win = senderWindow(e);
    if (!win) return false;
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
    return win.isMaximized();
  });

  // Routes through the window's own close handler, so it respects the
  // minimise-to-tray setting and the running-timer warning.
  ipcMain.handle("window:close", (e) => senderWindow(e)?.close());

  ipcMain.handle("window:isMaximized", (e) => senderWindow(e)?.isMaximized() ?? false);

  ipcMain.handle("window:menu", (e, command: MenuCommand) => {
    const win = senderWindow(e);
    const wc = win?.webContents;
    switch (command) {
      case "reload":
        wc?.reload();
        break;
      case "toggleDevTools":
        wc?.toggleDevTools();
        break;
      case "zoomIn":
        if (wc) wc.setZoomLevel(wc.getZoomLevel() + 0.5);
        break;
      case "zoomOut":
        if (wc) wc.setZoomLevel(wc.getZoomLevel() - 0.5);
        break;
      case "zoomReset":
        wc?.setZoomLevel(0);
        break;
      case "toggleFullscreen":
        if (win) win.setFullScreen(!win.isFullScreen());
        break;
      case "undo":
        wc?.undo();
        break;
      case "redo":
        wc?.redo();
        break;
      case "cut":
        wc?.cut();
        break;
      case "copy":
        wc?.copy();
        break;
      case "paste":
        wc?.paste();
        break;
      case "selectAll":
        wc?.selectAll();
        break;
      case "about":
        showAbout();
        break;
      case "quit":
        quitHandler();
        break;
    }
  });
}
