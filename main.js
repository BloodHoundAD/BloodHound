const electron = require('electron');
var platform = require('os').platform();
// Module to control application life.
const app = electron.app;
const Menu = electron.Menu;

// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
    // Create the browser window.
    if (platform === 'darwin') {
        mainWindow = new BrowserWindow({
            width: 1280,
            height: 800,
            icon: __dirname + '/src/img/icon.png',
            webPreferences: {
                nodeIntegration: true,
                enableRemoteModule: true
            },
        });
    } else if (platform === 'linux') {
        mainWindow = new BrowserWindow({
            width: 1280,
            height: 800,
            icon: __dirname + '/src/img/icon.png',
            webPreferences: {
                nodeIntegration: true,
                enableRemoteModule: true
            },
        });
    } else {
        mainWindow = new BrowserWindow({
            width: 1280,
            height: 800,
            icon: __dirname + '/src/img/icon.ico',
            webPreferences: {
                nodeIntegration: true,
                enableRemoteModule: true
            },
        });
    }

    mainWindow.loadURL(`file://${__dirname}/index.html`);

    // Open the DevTools.
    //mainWindow.webContents.openDevTools()

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });

    var template = [
        {
            label: 'Application',
            submenu: [
                {
                    label: 'Quit',
                    accelerator: 'Command+Q',
                    click: function () {
                        app.quit();
                    },
                },
            ],
        },
        {
            label: 'Edit',
            submenu: [
                {
                    label: 'Undo',
                    accelerator: 'CmdOrCtrl+Z',
                    selector: 'undo:',
                },
                {
                    label: 'Redo',
                    accelerator: 'Shift+CmdOrCtrl+Z',
                    selector: 'redo:',
                },
                { type: 'separator' },
                { label: 'Cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:' },
                {
                    label: 'Copy',
                    accelerator: 'CmdOrCtrl+C',
                    selector: 'copy:',
                },
                {
                    label: 'Paste',
                    accelerator: 'CmdOrCtrl+V',
                    selector: 'paste:',
                },
                {
                    label: 'Select All',
                    accelerator: 'CmdOrCtrl+A',
                    selector: 'selectAll:',
                },
                {
                    label: 'Open Developer Tools',
                    accelerator: 'CmdOrCtrl+Shift+I',
                    click(item, focusedWindow) {
                        mainWindow.webContents.openDevTools();
                    },
                },
                {
                    label: 'Reload',
                    accelerator: 'CmdOrCtrl+R',
                    click(item, focusedWindow) {
                        if (focusedWindow) focusedWindow.reload();
                    },
                },
            ],
        },
    ];

    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
    mainWindow.setMenuBarVisibility(false);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', function () {
    createWindow();
    mainWindow.maximize();
});

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});

app.allowRendererProcessReuse = false;

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
