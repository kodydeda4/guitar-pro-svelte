let electron = require("electron");
let path = require("path");
let _electron_toolkit_utils = require("@electron-toolkit/utils");
//#region resources/icon.png?asset
var icon_default = (0, path.join)(__dirname, "../../resources/icon.png");
//#endregion
//#region src/main/index.ts
function createWindow() {
	const mainWindow = new electron.BrowserWindow({
		width: 1280,
		height: 820,
		show: false,
		autoHideMenuBar: true,
		titleBarStyle: "hidden",
		trafficLightPosition: {
			x: 18,
			y: 20
		},
		...process.platform !== "darwin" ? { titleBarOverlay: {
			color: "#00000000",
			symbolColor: "#a1a1aa",
			height: 56
		} } : {},
		backgroundColor: "#0a0a0a",
		...process.platform === "linux" ? { icon: icon_default } : {},
		webPreferences: {
			preload: (0, path.join)(__dirname, "../preload/index.js"),
			sandbox: false
		}
	});
	mainWindow.on("ready-to-show", () => {
		mainWindow.show();
	});
	mainWindow.webContents.setWindowOpenHandler((details) => {
		electron.shell.openExternal(details.url);
		return { action: "deny" };
	});
	if (_electron_toolkit_utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
	else mainWindow.loadFile((0, path.join)(__dirname, "../renderer/index.html"));
}
electron.app.whenReady().then(() => {
	_electron_toolkit_utils.electronApp.setAppUserModelId("com.electron");
	electron.app.on("browser-window-created", (_, window) => {
		_electron_toolkit_utils.optimizer.watchWindowShortcuts(window);
	});
	electron.ipcMain.on("ping", () => console.log("pong"));
	createWindow();
	electron.app.on("activate", function() {
		if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});
electron.app.on("window-all-closed", () => {
	if (process.platform !== "darwin") electron.app.quit();
});
//#endregion
