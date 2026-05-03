import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import log from 'electron-log'
import serve from 'electron-serve'
import { setupIpcHandlers } from './ipc-handlers'

log.transports.file.level = 'info'
log.transports.console.level = 'debug'
Object.assign(console, log.functions)

const isDev = !app.isPackaged
const loadURL = serve({ directory: join(__dirname, '../../out') })

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1100,
        height: 850,
        minWidth: 900,
        minHeight: 670,
        show: false,
        autoHideMenuBar: true,
        titleBarStyle: 'hiddenInset',
        trafficLightPosition: { x: 16, y: 16 }, // Nice padding for macOS lights
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            sandbox: false
        },
        backgroundColor: '#09090b'
    })

    mainWindow.on('ready-to-show', () => {
        mainWindow.show()
    })

    if (isDev) {
        mainWindow.loadURL('http://localhost:3000')
    } else {
        loadURL(mainWindow)
    }
}

app.whenReady().then(() => {
    setupIpcHandlers()
    createWindow()

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

// Route OS signals through app.quit() so the will-quit lifecycle fires
// (and the gateway gets stopped cleanly on Ctrl+C)
process.on('SIGINT', () => app.quit())
process.on('SIGTERM', () => app.quit())
