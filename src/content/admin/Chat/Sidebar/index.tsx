import { useState } from 'react';
import {
    Box,
    List,
    ListItemButton,
    ListItemAvatar,
    ListItemText,
    Avatar,
    Typography,
    Tabs,
    Tab,
    Badge,
    styled,
    useTheme
} from '@mui/material';
import { useConversations, useChatActions } from 'src/contexts/chat';
import { useActiveChat } from 'src/contexts/chat';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import SupportAgentTwoToneIcon from '@mui/icons-material/SupportAgentTwoTone';
import ShoppingBagTwoToneIcon from '@mui/icons-material/ShoppingBagTwoTone';
import { getCurrentAdminId } from 'src/utils/getCurrentAdminId';

const SidebarWrapper = styled(Box)(
    ({ theme }) => `
  width: 320px;
  min-width: 320px;
  border-right: 1px solid ${theme.palette.divider};
  display: flex;
  flex-direction: column;
  background-color: ${theme.palette.background.paper};
  height: 100%;
`
);

const ChatList = styled(List)(
    () => `
  flex-grow: 1;
  overflow-y: auto;
  padding: 0;
`
);

export const ChatSidebar = () => {
    const theme = useTheme();
    const { conversations } = useConversations();
    const { conversationId: activeConversationId } = useActiveChat();
    const { setActiveConversation } = useChatActions();
    const [tabIndex, setTabIndex] = useState(0);

    const currentAdminId = getCurrentAdminId();

    const myConversations = conversations.filter(c => c.assignee_admin_id === currentAdminId && c.status === 'open');
    const queueConversations = conversations.filter(c => c.assignee_admin_id === null && c.status === 'open');
    const closedConversations = conversations.filter(c => c.status === 'closed');

    const displayedConversations = tabIndex === 0
        ? myConversations
        : tabIndex === 1
            ? queueConversations
            : closedConversations;

    const tabSx = {
        minHeight: 34,
        minWidth: 'auto',
        flex: 1,
        px: 2,
        py: 0.5,
        borderRadius: '8px',
        textTransform: 'none' as const,
        fontWeight: 700,
        fontSize: '13px',
        color: 'text.primary',
        opacity: 0.65,
        overflow: 'visible',
        transition: 'all 0.2s ease',
        '&:hover': {
            opacity: 1,
            bgcolor: 'rgba(0,0,0,0.04)',
            color: 'text.primary',
        },
        '&.Mui-selected': {
            opacity: 1,
            color: 'primary.main',
            bgcolor: 'background.paper',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
            '&:hover': {
                bgcolor: 'background.paper',
                color: 'primary.main',
            }
        },
    };

    const badgeSx = {
        '& .MuiBadge-badge': {
            right: -12,
            top: -2,
            fontWeight: 700,
            fontSize: '10px',
            height: 18,
            minWidth: 18,
            padding: '0 5px',
        }
    };

    return (
        <SidebarWrapper>
            <Box p={2}>
                <Typography variant="h4" gutterBottom>Чаты</Typography>
            </Box>
            <Box px={2} pt={1} pb={1}>
                <Box
                    sx={{
                        display: 'flex',
                        gap: '4px',
                        p: '3px',
                        borderRadius: '12px',
                        bgcolor: theme => theme.colors.alpha.black[12],
                    }}
                >
                    <Tabs
                        variant="fullWidth"
                        value={tabIndex}
                        onChange={(_, v) => setTabIndex(v)}
                        sx={{
                            minHeight: 34,
                            width: '100%',
                            overflow: 'visible',
                            '& .MuiTabs-indicator': { display: 'none' },
                            '& .MuiTabs-flexContainer': {
                                gap: '4px',
                            },
                            '& .MuiTabs-scroller': {
                                overflow: 'visible !important',
                            },
                        }}
                    >
                        <Tab
                            disableRipple
                            sx={tabSx}
                            label={
                                <Badge badgeContent={myConversations.length} color="error"
                                    invisible={myConversations.length === 0} sx={badgeSx}>
                                    Мои
                                </Badge>
                            }
                        />
                        <Tab
                            disableRipple
                            sx={tabSx}
                            label={
                                <Badge badgeContent={queueConversations.length} color="info"
                                    invisible={queueConversations.length === 0} sx={badgeSx}>
                                    Очередь
                                </Badge>
                            }
                        />
                        <Tab disableRipple sx={tabSx} label="Закрытые" />
                    </Tabs>
                </Box>
            </Box>
            <ChatList>
                {displayedConversations.map(conv => (
                    <ListItemButton
                        key={conv.id}
                        selected={activeConversationId === conv.id}
                        onClick={() => setActiveConversation(conv.id)}
                        sx={{
                            mx: 2,
                            my: 1,
                            p: 1.5,
                            borderRadius: '16px',
                            border: '1px solid transparent',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                                backgroundColor: theme.colors.alpha.black[5],
                                transform: 'translateY(-2px)',
                                boxShadow: `0 4px 10px 0 ${theme.colors.alpha.black[10]}`,
                                border: `1px solid ${theme.colors.alpha.black[10]}`
                            },
                            '&.Mui-selected': {
                                backgroundColor: theme.colors.primary.lighter,
                                border: `1px solid ${theme.colors.primary.light}`,
                                '&:hover': {
                                    backgroundColor: theme.colors.primary.lighter
                                }
                            }
                        }}
                    >
                        <ListItemAvatar>
                            <Avatar sx={{
                                bgcolor: conv.topic_type === 'order' ? theme.colors.warning.lighter : theme.colors.primary.lighter,
                                color: conv.topic_type === 'order' ? theme.colors.warning.main : theme.colors.primary.main,
                                width: 48,
                                height: 48,
                                borderRadius: '14px',
                                boxShadow: `0 2px 6px 0 ${theme.colors.alpha.black[10]}`
                            }}>
                                {conv.topic_type === 'order' ? <ShoppingBagTwoToneIcon /> : <SupportAgentTwoToneIcon />}
                            </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                            primary={
                                <Typography variant="subtitle2" noWrap>
                                    {conv.topic_type === 'order'
                                        ? `Заказ #${conv.topic_id} • ${conv.user_name || 'Без имени'}`
                                        : `Поддержка • ${conv.user_name || 'Без имени'}`}
                                </Typography>
                            }
                            secondary={
                                <Box display="flex" flexDirection="column" mt={0.5} gap={0.25}>
                                    {conv.last_message_preview && (
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            noWrap
                                            sx={{ display: 'block', minWidth: 0 }}
                                        >
                                            {conv.last_message_preview}
                                        </Typography>
                                    )}
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            noWrap
                                            sx={{ display: 'block', flex: 1, minWidth: 0, fontSize: '11px' }}
                                        >
                                            {conv.last_message_at
                                                ? formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true, locale: ru })
                                                : 'Нет сообщений'}
                                        </Typography>
                                        {conv.unread_count > 0 && (
                                            <Badge
                                                badgeContent={conv.unread_count}
                                                color="error"
                                                sx={{
                                                    '& .MuiBadge-badge': {
                                                        position: 'static',
                                                        transform: 'none'
                                                    }
                                                }}
                                            />
                                        )}
                                    </Box>
                                </Box>
                            }
                        />
                    </ListItemButton>
                ))}
                {displayedConversations.length === 0 && (
                    <Box p={3} textAlign="center">
                        <Typography variant="body2" color="text.secondary">
                            Нет диалогов
                        </Typography>
                    </Box>
                )}
            </ChatList>
        </SidebarWrapper>
    );
};
