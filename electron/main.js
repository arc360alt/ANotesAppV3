// main.js - Electron main process

const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 500,
    frame: true,
    backgroundColor: "#111111",
    title: "A Notes App V3",
    webPreferences: {
      // preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

const indexPath = app.isPackaged
  ? path.join(__dirname, "frontend", "index.html")
  : path.join(__dirname, "..", "frontend", "dist", "index.html");
  win.loadFile(indexPath);

  win.once("ready-to-show", () => win.show());

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  ipcMain.handle("win-minimize", () => win.minimize());
  ipcMain.handle("win-maximize", () => {
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
  });
  ipcMain.handle("win-close", () => win.close());

  win.removeMenu();

  win.on("maximize",          () => win.webContents.send("win-state", "maximized"));
  win.on("unmaximize",        () => win.webContents.send("win-state", "normal"));
  win.on("enter-full-screen", () => win.webContents.send("win-state", "fullscreen"));
  win.on("leave-full-screen", () => win.webContents.send("win-state", "normal"));
  win.on("focus",             () => win.webContents.send("win-focus", true));
  win.on("blur",              () => win.webContents.send("win-focus", false));
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});