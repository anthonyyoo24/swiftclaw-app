import { ipcMain } from 'electron';
import { OpenClawService, DeploymentPayload } from './OpenClawService';

export function setupIpcHandlers() {
    ipcMain.on('deployment:start', async (event, payload: DeploymentPayload) => {
        console.log('Received deployment:start with payload:', payload);
        
        const service = new OpenClawService(event);
        await service.deploy(payload);
    });
}
