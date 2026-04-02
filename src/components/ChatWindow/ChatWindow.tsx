import React, { useEffect, useRef, useState, useMemo } from 'react';
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
import { useChat } from 'src/contexts/ChatContext';
import { MessageBubble } from './MessageBubble';
import { SystemMessage } from './SystemMessage';
import { NewMessagesSeparator } from './NewMessagesSeparator';
import { getCurrentAdminId } from 'src/utils/getCurrentAdminId';

const ChatContainer = styled(Card)(
    ({ theme }) => `
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
    const {
        messages,
        fetchMessages,
        sendMessage,
        conversations,
        assignToMe,
        closeConversation,
        setActiveConversationId,
        clearUnreadCount,
        unreadCounts,
        lastReadMessageIds,
        isWindowActive,
        markAsSeen
    } = useChat();

    const [inputValue, setInputValue] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const conversation = conversations.find(c => c.id === conversationId);
    const conversationMessages = messages[conversationId] || [];

    const [lastSeenId, setLastSeenId] = useState<string | null>(null);
    const [isSeparatorVisible, setIsSeparatorVisible] = useState(false);
    const [isUserActive, setIsUserActive] = useState(true);
    const separatorRef = useRef<HTMLDivElement>(null);
    const activityTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Трекинг пользовательской активности (движение мыши, нажатия клавиш)
    useEffect(() => {
        const handleActivity = () => {
            setIsUserActive(true);
            if (activityTimerRef.current) clearTimeout(activityTimerRef.current);
            activityTimerRef.current = setTimeout(() => {
                setIsUserActive(false);
            }, 5000); // 5 секунд бездействия = неактивен
        };

        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('keydown', handleActivity);
        handleActivity(); // Начальное состояние

        return () => {
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            if (activityTimerRef.current) clearTimeout(activityTimerRef.current);
        };
    }, []);

    const hasInitialScrolled = useRef<string | null>(null);

    // Инициализация при открытии чата
    useEffect(() => {
        setActiveConversationId(conversationId);
        fetchMessages(conversationId);
        // Сбрасываем флаг скролла при смене чата
        hasInitialScrolled.current = null;

        return () => {
            setActiveConversationId(null);
        };
    }, [conversationId, setActiveConversationId, fetchMessages]);

    // Логика первого скролла и установки разделителя (срабатывает когда пришли сообщения)
    useEffect(() => {
        if (hasInitialScrolled.current === conversationId || conversationMessages.length === 0) return;

        const unreadCount = unreadCounts[conversationId] || 0;

        if (unreadCount > 0 && conversationMessages.length > unreadCount) {
            const lastReadIdx = conversationMessages.length - unreadCount - 1;
            setLastSeenId(conversationMessages[lastReadIdx].id);
            setIsSeparatorVisible(true);

            // Скроллим к разделителю
            setTimeout(() => {
                if (separatorRef.current) {
                    separatorRef.current.scrollIntoView({ behavior: 'auto', block: 'center' });
                }
            }, 100);
        } else {
            setLastSeenId(conversationMessages[conversationMessages.length - 1].id);
            setIsSeparatorVisible(false);
            if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
            }
        }

        hasInitialScrolled.current = conversationId;
        clearUnreadCount(conversationId);
    }, [conversationId, conversationMessages, unreadCounts, clearUnreadCount]);

    // Управление видимостью разделителя (плавное скрытие через 3с активности)
    useEffect(() => {
        if (!isWindowActive || !isUserActive || !isSeparatorVisible) return;

        const timer = setTimeout(() => {
            setIsSeparatorVisible(false);
            if (conversationMessages.length > 0) {
                const latestId = conversationMessages[conversationMessages.length - 1].id;
                markAsSeen(conversationId, latestId);
                setLastSeenId(latestId);
            }
        }, 3000); // 3 секунды висит, потом исчезает

        return () => clearTimeout(timer);
    }, [isWindowActive, isUserActive, isSeparatorVisible, conversationId, conversationMessages, markAsSeen]);

    // Обработка новых входящих сообщений в реальном времени (после инициализации)
    useEffect(() => {
        if (conversationMessages.length === 0 || hasInitialScrolled.current !== conversationId) return;
        const lastMsg = conversationMessages[conversationMessages.length - 1];

        // Если окно активно и пользователь активен - сразу помечаем как прочитанное (без разделителя)
        if (isWindowActive && isUserActive && lastMsg.sender_kind !== 'admin') {
            setLastSeenId(lastMsg.id);
            markAsSeen(conversationId, lastMsg.id);
        }

        if (!scrollRef.current || !messagesEndRef.current) return;

        const container = scrollRef.current;
        const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 150;
        const isMyMessage = lastMsg?.sender_kind === 'admin';

        if ((isWindowActive && isAtBottom) || isMyMessage) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [conversationMessages, isWindowActive, isUserActive, conversationId, markAsSeen]);

    const handleSend = () => {
        if (!inputValue.trim()) return;
        sendMessage(inputValue.trim());
        setInputValue('');
        setIsSeparatorVisible(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const currentAdminId = useMemo(() => getCurrentAdminId(), []);

    const isAssignedToMe = conversation?.assignee_admin_id === currentAdminId;
    const isUnassigned = conversation?.assignee_admin_id === null;

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
                                <Link to={`/admin/orders/${conversation.topic_id}`} style={{ textDecoration: 'none', color: 'inherit', fontWeight: 'bold' }}>
                                    Заказ #{conversation.topic_id}
                                </Link>
                                <span>•</span>
                            </>
                        ) : (
                            <>
                                <Typography variant="inherit" fontWeight="bold">Чат Поддержки</Typography>
                                <span>•</span>
                            </>
                        )}
                        {conversation.user_id ? (
                            <Link to={`/admin/users/${conversation.user_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
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
                {conversationMessages.map((msg, index) => {
                    const isNewMessage = lastSeenId &&
                        index > 0 &&
                        conversationMessages[index - 1].id === lastSeenId &&
                        msg.id !== lastSeenId;

                    const showSeparator = isNewMessage && msg.sender_kind !== 'admin';

                    return (
                        <React.Fragment key={msg.id}>
                            {showSeparator && (
                                <div ref={separatorRef}>
                                    <NewMessagesSeparator visible={isSeparatorVisible} />
                                </div>
                            )}
                            {msg.type === 'system'
                                ? <SystemMessage message={msg} />
                                : <MessageBubble message={msg} />
                            }
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
                                    boxShadow: `0 4px 10px 0 ${theme.colors.alpha.black[10]}`
                                },
                                '& fieldset': {
                                    border: 'none'
                                }
                            }
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
                                    bgcolor: 'action.disabledBackground'
                                }
                            })
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
