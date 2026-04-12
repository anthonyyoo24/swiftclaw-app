export const IPC_EVENTS = {
    AUTH_OAUTH_START: 'auth:oauth:start',
    AUTH_OAUTH_CANCEL: 'auth:oauth:cancel',
    AUTH_OAUTH_COMPLETE: 'auth:oauth:complete',
    DEPLOYMENT_START: 'deployment:start',
    DEPLOYMENT_PROGRESS: 'deployment:progress',
    DEPLOYMENT_SUCCESS: 'deployment:success',
    DEPLOYMENT_ERROR: 'deployment:error',
    GATEWAY_GET_PORT: 'gateway:get-port',
    GATEWAY_GET_AUTH: 'gateway:get-auth',
} as const;
