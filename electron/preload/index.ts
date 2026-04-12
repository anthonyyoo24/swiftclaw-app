import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

if (!process.contextIsolated) {
    throw new Error('contextIsolation must be enabled in the BrowserWindow')
}

try {
    contextBridge.exposeInMainWorld('electron', {
        ipcRenderer: {
            sendAuthOauthStart: (payload: { provider: string }) => ipcRenderer.send('auth:oauth:start', payload),
            sendAuthOauthCancel: () => ipcRenderer.send('auth:oauth:cancel'),
            onAuthOauthComplete: (callback: (data: unknown) => void) => {
                const subscription = (_event: IpcRendererEvent, data: unknown) => callback(data);
                ipcRenderer.on('auth:oauth:complete', subscription);
                return () => ipcRenderer.removeListener('auth:oauth:complete', subscription);
            },
            sendDeploymentStart: (payload: unknown) => ipcRenderer.send('deployment:start', payload),
            onDeploymentSuccess: (callback: () => void) => {
                const subscription = () => callback();
                ipcRenderer.on('deployment:success', subscription);
                return () => ipcRenderer.removeListener('deployment:success', subscription);
            },
            onDeploymentError: (callback: (data: unknown) => void) => {
                const subscription = (_event: IpcRendererEvent, data: unknown) => callback(data);
                ipcRenderer.on('deployment:error', subscription);
                return () => ipcRenderer.removeListener('deployment:error', subscription);
            },
            onDeploymentProgress: (callback: (data: { step: number; label: string }) => void) => {
                const subscription = (_event: IpcRendererEvent, data: { step: number; label: string }) => callback(data);
                ipcRenderer.on('deployment:progress', subscription);
                return () => ipcRenderer.removeListener('deployment:progress', subscription);
            },
            getGatewayPort: (): Promise<number> => ipcRenderer.invoke('gateway:get-port'),
            getGatewayAuth: (): Promise<{ token?: string; password?: string }> => ipcRenderer.invoke('gateway:get-auth'),
        }
    })
} catch (error) {
    console.error(error)
}
