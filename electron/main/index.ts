import { app, BrowserWindow, protocol } from 'electron'
import { join, extname } from 'path'
import * as fs from 'node:fs'
import log from 'electron-log'
import { setupIpcHandlers } from './ipc-handlers'

log.transports.file.level = 'info'
log.transports.console.level = 'debug'
Object.assign(console, log.functions)

const isDev = !app.isPackaged
const APP_SCHEME = 'app'

const MIME_TYPES: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.otf': 'font/otf',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain; charset=utf-8',
    '.wasm': 'application/wasm',
    '.map': 'application/json; charset=utf-8',
}

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
    log.info('Serving static files from:', outDir)

    protocol.handle(APP_SCHEME, async (request) => {
        try {
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
                        const data = fs.readFileSync(filePath)
                        const ext = extname(filePath).toLowerCase()
                        const mimeType = MIME_TYPES[ext] || 'application/octet-stream'
                        return new Response(new Uint8Array(data), {
                            headers: { 'Content-Type': mimeType },
                        })
                    }
                } catch {
                    continue
                }
            }
            log.warn('Resource not found:', request.url)
            return new Response('Not found', { status: 404 })
        } catch (err) {
            log.error('Protocol handler error:', err)
            return new Response('Internal error', { status: 500 })
        }
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
