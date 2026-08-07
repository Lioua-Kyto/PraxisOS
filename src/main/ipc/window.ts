import { BrowserWindow, ipcMain } from "electron";
import { popupAppMenu } from "../appMenu";

const OVERLAY_HEIGHT = 40;

export function registerWindowHandlers(): void {
  // The burger button asks main to pop the native application menu just below
  // it, so the standard File/Edit/View/Help items live in one place.
  ipcMain.handle("window:showMenu", (event, x: number, y: number) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) popupAppMenu(win, Math.round(x), Math.round(y));
  });

  // Repaints the native window-control overlay (Windows) to match the active
  // theme, so the min/max/close buttons sit on the same colour as the custom
  // title bar rather than a fixed backdrop.
  ipcMain.handle("window:setTitleBarOverlay", (event, overlay: { color: string; symbolColor: string }) => {
    if (process.platform !== "win32") return;
    const win = BrowserWindow.fromWebContents(event.sender);
    // Throws on any window not created with a hidden title bar (e.g. the
    // frameless widget), which is harmless — that window simply has no overlay.
    try {
      win?.setTitleBarOverlay({ color: overlay.color, symbolColor: overlay.symbolColor, height: OVERLAY_HEIGHT });
    } catch {
      /* window has no overlay */
    }
  });
}
