import { contextBridge } from 'electron'

if (!process.contextIsolated) {
    throw new Error('contextIsolation must be enabled in the BrowserWindow')
}

try {
    contextBridge.exposeInMainWorld('electron', {
        // expose IPC here
    })
} catch (error) {
    console.error(error)
}
