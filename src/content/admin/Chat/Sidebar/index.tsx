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
    alpha,
    useTheme,
} from '@mui/material';
import { useConversations, useChatActions } from 'src/contexts/chat';
import { useActiveChat } from 'src/contexts/chat';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import SupportAgentTwoToneIcon from '@mui/icons-material/SupportAgentTwoTone';
import ShoppingBagTwoToneIcon from '@mui/icons-material/ShoppingBagTwoTone';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import { getCurrentAdminId } from 'src/utils/getCurrentAdminId';

// === Styled components ===

const SidebarWrapper = styled(Box)(({ theme }) => ({
    width: 340,
    minWidth: 340,
    borderRight: `1px solid ${theme.palette.divider}`,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: theme.palette.background.paper,
    height: '100%',

    [theme.breakpoints.down('md')]: {
        width: '100%',
        minWidth: '100%',
        borderRight: 'none',
    },
}));

const SidebarHeader = styled(Box)(({ theme }) => ({
    padding: theme.spacing(2, 2.5),
    paddingBottom: theme.spacing(1),
}));

const TabsContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    gap: 4,
    padding: 3,
    borderRadius: 12,
    backgroundColor: theme.colors.alpha.black[7],
}));

const ChatList = styled(List)(() => ({
    flexGrow: 1,
    overflowY: 'auto',
    padding: 0,
}));

const ConversationItem = styled(ListItemButton)(({ theme }) => ({
    margin: theme.spacing(0.5, 1.5),
    padding: theme.spacing(1.5),
    borderRadius: 14,
    border: '1px solid transparent',
    transition: 'all 0.2s ease',

    '&:hover': {
        backgroundColor: theme.colors.alpha.black[5],
        transform: 'translateY(-1px)',
        boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.06)}`,
        border: `1px solid ${theme.colors.alpha.black[10]}`,
    },

    '&.Mui-selected': {
        backgroundColor: alpha(theme.palette.primary.main, 0.06),
        border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
        '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.08),
        },
    },

    [theme.breakpoints.down('md')]: {
        margin: theme.spacing(0.5, 1),
        padding: theme.spacing(1.5, 1.25),
    },
}));

const TopicAvatar = styled(Avatar)<{ $topicType: string }>(({ theme, $topicType }) => ({
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor:
        $topicType === 'order'
            ? theme.colors.warning.lighter
            : theme.colors.primary.lighter,
    color:
        $topicType === 'order'
            ? theme.colors.warning.main
            : theme.colors.primary.main,
    boxShadow: `0 2px 6px ${alpha(theme.palette.common.black, 0.06)}`,
}));

const UnreadBadge = styled(Badge)(({ theme }) => ({
    '& .MuiBadge-badge': {
        position: 'static',
        transform: 'none',
        fontWeight: 700,
        fontSize: 11,
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        padding: '0 6px',
        boxShadow: `0 2px 4px ${alpha(theme.palette.error.main, 0.3)}`,
    },
}));

const EmptyList = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(6, 3),
    color: theme.palette.text.secondary,
    gap: theme.spacing(1),
}));

const EmptyListIcon = styled(ChatBubbleOutlineRoundedIcon)(({ theme }) => ({
    fontSize: 40,
    color: alpha(theme.palette.text.secondary, 0.2),
}));

// === Component ===

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
            <SidebarHeader>
                <Typography variant="h4" gutterBottom>Чаты</Typography>
            </SidebarHeader>
            <Box px={2} pb={1}>
                <TabsContainer>
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
                </TabsContainer>
            </Box>
            <ChatList>
                {displayedConversations.map(conv => (
                    <ConversationItem
                        key={conv.id}
                        selected={activeConversationId === conv.id}
                        onClick={() => setActiveConversation(conv.id)}
                    >
                        <ListItemAvatar>
                            <TopicAvatar $topicType={conv.topic_type}>
                                {conv.topic_type === 'order' ? <ShoppingBagTwoToneIcon /> : <SupportAgentTwoToneIcon />}
                            </TopicAvatar>
                        </ListItemAvatar>
                        <ListItemText
                            primary={
                                <Typography variant="subtitle2" noWrap fontWeight={600}>
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
                                            sx={{ display: 'block', minWidth: 0, fontSize: '12px' }}
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
                                            <UnreadBadge
                                                badgeContent={conv.unread_count}
                                                color="error"
                                            />
                                        )}
                                    </Box>
                                </Box>
                            }
                        />
                    </ConversationItem>
                ))}
                {displayedConversations.length === 0 && (
                    <EmptyList>
                        <EmptyListIcon />
                        <Typography variant="body2" color="text.secondary" fontWeight={500}>
                            Нет диалогов
                        </Typography>
                    </EmptyList>
                )}
            </ChatList>
        </SidebarWrapper>
    );
};
