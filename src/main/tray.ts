import { app, Menu, nativeImage, Tray } from "electron";
import { isWidgetOpen, toggleWidget } from "./widgetWindow";

let tray: Tray | null = null;

interface TrayHandlers {
  iconPath: string;
  showMainWindow: () => void;
  quit: () => void;
}

let handlers: TrayHandlers | null = null;

function buildMenu(): Menu {
  return Menu.buildFromTemplate([
    { label: "Open PraxisOS", click: () => handlers?.showMainWindow() },
    {
      label: isWidgetOpen() ? "Hide timer widget" : "Show timer widget",
      click: () => {
        toggleWidget();
        // The label depends on widget state, so rebuild rather than reuse.
        refreshTrayMenu();
      }
    },
    { type: "separator" },
    { label: "Quit PraxisOS", click: () => handlers?.quit() }
  ]);
}

export function refreshTrayMenu(): void {
  tray?.setContextMenu(buildMenu());
}

export function createTray(next: TrayHandlers): void {
  handlers = next;
  if (tray) return;

  // Windows tray slots are 16px; handing it the full app icon leaves a blurry
  // downscale, so resize explicitly.
  const image = nativeImage.createFromPath(next.iconPath).resize({ width: 16, height: 16 });
  tray = new Tray(image);
  tray.setToolTip("PraxisOS");
  tray.setContextMenu(buildMenu());
  tray.on("click", () => handlers?.showMainWindow());
  tray.on("double-click", () => handlers?.showMainWindow());

  app.on("before-quit", () => {
    tray?.destroy();
    tray = null;
  });
}
