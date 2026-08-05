import { app, BrowserWindow, screen } from "electron";
import { join } from "path";

let widget: BrowserWindow | null = null;

const WIDTH = 232;
const HEIGHT = 92;

export function isWidgetOpen(): boolean {
  return Boolean(widget && !widget.isDestroyed());
}

/**
 * A small always-on-top readout of the running focus session, so the timer
 * stays visible while the main window is minimised or hidden to the tray.
 *
 * It renders the same renderer bundle behind a `#widget` hash rather than a
 * second entry point — one build, one preload, and the widget gets the same
 * typed `window.api` the main window has.
 */
export function openWidget(): void {
  if (isWidgetOpen()) {
    widget!.show();
    widget!.focus();
    return;
  }

  const { workArea } = screen.getPrimaryDisplay();

  widget = new BrowserWindow({
    width: WIDTH,
    height: HEIGHT,
    x: workArea.x + workArea.width - WIDTH - 24,
    y: workArea.y + 24,
    frame: false,
    resizable: false,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    transparent: true,
    backgroundColor: "#00000000",
    show: false,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      // Chromium throttles timers in windows that aren't focused, so an
      // unfocused clock starts ticking every two seconds instead of every one
      // — which is exactly what a pinned timer is unfocused for. This window
      // runs one setTimeout; there is nothing here worth throttling.
      backgroundThrottling: false
    }
  });

  // Floats above full-screen apps too, which is the point of a pinned timer.
  widget.setAlwaysOnTop(true, "screen-saver");
  widget.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  widget.once("ready-to-show", () => widget?.show());
  widget.on("closed", () => {
    widget = null;
  });

  if (!app.isPackaged && process.env["ELECTRON_RENDERER_URL"]) {
    widget.loadURL(`${process.env["ELECTRON_RENDERER_URL"]}#widget`);
  } else {
    widget.loadFile(join(__dirname, "../renderer/index.html"), { hash: "widget" });
  }
}

export function closeWidget(): void {
  if (isWidgetOpen()) widget!.close();
  widget = null;
}

export function toggleWidget(): void {
  if (isWidgetOpen()) closeWidget();
  else openWidget();
}
