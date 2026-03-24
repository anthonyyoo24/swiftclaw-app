import { ipcMain } from 'electron';
import { OpenClawService, DeploymentPayload } from './OpenClawService';

export function setupIpcHandlers() {
    let activeService: OpenClawService | null = null;

    ipcMain.on('auth:oauth:start', async (event, payload: { provider: string }) => {
        console.log('Received auth:oauth:start with payload:', payload);
        
        activeService = new OpenClawService(event);
        try {
            await activeService.authenticate(payload.provider);
        } finally {
            activeService = null;
        }
    });

    ipcMain.on('auth:oauth:cancel', () => {
        console.log('Received auth:oauth:cancel – triggering cleanup in service');
        if (activeService) {
            activeService.cancel();
            activeService = null;
        }
    });

    ipcMain.on('deployment:start', async (event, payload: DeploymentPayload) => {
        console.log('Received deployment:start with payload:', payload);
        
        const service = new OpenClawService(event);
        await service.deploy(payload);
    });
}
