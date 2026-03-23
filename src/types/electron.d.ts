export interface ElectronAPI {
    ipcRenderer: {
        send: (channel: string, ...args: unknown[]) => void;
        on: (channel: string, func: (...args: unknown[]) => void) => () => void;
        removeAllListeners: (channel: string) => void;
    };
}

declare global {
    interface Window {
        electron: ElectronAPI;
    }
}
