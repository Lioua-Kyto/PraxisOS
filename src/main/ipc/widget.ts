import { ipcMain } from "electron";
import { closeWidget, isWidgetOpen, openWidget } from "../widgetWindow";
import { refreshTrayMenu } from "../tray";

/**
 * Supplied by main once the window exists, so these handlers can drive the main
 * window without importing from index.ts (which would be a cycle).
 */
let showMain: () => void = () => {};
let hideMain: () => void = () => {};

export function setMainWindowControls(controls: { show: () => void; hide: () => void }): void {
  showMain = controls.show;
  hideMain = controls.hide;
}

export function registerWidgetHandlers(): void {
  /**
   * Pinning the timer replaces the main window rather than sitting on top of
   * it: the point of the widget is to keep the clock visible while working in
   * something else, so leaving the full app open behind it just means two
   * copies of the same timer competing for screen space.
   */
  ipcMain.handle("widget:open", () => {
    openWidget();
    hideMain();
    refreshTrayMenu();
  });

  ipcMain.handle("widget:close", () => {
    closeWidget();
    refreshTrayMenu();
  });

  ipcMain.handle("widget:isOpen", (): boolean => isWidgetOpen());

  /** The widget's way back: dismiss it and bring the app forward. */
  ipcMain.handle("widget:restoreMain", () => {
    closeWidget();
    showMain();
    refreshTrayMenu();
  });
}
