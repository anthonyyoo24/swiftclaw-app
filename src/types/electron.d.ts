import { DeploymentPayload } from './ai';

export interface ElectronAPI {
    ipcRenderer: {
        sendAuthOauthStart: (payload: { provider: string }) => void;
        sendAuthOauthCancel: () => void;
        onAuthOauthComplete: (callback: (data: { success: boolean; error?: string }) => void) => () => void;
        sendDeploymentStart: (payload: DeploymentPayload) => void;
        onDeploymentSuccess: (callback: () => void) => () => void;
        onDeploymentError: (callback: (data: { message?: string }) => void) => () => void;
        onDeploymentProgress: (callback: (data: { step: number; label: string }) => void) => () => void;
        getGatewayPort: () => Promise<number>;
        getGatewayAuth: () => Promise<{ token?: string; password?: string }>;
    };
}

declare global {
    interface Window {
        electron?: ElectronAPI;
    }
}
