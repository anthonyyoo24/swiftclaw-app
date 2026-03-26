import { ipcMain } from 'electron';
import { OpenClawService, DeploymentPayload } from './OpenClawService';

export function setupIpcHandlers() {
    const service = new OpenClawService();

    ipcMain.on('auth:oauth:start', async (event, payload: { provider: string }) => {
        console.log('Received auth:oauth:start with payload:', payload);
        await service.authenticate(event, payload.provider);
    });

    ipcMain.on('auth:oauth:cancel', () => {
        console.log('Received auth:oauth:cancel – triggering cleanup in service');
        service.cancel();
    });

    ipcMain.on('deployment:start', async (event, payload: DeploymentPayload) => {
        console.log('Received deployment:start with payload:', payload);
        await service.deploy(event, payload);
    });
}
