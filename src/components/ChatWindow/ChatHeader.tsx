import React, { useMemo } from 'react';
import {
    Box,
    Avatar,
    Typography,
    Button,
    IconButton,
    Tooltip,
    styled,
    alpha,
} from '@mui/material';
import { Link } from 'react-router-dom';
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import CheckCircleTwoToneIcon from '@mui/icons-material/CheckCircleTwoTone';
import PersonAddAltRoundedIcon from '@mui/icons-material/PersonAddAltRounded';
import SupportAgentTwoToneIcon from '@mui/icons-material/SupportAgentTwoTone';
import ShoppingBagTwoToneIcon from '@mui/icons-material/ShoppingBagTwoTone';
import { Conversation } from 'src/models/chat';
import { useChatActions } from 'src/contexts/chat';
import { getCurrentAdminId } from 'src/utils/getCurrentAdminId';

// === Styled components ===

const HeaderWrapper = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    padding: theme.spacing(1.5, 2),
    backgroundColor: alpha(theme.palette.background.paper, 0.85),
    backdropFilter: 'blur(8px)',
    borderBottom: `1px solid ${theme.palette.divider}`,
    minHeight: 64,

    [theme.breakpoints.down('md')]: {
        padding: theme.spacing(1, 1.5),
        minHeight: 56,
        gap: theme.spacing(1),
    },
}));

const TopicAvatar = styled(Avatar)<{ $topicType: string }>(({ theme, $topicType }) => ({
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor:
        $topicType === 'order'
            ? theme.colors.warning.lighter
            : theme.colors.primary.lighter,
    color:
        $topicType === 'order'
            ? theme.colors.warning.main
            : theme.colors.primary.main,
    boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.08)}`,
    flexShrink: 0,

    [theme.breakpoints.down('md')]: {
        width: 36,
        height: 36,
        borderRadius: 10,
    },
}));

const InfoBlock = styled(Box)(() => ({
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    flex: 1,
}));

const ActionsBlock = styled(Box)(({ theme }) => ({
    display: 'flex',
    gap: theme.spacing(1),
    alignItems: 'center',
    flexShrink: 0,
}));

/** Кнопка действия: на desktop — Button с текстом, на mobile — только IconButton */
const ActionButtonDesktop = styled(Button)(({ theme }) => ({
    borderRadius: 20,
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    fontWeight: 700,
    textTransform: 'none',
    whiteSpace: 'nowrap',

    [theme.breakpoints.down('md')]: {
        display: 'none',
    },
}));

const ActionIconMobile = styled(IconButton)(({ theme }) => ({
    display: 'none',

    [theme.breakpoints.down('md')]: {
        display: 'inline-flex',
    },
}));

const StatusDot = styled('span')<{ $status: string }>(({ theme, $status }) => ({
    display: 'inline-block',
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: $status === 'open' ? theme.colors.success.main : theme.colors.alpha.black[30],
    marginRight: theme.spacing(0.5),
    flexShrink: 0,
}));

// === Component ===

interface ChatHeaderProps {
    conversation: Conversation;
    onBack?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ conversation, onBack }) => {
    const { assignToMe, closeConversation } = useChatActions();

    const currentAdminId = useMemo(() => getCurrentAdminId(), []);
    const isAssignedToMe = conversation.assignee_admin_id === currentAdminId;
    const isUnassigned = conversation.assignee_admin_id === null;

    const topicLabel =
        conversation.topic_type === 'order'
            ? `Заказ #${conversation.topic_id}`
            : 'Чат Поддержки';

    const topicLink =
        conversation.topic_type === 'order'
            ? `/admin/orders/${conversation.topic_id}`
            : undefined;

    const userLink = conversation.user_id
        ? `/admin/users/${conversation.user_id}`
        : undefined;

    const userName = conversation.user_name || 'Без имени';
    const statusLabel = conversation.status === 'open' ? 'Открыт' : 'Закрыт';

    return (
        <HeaderWrapper>
            {/* Кнопка «Назад» — рендерится только если передан onBack */}
            {onBack && (
                <IconButton
                    onClick={onBack}
                    size="small"
                    sx={{ mr: 0.5 }}
                >
                    <ArrowBackIosNewRoundedIcon fontSize="small" />
                </IconButton>
            )}

            {/* Аватар типа диалога */}
            <TopicAvatar $topicType={conversation.topic_type}>
                {conversation.topic_type === 'order' ? (
                    <ShoppingBagTwoToneIcon fontSize="small" />
                ) : (
                    <SupportAgentTwoToneIcon fontSize="small" />
                )}
            </TopicAvatar>

            {/* Информация о диалоге */}
            <InfoBlock>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                    {topicLink ? (
                        <Typography
                            component={Link}
                            to={topicLink}
                            variant="subtitle2"
                            noWrap
                            sx={{
                                textDecoration: 'none',
                                color: 'inherit',
                                fontWeight: 700,
                                '&:hover': { textDecoration: 'underline' },
                            }}
                        >
                            {topicLabel}
                        </Typography>
                    ) : (
                        <Typography variant="subtitle2" fontWeight={700} noWrap>
                            {topicLabel}
                        </Typography>
                    )}
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mx: 0.25 }}>
                        •
                    </Typography>
                    {userLink ? (
                        <Typography
                            component={Link}
                            to={userLink}
                            variant="subtitle2"
                            noWrap
                            sx={{
                                textDecoration: 'none',
                                color: 'text.secondary',
                                '&:hover': { textDecoration: 'underline', color: 'primary.main' },
                            }}
                        >
                            {userName}
                        </Typography>
                    ) : (
                        <Typography variant="subtitle2" color="text.secondary" noWrap>
                            {userName}
                        </Typography>
                    )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                    <StatusDot $status={conversation.status} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px' }}>
                        {statusLabel}
                    </Typography>
                    {conversation.status === 'open' && !isAssignedToMe && !isUnassigned && (
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px', ml: 0.5 }}>
                            • {conversation.admin_name || `ID ${conversation.assignee_admin_id}`}
                        </Typography>
                    )}
                </Box>
            </InfoBlock>

            {/* Действия */}
            {conversation.status === 'open' && (
                <ActionsBlock>
                    {isUnassigned && (
                        <>
                            <ActionButtonDesktop
                                variant="contained"
                                color="primary"
                                size="small"
                                startIcon={<PersonAddAltRoundedIcon />}
                                onClick={() => assignToMe(conversation.id)}
                            >
                                Взять в работу
                            </ActionButtonDesktop>
                            <Tooltip title="Взять в работу">
                                <ActionIconMobile
                                    color="primary"
                                    size="small"
                                    onClick={() => assignToMe(conversation.id)}
                                    sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', '&:hover': { bgcolor: 'primary.dark' } }}
                                >
                                    <PersonAddAltRoundedIcon fontSize="small" />
                                </ActionIconMobile>
                            </Tooltip>
                        </>
                    )}
                    {isAssignedToMe && (
                        <>
                            <ActionButtonDesktop
                                variant="outlined"
                                color="error"
                                size="small"
                                startIcon={<CheckCircleTwoToneIcon />}
                                onClick={() => closeConversation(conversation.id)}
                            >
                                Завершить
                            </ActionButtonDesktop>
                            <Tooltip title="Завершить диалог">
                                <ActionIconMobile
                                    color="error"
                                    size="small"
                                    onClick={() => closeConversation(conversation.id)}
                                >
                                    <CheckCircleTwoToneIcon fontSize="small" />
                                </ActionIconMobile>
                            </Tooltip>
                        </>
                    )}
                </ActionsBlock>
            )}
        </HeaderWrapper>
    );
};
