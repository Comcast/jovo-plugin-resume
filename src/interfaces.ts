import { Inputs, PluginConfig } from 'jovo-core';

export const STATUS_KEY = 'conversationStatus';
export const CURRENT_KEY = 'currentConversation';

export interface JovoResumerConfig extends PluginConfig {
    resumeDataKey: string;
}

export interface ConversationStatus {
    name: string;
    state: string;
    intent: string;
    timestamp: string;
    slots: Inputs;
}

export interface ResumeData {
    [CURRENT_KEY]?: string | null;
    [STATUS_KEY]?: ConversationStatus[];
}

export interface ResumeActionData {
    comingFrom: ConversationStatus;
    resumingInto: ConversationStatus;
}
