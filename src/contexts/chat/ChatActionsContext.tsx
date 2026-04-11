import { createContext, useContext } from 'react';

// === Actions interface ===

export interface ChatActions {
    /** Установить активный диалог (null = закрыть) */
    setActiveConversation: (id: string | null) => void;
    /** Отправить текстовое сообщение в активный диалог */
    sendMessage: (body: string) => void;
    /** Назначить диалог на текущего администратора */
    assignToMe: (conversationId: string) => Promise<void>;
    /** Закрыть диалог */
    closeConversation: (conversationId: string) => Promise<void>;
    /** Подгрузить ранние сообщения (cursor-пагинация) */
    loadOlderMessages: () => Promise<void>;
    /** Пометить диалог как прочитанный */
    markAsRead: (conversationId: string) => void;
    /** Принудительно обновить список диалогов */
    refreshConversations: () => Promise<void>;
}

// Заглушка — выбросит ошибку если контекст не инициализирован
const noop = () => {
    throw new Error('ChatActionsContext not initialized');
};

const defaultActions: ChatActions = {
    setActiveConversation: noop,
    sendMessage: noop,
    assignToMe: () => Promise.reject(new Error('Not initialized')),
    closeConversation: () => Promise.reject(new Error('Not initialized')),
    loadOlderMessages: () => Promise.reject(new Error('Not initialized')),
    markAsRead: noop,
    refreshConversations: () => Promise.reject(new Error('Not initialized')),
};

// === Context ===

const ChatActionsContext = createContext<ChatActions>(defaultActions);

export const ChatActionsProvider = ChatActionsContext.Provider;

export function useChatActions(): ChatActions {
    return useContext(ChatActionsContext);
}
