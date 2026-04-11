import React, { useEffect, useReducer, useRef, useCallback, useMemo, ReactNode } from 'react';
import { useAuth } from '../AuthContext';
import { chatWsClient } from '../../utils/chatWebSocket';
import { chatService } from '../../api/services/chat';
import { ChatMessage, WsOutboundEvent } from '../../models/chat';
import { getCurrentAdminId } from '../../utils/getCurrentAdminId';
import {
    ConversationsProvider,
    conversationsReducer,
    initialConversationsState,
    ConversationsAction,
} from './ConversationsContext';
import {
    ActiveChatProvider,
    activeChatReducer,
    initialActiveChatState,
    ActiveChatAction,
} from './ActiveChatContext';
import { ChatActionsProvider, ChatActions } from './ChatActionsContext';
import { Snackbar, Alert } from '@mui/material';

// === Notification state (UI-only, живёт локально в провайдере) ===

interface NotificationState {
    message: string;
    severity: 'info' | 'success' | 'warning';
}

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuth();

    const [convState, convDispatch] = useReducer(conversationsReducer, initialConversationsState);
    const [chatState, chatDispatch] = useReducer(activeChatReducer, initialActiveChatState);
    const [notification, setNotification] = React.useState<NotificationState | null>(null);

    // Refs для доступа к актуальным значениям без пересоздания замыканий
    const activeConvIdRef = useRef<string | null>(null);
    const conversationsRef = useRef(convState.conversations);

    useEffect(() => {
        activeConvIdRef.current = chatState.conversationId;
    }, [chatState.conversationId]);

    useEffect(() => {
        conversationsRef.current = convState.conversations;
    }, [convState.conversations]);

    // === Data fetching ===

    const refreshConversations = useCallback(async () => {
        try {
            const { items } = await chatService.getConversations();
            convDispatch({ type: 'LOADED', conversations: items });
        } catch (e) {
            console.error('[Chat] Failed to fetch conversations', e);
        }
    }, []);

    const fetchMessages = useCallback(async (conversationId: string) => {
        try {
            const { items, next_cursor } = await chatService.getMessages(conversationId);
            chatDispatch({ type: 'MESSAGES_LOADED', messages: items, cursor: next_cursor });
        } catch (e) {
            console.error('[Chat] Failed to fetch messages', e);
        }
    }, []);

    // === WS lifecycle ===

    useEffect(() => {
        if (!isAuthenticated) {
            chatWsClient.disconnect();
            return;
        }

        chatWsClient.connect();

        // При реконнекте — обновить данные
        chatWsClient.setOnReconnect(() => {
            refreshConversations();
            const activeId = activeConvIdRef.current;
            if (activeId) fetchMessages(activeId);
        });

        const unsub = chatWsClient.onEvent((event: WsOutboundEvent) => {
            handleWsEvent(event);
        });

        return () => {
            unsub();
            chatWsClient.setOnReconnect(null);
            chatWsClient.disconnect();
        };
    }, [isAuthenticated, refreshConversations, fetchMessages]);

    // Обработчик WS-событий — вынесен для читаемости
    const handleWsEvent = useCallback((event: WsOutboundEvent) => {
        switch (event.type) {
            case 'message.created': {
                const { conversation_id, message } = event.data;

                // ActiveChat: добавить сообщение если этот чат открыт
                if (activeConvIdRef.current === conversation_id) {
                    chatDispatch({ type: 'MESSAGE_RECEIVED', message });
                }

                // Conversations: обновить preview + timestamp
                convDispatch({
                    type: 'MESSAGE_RECEIVED',
                    conversationId: conversation_id,
                    preview: message.body?.slice(0, 150) || '',
                    timestamp: message.created_at,
                });

                // Unread: +1 если не активный чат И не своё сообщение
                if (activeConvIdRef.current !== conversation_id && message.sender_kind !== 'admin') {
                    convDispatch({ type: 'UNREAD_INCREMENT', conversationId: conversation_id });

                    // Toast-уведомление
                    const conv = conversationsRef.current.find((c) => c.id === conversation_id);
                    const senderName = conv?.user_name || 'Пользователь';
                    setNotification({
                        message: `${senderName}: ${message.body?.slice(0, 80) || 'Новое сообщение'}`,
                        severity: 'info',
                    });
                }

                // Если пришло сообщение для нового диалога — рефетч
                if (!conversationsRef.current.some((c) => c.id === conversation_id)) {
                    refreshConversations();
                }
                break;
            }

            case 'conversation.updated': {
                const { conversation_id, action, ...rest } = event.data;
                if (action === 'closed') {
                    convDispatch({
                        type: 'CONVERSATION_UPDATED',
                        conversationId: conversation_id,
                        changes: { status: 'closed' },
                    });
                } else if (action === 'assigned') {
                    convDispatch({
                        type: 'CONVERSATION_UPDATED',
                        conversationId: conversation_id,
                        changes: {
                            assignee_admin_id: rest.assignee_admin_id ?? null,
                            admin_name: rest.admin_name ?? null,
                        },
                    });
                }
                break;
            }

            case 'conversation.created': {
                chatService
                    .getConversation(event.data.conversation_id)
                    .then((conv) => {
                        convDispatch({ type: 'CONVERSATION_CREATED', conversation: conv });
                        chatWsClient.subscribe(conv.id);

                        setNotification({
                            message: `Новый чат: ${conv.user_name || 'Без имени'}`,
                            severity: 'info',
                        });
                    })
                    .catch(console.error);
                break;
            }

            case 'read_state.updated': {
                convDispatch({
                    type: 'UNREAD_UPDATED',
                    conversationId: event.data.conversation_id,
                    unreadCount: event.data.unread_count,
                });
                break;
            }

            case 'error': {
                console.error('[Chat] WS error:', event.data);
                break;
            }

            case 'pong':
                break;
        }
    }, [refreshConversations]);

    // === Subscribe to all conversations ===

    useEffect(() => {
        convState.conversations.forEach((c) => chatWsClient.subscribe(c.id));
    }, [convState.conversations]);

    // === Initial load ===

    useEffect(() => {
        if (isAuthenticated) {
            refreshConversations();
        }
    }, [isAuthenticated, refreshConversations]);

    // === Actions (stable refs) ===

    const actions: ChatActions = useMemo(() => ({
        setActiveConversation: (id: string | null) => {
            if (id) {
                chatDispatch({ type: 'OPENED', conversationId: id });
                fetchMessages(id);
            } else {
                chatDispatch({ type: 'CLOSED' });
            }
        },

        sendMessage: (body: string) => {
            const convId = activeConvIdRef.current;
            if (!convId) return;

            const clientMsgId = crypto.randomUUID();
            const adminId = getCurrentAdminId();

            const optimisticMessage: ChatMessage = {
                id: clientMsgId,
                conversation_id: convId,
                sender_kind: 'admin',
                sender_id: adminId || 0,
                type: 'text',
                body,
                payload: null,
                client_msg_id: clientMsgId,
                created_at: new Date().toISOString(),
            };

            chatDispatch({ type: 'OPTIMISTIC_SENT', message: optimisticMessage });

            // Обновить preview в sidebar
            convDispatch({
                type: 'MESSAGE_RECEIVED',
                conversationId: convId,
                preview: body.slice(0, 150),
                timestamp: optimisticMessage.created_at,
            });

            try {
                chatWsClient.sendMessage(convId, body, clientMsgId);
            } catch (e) {
                console.error('[Chat] Failed to send message', e);
                chatDispatch({ type: 'OPTIMISTIC_FAILED', clientMsgId });
                setNotification({
                    message: 'Не удалось отправить сообщение',
                    severity: 'warning',
                });
            }
        },

        assignToMe: async (conversationId: string) => {
            const adminId = getCurrentAdminId();
            if (!adminId) return;
            try {
                const updated = await chatService.updateConversation(conversationId, {
                    assignee_admin_id: adminId,
                });
                convDispatch({
                    type: 'CONVERSATION_UPDATED',
                    conversationId,
                    changes: {
                        assignee_admin_id: updated.assignee_admin_id,
                        admin_name: updated.admin_name,
                    },
                });
            } catch (e) {
                console.error('[Chat] Failed to assign conversation', e);
            }
        },

        closeConversation: async (conversationId: string) => {
            try {
                await chatService.updateConversation(conversationId, { status: 'closed' });
                convDispatch({
                    type: 'CONVERSATION_UPDATED',
                    conversationId,
                    changes: { status: 'closed' },
                });
                if (activeConvIdRef.current === conversationId) {
                    chatDispatch({ type: 'CLOSED' });
                }
            } catch (e) {
                console.error('[Chat] Failed to close conversation', e);
            }
        },

        loadOlderMessages: async () => {
            const convId = activeConvIdRef.current;
            if (!convId) return;

            // Получаем актуальный cursor из chatState через ref не получится,
            // поэтому используем chatDispatch с OLDER_LOADING и храним cursor в state
            chatDispatch({ type: 'OLDER_LOADING' });

            // Нужно прочитать cursor — но мы в stable callback и не можем читать chatState.
            // Решение: используем ref
            const cursor = chatCursorRef.current;
            if (!cursor) return;

            try {
                const { items, next_cursor } = await chatService.getMessages(convId, { cursor });
                chatDispatch({ type: 'OLDER_LOADED', messages: items, cursor: next_cursor });
            } catch (e) {
                console.error('[Chat] Failed to load older messages', e);
                chatDispatch({ type: 'OLDER_LOADED', messages: [], cursor: cursor });
            }
        },

        markAsRead: (conversationId: string) => {
            // Оптимистичное обнуление
            convDispatch({ type: 'UNREAD_UPDATED', conversationId, unreadCount: 0 });

            // Отправить mark_read с id последнего сообщения
            const messages = chatMessagesRef.current;
            if (messages.length > 0) {
                const lastMsg = messages[messages.length - 1];
                if (lastMsg.id) {
                    chatWsClient.markRead(conversationId, lastMsg.id);
                }
            }
        },

        refreshConversations,
    }), [refreshConversations, fetchMessages]);

    // === Refs for stable actions ===

    const chatCursorRef = useRef(chatState.nextCursor);
    useEffect(() => {
        chatCursorRef.current = chatState.nextCursor;
    }, [chatState.nextCursor]);

    const chatMessagesRef = useRef(chatState.messages);
    useEffect(() => {
        chatMessagesRef.current = chatState.messages;
    }, [chatState.messages]);

    // === Notification UI ===

    const handleCloseNotification = useCallback(() => {
        setNotification(null);
    }, []);

    return (
        <ChatActionsProvider value={actions}>
            <ConversationsProvider value={convState}>
                <ActiveChatProvider value={chatState}>
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
                </ActiveChatProvider>
            </ConversationsProvider>
        </ChatActionsProvider>
    );
};
