import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
    Box,
    Card,
    CardContent,
    TextField,
    IconButton,
    Typography,
    styled,
    alpha,
} from '@mui/material';
import SendTwoToneIcon from '@mui/icons-material/SendTwoTone';
import { useConversations, useActiveChat, useChatActions } from 'src/contexts/chat';
import { ChatMessage } from 'src/models/chat';
import { ChatHeader } from './ChatHeader';
import { MessageBubble } from './MessageBubble';
import { SystemMessage } from './SystemMessage';
import { NewMessagesSeparator } from './NewMessagesSeparator';
import { LoadMoreTrigger } from './LoadMoreTrigger';
import { EmojiPickerButton } from './EmojiPickerButton';
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

// === Styled components ===

const ChatContainer = styled(Card)(() => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    borderRadius: 0,
    boxShadow: 'none',
    overflow: 'hidden',
}));

const MessagesList = styled(CardContent)(({ theme }) => ({
    flexGrow: 1,
    overflowY: 'auto',
    padding: theme.spacing(3),
    backgroundColor: theme.colors.alpha.black[5],

    /* Кастомный скроллбар */
    '&::-webkit-scrollbar': {
        width: 6,
    },
    '&::-webkit-scrollbar-track': {
        background: 'transparent',
    },
    '&::-webkit-scrollbar-thumb': {
        backgroundColor: theme.colors.alpha.black[30],
        borderRadius: 10,
    },
    '&::-webkit-scrollbar-thumb:hover': {
        backgroundColor: theme.colors.alpha.black[50],
    },

    [theme.breakpoints.down('md')]: {
        padding: theme.spacing(2),
    },
}));

const InputArea = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
    borderTop: `1px solid ${theme.palette.divider}`,

    [theme.breakpoints.down('md')]: {
        padding: theme.spacing(1, 1.5),
    },
}));

const SendButton = styled(IconButton)(({ theme }) => ({
    marginLeft: theme.spacing(1.5),
    padding: theme.spacing(1.25),
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    borderRadius: '50%',
    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
    transition: 'all 0.2s ease',

    '&:hover': {
        backgroundColor: theme.palette.primary.dark,
        transform: 'translateY(-1px)',
        boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.35)}`,
    },

    '&.Mui-disabled': {
        backgroundColor: theme.palette.action.disabledBackground,
        color: theme.palette.action.disabled,
        boxShadow: 'none',
        transform: 'none',
    },

    [theme.breakpoints.down('md')]: {
        marginLeft: theme.spacing(1),
        padding: theme.spacing(1),
    },
}));

const AssignedBanner = styled(Box)(({ theme }) => ({
    padding: theme.spacing(1.5, 2),
    textAlign: 'center',
    backgroundColor: alpha(theme.palette.info.main, 0.04),
    borderTop: `1px solid ${theme.palette.divider}`,
}));

// === Component ===

interface ChatWindowProps {
    conversationId: string;
    onBack?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ conversationId, onBack }) => {
    const { conversations } = useConversations();
    const { messages, hasOlderMessages, isLoadingOlder } = useActiveChat();
    const {
        setActiveConversation,
        sendMessage,
        loadOlderMessages,
        markAsRead,
    } = useChatActions();

    const [inputValue, setInputValue] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

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

        // Вернуть фокус на поле ввода (fix потери клавиатуры на mobile)
        requestAnimationFrame(() => {
            inputRef.current?.focus();
        });
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

    const handleEmojiSelect = useCallback((emoji: string) => {
        setInputValue((prev) => prev + emoji);
    }, []);

    const handlePickerClose = useCallback(() => {
        requestAnimationFrame(() => {
            inputRef.current?.focus();
        });
    }, []);

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
            <ChatHeader conversation={conversation} onBack={onBack} />
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
            {conversation.status === 'open' && isAssignedToMe && (
                <InputArea>
                    <EmojiPickerButton onEmojiSelect={handleEmojiSelect} onPickerClose={handlePickerClose} />
                    <TextField
                        fullWidth
                        inputRef={inputRef}
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
                                borderRadius: 3,
                                backgroundColor: theme.colors.alpha.black[5],
                                transition: 'all 0.25s ease',
                                '&.Mui-focused': {
                                    backgroundColor: 'background.paper',
                                    boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.15)}`,
                                },
                                '& fieldset': {
                                    border: 'none',
                                },
                            },
                        })}
                    />
                    <SendButton
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={handleSend}
                        disabled={!inputValue.trim()}
                    >
                        <SendTwoToneIcon fontSize="small" />
                    </SendButton>
                </InputArea>
            )}
            {conversation.status === 'open' && !isAssignedToMe && !isUnassigned && (
                <AssignedBanner>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        Диалог назначен: {conversation.admin_name || `ID ${conversation.assignee_admin_id}`}
                    </Typography>
                </AssignedBanner>
            )}
        </ChatContainer>
    );
};
