import { app, BrowserWindow, protocol, net } from 'electron'
import { join } from 'path'
import { pathToFileURL } from 'node:url'
import * as fs from 'node:fs'
import log from 'electron-log'
import { setupIpcHandlers } from './ipc-handlers'

log.transports.file.level = 'info'
log.transports.console.level = 'debug'
Object.assign(console, log.functions)

const isDev = !app.isPackaged
const APP_SCHEME = 'app'

protocol.registerSchemesAsPrivileged([
    {
        scheme: APP_SCHEME,
        privileges: {
            standard: true,
            secure: true,
            allowServiceWorkers: true,
            supportFetchAPI: true,
        },
    },
])

function setupAppProtocol() {
    const outDir = join(__dirname, '../../out')

    protocol.handle(APP_SCHEME, async (request) => {
        const url = new URL(request.url)
        const pathname = decodeURIComponent(url.pathname).replace(/^\/+/, '')

        const candidates: string[] = []
        if (pathname === '' || pathname.endsWith('/')) {
            candidates.push(join(outDir, pathname, 'index.html'))
        }
        candidates.push(join(outDir, pathname))
        candidates.push(join(outDir, pathname + '.html'))
        candidates.push(join(outDir, 'index.html'))

        for (const filePath of candidates) {
            try {
                if (fs.statSync(filePath).isFile()) {
                    return net.fetch(pathToFileURL(filePath).toString())
                }
            } catch {
                continue
            }
        }
        return new Response('Not found', { status: 404 })
    })
}

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
        mainWindow.loadURL(`${APP_SCHEME}://-/`)
    }
}

app.whenReady().then(() => {
    if (!isDev) setupAppProtocol()
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
