import { app, Menu, Tray } from "electron";
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

  // Hand Electron the icon *path* rather than a runtime-resized nativeImage. On
  // Windows this is a multi-size .ico (16-48px, each rasterised at build time),
  // so the shell picks a crisp per-DPI representation. The previous version
  // loaded the 1024px app png and downscaled it here, which turned the thin
  // gradient glyph into dark, muddy pixels.
  tray = new Tray(next.iconPath);
  tray.setToolTip("PraxisOS");
  tray.setContextMenu(buildMenu());
  tray.on("click", () => handlers?.showMainWindow());
  tray.on("double-click", () => handlers?.showMainWindow());

  app.on("before-quit", () => {
    tray?.destroy();
    tray = null;
  });
}
