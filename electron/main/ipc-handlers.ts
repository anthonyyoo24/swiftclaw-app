import { ipcMain } from 'electron';
import { OpenClawService } from './OpenClawService';
import { IPC_EVENTS } from '../../src/constants/ipc';
import { DeploymentPayload } from '../../src/types/ai';

/**
 * Redacts sensitive fields from the deployment payload for safe logging.
 */
const sanitizeDeploymentPayload = (payload: DeploymentPayload): DeploymentPayload => {
    return {
        ...payload,
        aiApiKey: payload.aiApiKey ? '***REDACTED***' : undefined,
        channelToken: payload.channelToken ? '***REDACTED***' : undefined,
    };
};

export function setupIpcHandlers() {
    const service = new OpenClawService();

    ipcMain.on(IPC_EVENTS.AUTH_OAUTH_START, async (event, payload: { provider: string }) => {
        console.log('Received auth:oauth:start with payload:', payload);
        await service.authenticate(event, payload.provider);
    });

    ipcMain.on(IPC_EVENTS.AUTH_OAUTH_CANCEL, () => {
        console.log('Received auth:oauth:cancel – triggering cleanup in service');
        service.cancel();
    });

    ipcMain.on(IPC_EVENTS.DEPLOYMENT_START, async (event, payload: DeploymentPayload) => {
        const safePayload = sanitizeDeploymentPayload(payload);
        console.log('Received deployment:start with payload:', safePayload);
        await service.deploy(event, payload);
    });
}
