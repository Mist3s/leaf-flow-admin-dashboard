import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
    Box,
    Card,
    CardHeader,
    CardContent,
    Divider,
    TextField,
    IconButton,
    Typography,
    styled,
    Button
} from '@mui/material';
import { Link } from 'react-router-dom';
import SendTwoToneIcon from '@mui/icons-material/SendTwoTone';
import CheckCircleTwoToneIcon from '@mui/icons-material/CheckCircleTwoTone';
import { useConversations, useActiveChat, useChatActions } from 'src/contexts/chat';
import { ChatMessage } from 'src/models/chat';
import { MessageBubble } from './MessageBubble';
import { SystemMessage } from './SystemMessage';
import { NewMessagesSeparator } from './NewMessagesSeparator';
import { LoadMoreTrigger } from './LoadMoreTrigger';
import { getCurrentAdminId } from 'src/utils/getCurrentAdminId';

/**
 * Найти последнее сообщение с валидным серверным id.
 * Оптимистичные сообщения (ещё без ACK) имеют id === client_msg_id — их пропускаем.
 */
function findLastServerMessage(messages: ChatMessage[]): ChatMessage | null {
    for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];
        if (msg.id && msg.id !== msg.client_msg_id) {
            return msg;
        }
    }
    return null;
}

const ChatContainer = styled(Card)(
    () => `
  display: flex;
  flex-direction: column;
  height: 100%;
  border-radius: 0;
  box-shadow: none;
`
);

const MessagesList = styled(CardContent)(
    ({ theme }) => `
  flex-grow: 1;
  overflow-y: auto;
  padding: ${theme.spacing(3)};
  background-color: ${theme.colors.alpha.black[5]};
  
  /* Кастомный скроллбар */
  &::-webkit-scrollbar {
      width: 6px;
  }
  &::-webkit-scrollbar-track {
      background: transparent;
  }
  &::-webkit-scrollbar-thumb {
      background-color: ${theme.colors.alpha.black[30]};
      border-radius: 10px;
  }
  &::-webkit-scrollbar-thumb:hover {
      background-color: ${theme.colors.alpha.black[50]};
  }
`
);

const InputArea = styled(Box)(
    ({ theme }) => `
  display: flex;
  align-items: center;
  padding: ${theme.spacing(2)};
  background-color: ${theme.palette.background.paper};
  border-bottom-left-radius: ${theme.general.borderRadiusLg};
  border-bottom-right-radius: ${theme.general.borderRadiusLg};
`
);

interface ChatWindowProps {
    conversationId: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ conversationId }) => {
    const { conversations } = useConversations();
    const { messages, hasOlderMessages, isLoadingOlder } = useActiveChat();
    const {
        setActiveConversation,
        sendMessage,
        assignToMe,
        closeConversation,
        loadOlderMessages,
        markAsRead,
    } = useChatActions();

    const [inputValue, setInputValue] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const conversation = conversations.find((c) => c.id === conversationId);

    // === Количество непрочитанных при открытии (для разделителя) ===
    const initialUnreadRef = useRef<number>(0);
    const [separatorVisible, setSeparatorVisible] = useState(false);
    const separatorRef = useRef<HTMLDivElement>(null);
    const hasInitialScrolled = useRef<string | null>(null);

    // === Инициализация при открытии диалога ===
    useEffect(() => {
        // Запоминаем unread ДО открытия (для разделителя)
        const conv = conversations.find((c) => c.id === conversationId);
        initialUnreadRef.current = conv?.unread_count || 0;
        hasInitialScrolled.current = null;

        setActiveConversation(conversationId);

        return () => {
            setActiveConversation(null);
        };
    }, [conversationId, setActiveConversation]);

    // === Первый скролл + разделитель (когда пришли сообщения) ===
    useEffect(() => {
        if (hasInitialScrolled.current === conversationId || messages.length === 0) return;

        const unread = initialUnreadRef.current;

        if (unread > 0 && messages.length > unread) {
            setSeparatorVisible(true);
            // Скролл к разделителю
            setTimeout(() => {
                separatorRef.current?.scrollIntoView({ behavior: 'auto', block: 'center' });
            }, 100);
        } else {
            setSeparatorVisible(false);
            messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
        }

        hasInitialScrolled.current = conversationId;

        // Пометить чат как прочитанный — ищем последнее сообщение с серверным id
        if (unread > 0) {
            const lastServerMsg = findLastServerMessage(messages);
            if (lastServerMsg) {
                markAsRead(conversationId, lastServerMsg.id);
            }
        }
    }, [conversationId, messages, markAsRead]);

    // === Скрытие разделителя через 3 секунды ===
    useEffect(() => {
        if (!separatorVisible) return;

        const timer = setTimeout(() => {
            setSeparatorVisible(false);
        }, 3000);

        return () => clearTimeout(timer);
    }, [separatorVisible]);

    // === Автоскролл при новых сообщениях ===
    useEffect(() => {
        if (messages.length === 0 || hasInitialScrolled.current !== conversationId) return;

        const container = scrollRef.current;
        if (!container || !messagesEndRef.current) return;

        const lastMsg = messages[messages.length - 1];
        const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 150;
        const isMyMessage = lastMsg?.sender_kind === 'admin';

        if (isAtBottom || isMyMessage) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }

        // Авто-markAsRead при просмотре нового сообщения
        if (isAtBottom && lastMsg.sender_kind !== 'admin') {
            const lastServerMsg = findLastServerMessage(messages);
            if (lastServerMsg) {
                markAsRead(conversationId, lastServerMsg.id);
            }
        }
    }, [messages, conversationId, markAsRead]);

    // === Handlers ===

    const handleSend = useCallback(() => {
        if (!inputValue.trim()) return;
        sendMessage(inputValue.trim());
        setInputValue('');
        setSeparatorVisible(false);
    }, [inputValue, sendMessage]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        },
        [handleSend]
    );

    const currentAdminId = useMemo(() => getCurrentAdminId(), []);
    const isAssignedToMe = conversation?.assignee_admin_id === currentAdminId;
    const isUnassigned = conversation?.assignee_admin_id === null;

    // === Разделитель: вычисляем позицию ===
    const separatorIndex = useMemo(() => {
        if (!separatorVisible || initialUnreadRef.current === 0) return -1;
        return messages.length - initialUnreadRef.current;
    }, [separatorVisible, messages.length]);

    if (!conversation) {
        return (
            <ChatContainer>
                <Box display="flex" alignItems="center" justifyContent="center" height="100%" p={3}>
                    <Typography color="text.secondary">Загрузка диалога...</Typography>
                </Box>
            </ChatContainer>
        );
    }

    return (
        <ChatContainer>
            <CardHeader
                title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                        {conversation.topic_type === 'order' ? (
                            <>
                                <Link
                                    to={`/admin/orders/${conversation.topic_id}`}
                                    style={{ textDecoration: 'none', color: 'inherit', fontWeight: 'bold' }}
                                >
                                    Заказ #{conversation.topic_id}
                                </Link>
                                <span>•</span>
                            </>
                        ) : (
                            <>
                                <Typography variant="inherit" fontWeight="bold">
                                    Чат Поддержки
                                </Typography>
                                <span>•</span>
                            </>
                        )}
                        {conversation.user_id ? (
                            <Link
                                to={`/admin/users/${conversation.user_id}`}
                                style={{ textDecoration: 'none', color: 'inherit' }}
                            >
                                {conversation.user_name || 'Без имени'}
                            </Link>
                        ) : (
                            <Typography variant="inherit">{conversation.user_name || 'Без имени'}</Typography>
                        )}
                    </Box>
                }
                subheader={conversation.status === 'open' ? 'Открыт' : 'Закрыт'}
                action={
                    conversation.status === 'open' && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            {isUnassigned && (
                                <Button
                                    variant="contained"
                                    color="primary"
                                    size="small"
                                    onClick={() => assignToMe(conversation.id)}
                                    sx={{ borderRadius: 8, px: 2, fontWeight: 'bold' }}
                                >
                                    Взять в работу
                                </Button>
                            )}
                            {isAssignedToMe && (
                                <Button
                                    variant="outlined"
                                    color="error"
                                    size="small"
                                    onClick={() => closeConversation(conversation.id)}
                                    startIcon={<CheckCircleTwoToneIcon />}
                                    sx={{ borderRadius: 8, px: 2, fontWeight: 'bold' }}
                                >
                                    Завершить диалог
                                </Button>
                            )}
                        </Box>
                    )
                }
            />
            <Divider />
            <MessagesList ref={scrollRef}>
                <LoadMoreTrigger
                    isLoading={isLoadingOlder}
                    hasMore={hasOlderMessages}
                    onLoadMore={loadOlderMessages}
                />
                {messages.map((msg, index) => {
                    const showSeparator = index === separatorIndex && separatorVisible;

                    return (
                        <React.Fragment key={msg.id || msg.client_msg_id}>
                            {showSeparator && (
                                <div ref={separatorRef}>
                                    <NewMessagesSeparator visible={separatorVisible} />
                                </div>
                            )}
                            {msg.type === 'system' ? (
                                <SystemMessage message={msg} />
                            ) : (
                                <MessageBubble message={msg} />
                            )}
                        </React.Fragment>
                    );
                })}
                <div ref={messagesEndRef} />
            </MessagesList>
            <Divider />
            {conversation.status === 'open' && isAssignedToMe && (
                <InputArea>
                    <TextField
                        fullWidth
                        placeholder="Введите сообщение..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        multiline
                        maxRows={4}
                        variant="outlined"
                        size="small"
                        sx={(theme) => ({
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 12,
                                backgroundColor: theme.colors.alpha.black[5],
                                transition: 'all 0.3s ease',
                                '&.Mui-focused': {
                                    backgroundColor: 'background.paper',
                                    boxShadow: `0 4px 10px 0 ${theme.colors.alpha.black[10]}`,
                                },
                                '& fieldset': {
                                    border: 'none',
                                },
                            },
                        })}
                    />
                    <IconButton
                        color="primary"
                        sx={{
                            ml: 2,
                            p: 1.5,
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText',
                            borderRadius: '50%',
                            boxShadow: '0 4px 8px 0 rgba(0,0,0,0.1)',
                            transition: 'all 0.2s',
                            '&:hover': {
                                bgcolor: 'primary.dark',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 6px 12px 0 rgba(0,0,0,0.15)',
                            },
                            ...(!inputValue.trim() && {
                                bgcolor: 'action.disabledBackground',
                                color: 'action.disabled',
                                boxShadow: 'none',
                                '&:hover': {
                                    transform: 'none',
                                    bgcolor: 'action.disabledBackground',
                                },
                            }),
                        }}
                        onClick={handleSend}
                        disabled={!inputValue.trim()}
                    >
                        <SendTwoToneIcon />
                    </IconButton>
                </InputArea>
            )}
            {conversation.status === 'open' && !isAssignedToMe && !isUnassigned && (
                <Box p={2} textAlign="center" bgcolor="background.default" borderTop={1} borderColor="divider">
                    <Typography color="text.secondary">
                        Диалог назначен на администратора: {conversation.admin_name || `ID ${conversation.assignee_admin_id}`}
                    </Typography>
                </Box>
            )}
        </ChatContainer>
    );
};
