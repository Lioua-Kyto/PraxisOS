const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  all: (sql, params = []) => ipcRenderer.invoke("db:all", sql, params),
  run: (sql, params = []) => ipcRenderer.invoke("db:run", sql, params),
  reseedCourses: () => ipcRenderer.invoke("db:reseedCourses"),
  reseedWorkout: () => ipcRenderer.invoke("db:reseedWorkout"),
  pickVideo: (exerciseId) => ipcRenderer.invoke("media:pickVideo", exerciseId)
});
