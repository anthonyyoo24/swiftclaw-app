export type AIAuthType = 'apiKey' | 'oauth';

export interface DeploymentPayload {
    aiAuthType: AIAuthType;
    isAiAuthenticated: boolean;
    aiProvider: string;
    aiModel: string;
    aiApiKey?: string;
    selectedChannel: 'discord' | 'telegram';
    channelToken: string;
    agentTemplateIds: string[];
    userName: string;
    timezone: string;
    usageType: 'business' | 'personal';
    businessDescription?: string;
    personalContext?: string;
    goals: string;
    workflows: string[];
    tools?: string[];
    convexUrl: string;
    workspaceSecret: string;
}

export interface OAuthProviderEntry {
    provider: string;
    method?: string;
}
