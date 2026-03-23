import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

if (!process.contextIsolated) {
    throw new Error('contextIsolation must be enabled in the BrowserWindow')
}

try {
    contextBridge.exposeInMainWorld('electron', {
        ipcRenderer: {
            send: (channel: string, ...args: unknown[]) => ipcRenderer.send(channel, ...args),
            on: (channel: string, func: (...args: unknown[]) => void) => {
                const subscription = (_event: IpcRendererEvent, ...args: unknown[]) => func(...args);
                ipcRenderer.on(channel, subscription);
                return () => ipcRenderer.removeListener(channel, subscription);
            },
            removeAllListeners: (channel: string) => ipcRenderer.removeAllListeners(channel)
        }
    })
} catch (error) {
    console.error(error)
}
