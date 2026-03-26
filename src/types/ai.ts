export type AIAuthType = 'apiKey' | 'oauth';

export interface DeploymentPayload {
    aiAuthType: AIAuthType;
    isAiAuthenticated: boolean;
    aiProvider: string;
    aiModel: string;
    aiApiKey?: string;
    selectedChannel?: 'discord' | 'telegram' | 'whatsapp';
    channelToken?: string;
    agentTemplateIds: string[];
}

export interface OAuthProviderEntry {
    provider: string;
    method?: string;
}
