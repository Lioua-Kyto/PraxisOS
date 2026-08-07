import { app, BrowserWindow, ipcMain } from "electron";
import updaterPkg from "electron-updater";
import type { UpdaterStatus } from "../shared/types";

// electron-updater ships as CommonJS with a default export; pull autoUpdater off it.
const { autoUpdater } = updaterPkg;

const STATUS_CHANNEL = "updater:status";

// The last state, so a window that mounts mid-flow (or the widget) can ask for
// the current status instead of waiting for the next event.
let current: UpdaterStatus = { state: "idle" };

function broadcast(status: UpdaterStatus): void {
  current = status;
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) win.webContents.send(STATUS_CHANNEL, status);
  }
}

/**
 * Two very different failures reach the 'error' event. "No update feed" — no
 * release published yet, or the machine is offline — is normal for a local-first
 * app and should read as "you're up to date", not a red alert. A genuine
 * problem (a corrupt download, a failed install) is a real error worth showing.
 */
function classifyError(err: Error): UpdaterStatus {
  const message = err?.message ?? String(err);
  const benign =
    /latest\.yml/i.test(message) || // release has no feed asset yet
    /No published versions|Unable to find latest version/i.test(message) ||
    /net::|ENOTFOUND|EAI_AGAIN|ETIMEDOUT|ECONNRESET|ENETUNREACH/i.test(message) || // offline
    /\b404\b/.test(message);
  return benign ? { state: "not-available", version: app.getVersion() } : { state: "error", message };
}

/**
 * Wires the auto-updater to the renderer.
 *
 * The user drives it: we never download or install without an explicit command,
 * only *check* automatically. autoInstallOnAppQuit means a downloaded update
 * also lands the next time the app is quit from the tray, even if the user never
 * clicks "Restart to install".
 */
export function registerUpdater(): void {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("checking-for-update", () => broadcast({ state: "checking" }));
  autoUpdater.on("update-available", (info) =>
    broadcast({
      state: "available",
      version: info.version,
      notes: typeof info.releaseNotes === "string" ? info.releaseNotes : ""
    })
  );
  autoUpdater.on("update-not-available", (info) => broadcast({ state: "not-available", version: info.version }));
  autoUpdater.on("download-progress", (p) =>
    broadcast({
      state: "downloading",
      percent: p.percent,
      transferred: p.transferred,
      total: p.total,
      bytesPerSecond: p.bytesPerSecond
    })
  );
  autoUpdater.on("update-downloaded", (info) => broadcast({ state: "downloaded", version: info.version }));

  // The 'error' event is the single place failures are surfaced: checkForUpdates
  // and downloadUpdate both emit it *and* reject, so their catch blocks below
  // just swallow (to avoid an unhandled rejection) and let this decide.
  autoUpdater.on("error", (err) => broadcast(classifyError(err)));

  ipcMain.handle("updater:getStatus", (): UpdaterStatus => current);

  ipcMain.handle("updater:check", async () => {
    // In dev there is no app-update.yml and checkForUpdates throws. Report a
    // clean "unsupported" state rather than surfacing that as an error.
    if (!app.isPackaged) {
      broadcast({ state: "unsupported" });
      return;
    }
    // Failures surface via the 'error' event; swallow the rejection here.
    await autoUpdater.checkForUpdates().catch(() => {});
  });

  ipcMain.handle("updater:download", async () => {
    await autoUpdater.downloadUpdate().catch(() => {});
  });

  ipcMain.handle("updater:install", () => {
    // electron-updater's signature is (isSilent, isForceRunAfter): install
    // without showing the NSIS UI, then relaunch straight into the new version.
    autoUpdater.quitAndInstall(true, true);
  });
}
