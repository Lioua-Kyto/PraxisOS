import { app, BrowserWindow, dialog, Menu, shell } from "electron";

const REPO = "https://github.com/Lioua-Kyto/PraxisOS";

export function showAbout(): void {
  const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
  const detail = `Version ${app.getVersion()}\nA local-first personal management desktop app.\n\n© Lioua-Kyto`;
  if (win) dialog.showMessageBox(win, { type: "info", title: "About PraxisOS", message: "PraxisOS", detail, buttons: ["OK"] });
}

function template(): Electron.MenuItemConstructorOptions[] {
  const isMac = process.platform === "darwin";
  return [
    {
      label: "File",
      submenu: [isMac ? { role: "close" } : { role: "quit", label: "Quit PraxisOS" }]
    },
    // Roles carry the real work: the Edit and View submenus keep their standard
    // accelerators (copy/paste, reload, zoom, devtools) working even though the
    // menu bar itself is hidden behind the burger button.
    { role: "editMenu" },
    { role: "viewMenu" },
    {
      role: "help",
      submenu: [
        { label: "Documentation", click: () => void shell.openExternal(`${REPO}#readme`) },
        { label: "Report a Bug", click: () => void shell.openExternal(`${REPO}/issues/new?labels=bug`) },
        { label: "Send Feedback", click: () => void shell.openExternal(`${REPO}/issues/new?labels=enhancement`) },
        { type: "separator" },
        { label: "About PraxisOS", click: showAbout }
      ]
    }
  ];
}

let appMenu: Menu | null = null;

/**
 * Builds the standard application menu and installs it purely for its keyboard
 * accelerators (copy/paste, reload, zoom, devtools). The bar itself is hidden
 * — the custom title bar's burger renders its own themed dropdown that dispatches
 * the same actions over IPC (see src/main/ipc/window.ts).
 */
export function installAppMenu(): void {
  appMenu = Menu.buildFromTemplate(template());
  Menu.setApplicationMenu(appMenu);
}
