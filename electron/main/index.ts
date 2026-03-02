import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import electronIsDev from 'electron-is-dev'
import log from 'electron-log'

log.transports.file.level = 'info'
log.transports.console.level = 'debug'
Object.assign(console, log.functions)

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 900,
        height: 670,
        show: false,
        autoHideMenuBar: true,
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            sandbox: false
        }
    })

    mainWindow.on('ready-to-show', () => {
        mainWindow.show()
    })

    if (electronIsDev) {
        mainWindow.loadURL('http://localhost:3000')
    } else {
        mainWindow.loadFile(join(__dirname, '../../out/index.html'))
    }
}

app.whenReady().then(() => {
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
