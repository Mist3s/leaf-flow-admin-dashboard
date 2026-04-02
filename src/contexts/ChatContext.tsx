import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { chatWsClient } from '../utils/chatWebSocket';
import { ChatMessage, Conversation } from '../models/chat';
import { chatService } from '../api/services/chat';
import { getCurrentAdminId } from '../utils/getCurrentAdminId';
import { Snackbar, Alert } from '@mui/material';
import { useChatWebSocket } from '../hooks/useChatWebSocket';

interface ChatContextType {
    unreadCount: number;
    conversations: Conversation[];
    activeConversationId: string | null;
    setActiveConversationId: (id: string | null) => void;
    messages: Record<string, ChatMessage[]>;
    unreadCounts: Record<string, number>;
    clearUnreadCount: (conversationId: string) => void;
    sendMessage: (body: string) => Promise<void>;
    assignToMe: (conversationId: string) => Promise<void>;
    closeConversation: (conversationId: string) => Promise<void>;
    fetchConversations: () => Promise<void>;
    fetchMessages: (conversationId: string) => Promise<void>;
    markAsSeen: (conversationId: string, messageId: string) => void;
    lastReadMessageIds: Record<string, string>;
    isWindowActive: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};

const POLLING_INTERVAL_MS = 15_000;

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

    const activeConversationIdRef = useRef(activeConversationId);
    useEffect(() => {
        activeConversationIdRef.current = activeConversationId;
    }, [activeConversationId]);

    const [isWindowActive, setIsWindowActive] = useState(true);
    const [lastReadMessageIds, setLastReadMessageIds] = useState<Record<string, string>>({});

    // Стейт для глобального уведомления (Snackbar)
    const [notification, setNotification] = useState<{ message: string; severity: 'info' | 'success' | 'warning' } | null>(null);

    const handleCloseNotification = useCallback(() => {
        setNotification(null);
    }, []);

    useEffect(() => {
        const onFocus = () => setIsWindowActive(true);
        const onBlur = () => setIsWindowActive(false);
        window.addEventListener('focus', onFocus);
        window.addEventListener('blur', onBlur);
        return () => {
            window.removeEventListener('focus', onFocus);
            window.removeEventListener('blur', onBlur);
        };
    }, []);

    const conversationsRef = useRef(conversations);
    useEffect(() => {
        conversationsRef.current = conversations;
    }, [conversations]);

    const messagesRef = useRef(messages);
    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    const clearUnreadCount = useCallback((conversationId: string) => {
        setUnreadCounts(prev => ({ ...prev, [conversationId]: 0 }));

        // Отметка как прочитано на сервере
        const conversationMessages = messagesRef.current[conversationId] || [];
        if (conversationMessages.length > 0) {
            const lastMessage = conversationMessages[conversationMessages.length - 1];
            if (lastMessage.id) {
                chatWsClient.markRead(conversationId, lastMessage.id);
            }
        }
    }, []);

    const fetchConversations = useCallback(async () => {
        try {
            const data = await chatService.getConversations();
            const sorted = data.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());

            // Определяем новые чаты в очереди (без назначенного админа, статус open),
            // которых не было в предыдущем списке.
            const prevIds = new Set(conversationsRef.current.map(c => c.id));
            const newQueueChats = sorted.filter(
                c => !prevIds.has(c.id) && c.status === 'open' && c.assignee_admin_id === null
            );

            // Показываем уведомление только если это не первая загрузка (т.е. были ранее загруженные чаты)
            if (conversationsRef.current.length > 0 && newQueueChats.length > 0) {
                const label = newQueueChats.length === 1
                    ? `Новый чат в очереди: ${newQueueChats[0].user_name || 'Без имени'}`
                    : `Новых чатов в очереди: ${newQueueChats.length}`;
                setNotification({ message: label, severity: 'info' });
            }

            setConversations(sorted);
        } catch (e) {
            console.error('Failed to fetch conversations', e);
        }
    }, []);

    // Поллинг: запрашиваем список чатов каждые 15 секунд
    useEffect(() => {
        if (!isAuthenticated) return;

        // Первичная загрузка
        fetchConversations();

        const intervalId = setInterval(() => {
            fetchConversations();
        }, POLLING_INTERVAL_MS);

        return () => clearInterval(intervalId);
    }, [isAuthenticated, fetchConversations]);

    const fetchMessages = useCallback(async (conversationId: string) => {
        try {
            const data = await chatService.getMessages(conversationId);
            const sorted = data.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            setMessages(prev => ({ ...prev, [conversationId]: sorted }));
        } catch (e) {
            console.error('Failed to fetch messages', e);
        }
    }, []);

    useChatWebSocket({
        isAuthenticated,
        conversations,
        conversationsRef,
        activeConversationIdRef,
        isWindowActive,
        setMessages,
        setUnreadCounts,
        setLastReadMessageIds,
        setNotification,
        fetchConversations,
        fetchMessages,
        setConversations
    });



    const markAsSeen = useCallback((conversationId: string, messageId: string) => {
        setLastReadMessageIds(prev => ({ ...prev, [conversationId]: messageId }));
    }, []);

    const sendMessage = useCallback(async (body: string) => {
        if (!activeConversationId) return;
        const clientMsgId = crypto.randomUUID();
        const adminId = getCurrentAdminId();

        // Оптимистичное обновление: сообщение появляется мгновенно
        const optimisticMessage: ChatMessage = {
            id: clientMsgId,
            conversation_id: activeConversationId,
            sender_kind: 'admin',
            sender_id: adminId || 0,
            type: 'text',
            body,
            payload: null,
            client_msg_id: clientMsgId,
            created_at: new Date().toISOString(),
        };

        setMessages(prev => ({
            ...prev,
            [activeConversationId]: [...(prev[activeConversationId] || []), optimisticMessage]
        }));

        try {
            chatWsClient.sendMessage(activeConversationId, body, clientMsgId);
        } catch (e) {
            console.error('Failed to send message', e);
            // Удаляем оптимистичное сообщение при ошибке
            setMessages(prev => ({
                ...prev,
                [activeConversationId]: (prev[activeConversationId] || []).filter(m => m.client_msg_id !== clientMsgId)
            }));
            setNotification({ message: 'Не удалось отправить сообщение', severity: 'warning' });
        }
    }, [activeConversationId, setMessages, setNotification]);

    const assignToMe = async (conversationId: string) => {
        const adminId = getCurrentAdminId();
        if (!adminId) return;
        try {
            await chatService.updateConversation(conversationId, { assignee_admin_id: adminId });
            await fetchConversations();
        } catch (e) {
            console.error('Failed to assign conversation', e);
        }
    };

    const closeConversation = async (conversationId: string) => {
        try {
            await chatService.updateConversation(conversationId, { status: 'closed' });
            await fetchConversations();
            if (activeConversationId === conversationId) {
                setActiveConversationId(null);
            }
        } catch (e) {
            console.error('Failed to close conversation', e);
        }
    };

    // Суммарный счетчик всех непрочитанных сообщений
    const unreadCount = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

    return (
        <ChatContext.Provider value={{
            unreadCount,
            conversations,
            activeConversationId,
            setActiveConversationId,
            messages,
            unreadCounts,
            clearUnreadCount,
            sendMessage,
            assignToMe,
            closeConversation,
            fetchConversations,
            fetchMessages,
            lastReadMessageIds,
            isWindowActive,
            markAsSeen
        }}>
            {children}
            <Snackbar
                open={!!notification}
                autoHideDuration={5000}
                onClose={handleCloseNotification}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={handleCloseNotification}
                    severity={notification?.severity || 'info'}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {notification?.message}
                </Alert>
            </Snackbar>
        </ChatContext.Provider>
    );
};
