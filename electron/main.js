const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: "#0f1115",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.setMenuBarVisibility(false);

  if (process.env.NODE_ENV === "development") {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}

app.whenReady().then(async () => {
  const db = require("./db.js");
  await db.initDb();

  // Generic read query. Renderer sends SQL + params; local single-user app only.
  ipcMain.handle("db:all", (_event, sql, params = []) => {
    return db.all(sql, params);
  });

  // Generic write query (INSERT/UPDATE/DELETE). Returns lastInsertRowid + changes.
  ipcMain.handle("db:run", (_event, sql, params = []) => {
    return db.run(sql, params);
  });

  ipcMain.handle("db:reseedCourses", () => db.reseedCourses());
  ipcMain.handle("db:reseedWorkout", () => db.reseedWorkout());

  ipcMain.handle("media:pickVideo", async (_event, exerciseId) => {
    const win = BrowserWindow.getFocusedWindow();
    const result = await dialog.showOpenDialog(win, {
      title: "Choose a form-check video",
      properties: ["openFile"],
      filters: [{ name: "Videos", extensions: ["mp4", "mov", "webm", "mkv", "avi"] }]
    });
    if (result.canceled || !result.filePaths.length) return null;

    const src = result.filePaths[0];
    const mediaDir = db.getMediaDir();
    const destName = `ex${exerciseId}-${Date.now()}${path.extname(src)}`;
    const dest = path.join(mediaDir, destName);
    fs.copyFileSync(src, dest);

    db.run("UPDATE workout_exercises SET video_path=? WHERE id=?", [dest, exerciseId]);
    return dest;
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
