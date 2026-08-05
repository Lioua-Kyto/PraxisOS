import { BrowserWindow, ipcMain } from "electron";
import { closeWidget, isWidgetOpen, openWidget } from "../widgetWindow";
import { refreshTrayMenu } from "../tray";

/**
 * Called by main once the window exists, so the widget handlers can bring the
 * main window forward without importing from index.ts (which would be a cycle).
 */
let showMain: () => void = () => {};

export function setShowMainWindow(fn: () => void): void {
  showMain = fn;
}

export function registerWidgetHandlers(): void {
  ipcMain.handle("widget:open", () => {
    openWidget();
    refreshTrayMenu();
  });

  ipcMain.handle("widget:close", () => {
    closeWidget();
    refreshTrayMenu();
  });

  ipcMain.handle("widget:isOpen", (): boolean => isWidgetOpen());

  // From the widget: surface the main window (and drop the widget's own focus).
  ipcMain.handle("widget:openMain", (event) => {
    showMain();
    BrowserWindow.fromWebContents(event.sender)?.blur();
  });

  // Minimise-to-tray from the UI, so the behaviour is discoverable rather than
  // only happening when the window's close button is used.
  ipcMain.handle("widget:hideMain", () => {
    const [main] = BrowserWindow.getAllWindows().filter((w) => !w.isAlwaysOnTop());
    main?.hide();
  });
}
