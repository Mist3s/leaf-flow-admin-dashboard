import { useEffect, useCallback, useRef } from 'react';
import { chatWsClient } from '../utils/chatWebSocket';
import { ChatMessage, Conversation } from '../models/chat';

interface UseChatWebSocketProps {
    isAuthenticated: boolean;
    conversations: Conversation[];
    conversationsRef: React.MutableRefObject<Conversation[]>;
    activeConversationIdRef: React.MutableRefObject<string | null>;
    isWindowActive: boolean;
    setMessages: React.Dispatch<React.SetStateAction<Record<string, ChatMessage[]>>>;
    setUnreadCounts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
    setLastReadMessageIds: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    setNotification: React.Dispatch<React.SetStateAction<{ message: string; severity: 'info' | 'success' | 'warning' } | null>>;
    fetchConversations: () => Promise<void>;
    fetchMessages: (conversationId: string) => Promise<void>;
    setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
}

export const useChatWebSocket = ({
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
}: UseChatWebSocketProps) => {

    // Используем ref для isWindowActive, чтобы не пересоздавать обработчики WS
    const isWindowActiveRef = useRef(isWindowActive);
    useEffect(() => {
        isWindowActiveRef.current = isWindowActive;
    }, [isWindowActive]);

    // Подключение к WebSocket при авторизации
    useEffect(() => {
        if (isAuthenticated) {
            chatWsClient.connect();
        } else {
            chatWsClient.disconnect();
        }
    }, [isAuthenticated]);

    const subscribeToAll = useCallback(() => {
        conversations.forEach(conv => chatWsClient.subscribe(conv.id));
    }, [conversations]);

    useEffect(() => {
        if (conversations.length > 0) {
            subscribeToAll();
        }
    }, [conversations, subscribeToAll]);

    // Обработка входящих WS сообщений
    useEffect(() => {
        const unsubMsg = chatWsClient.onMessage((convId, message) => {
            setMessages(prev => {
                const existing = prev[convId] || [];

                // Проверка точного дубля по id
                if (message.id && existing.some(m => m.id === message.id)) {
                    return prev;
                }

                // Если пришло серверное подтверждение оптимистичного сообщения — заменяем его
                if (message.client_msg_id) {
                    const optimisticIdx = existing.findIndex(m => m.client_msg_id === message.client_msg_id);
                    if (optimisticIdx >= 0) {
                        const updated = [...existing];
                        updated[optimisticIdx] = message;
                        return { ...prev, [convId]: updated };
                    }
                }

                // Увеличиваем счетчик непрочитанных, если это чужое сообщение не в открытом окне
                if (activeConversationIdRef.current !== convId && message.sender_kind !== 'admin') {
                    setUnreadCounts(prevCounts => ({
                        ...prevCounts,
                        [convId]: (prevCounts[convId] || 0) + 1
                    }));

                    // Уведомление о новом сообщении в неактивном чате
                    const conv = conversationsRef.current.find(c => c.id === convId);
                    const senderName = conv?.user_name || 'Пользователь';
                    setNotification({ message: `${senderName}: ${message.body?.slice(0, 80) || 'Новое сообщение'}`, severity: 'info' });
                }

                // Если окно активно и этот чат открыт - помечаем сообщение как прочитанное сразу
                if (isWindowActiveRef.current && activeConversationIdRef.current === convId) {
                    setLastReadMessageIds(prev => ({ ...prev, [convId]: message.id }));
                }

                return {
                    ...prev,
                    [convId]: [...existing, message].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                };
            });

            // Проверка, является ли диалог новым
            const isNewConversation = !conversationsRef.current.some(c => c.id === convId);

            if (isNewConversation) {
                fetchConversations();
            } else {
                setConversations(prev => {
                    const copy = [...prev];
                    const idx = copy.findIndex(c => c.id === convId);
                    if (idx >= 0) {
                        copy[idx] = { ...copy[idx], last_message_at: message.created_at };
                        return copy.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
                    }
                    return prev;
                });
            }
        });

        const unsubUpdate = chatWsClient.onUpdate((convId) => {
            fetchConversations();
            fetchMessages(convId);
        });

        return () => {
            unsubMsg();
            unsubUpdate();
        };
    }, [
        fetchConversations,
        fetchMessages,
        setMessages,
        setUnreadCounts,
        setNotification,
        setLastReadMessageIds,
        setConversations,
        conversationsRef,
        activeConversationIdRef,
    ]);
};
