import { useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import {
    Box,
    Typography,
    styled,
    useTheme,
    useMediaQuery,
    alpha,
} from '@mui/material';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import { ChatSidebar } from './Sidebar';
import { ChatWindow } from 'src/components/ChatWindow';
import { useActiveChat, useChatActions } from 'src/contexts/chat';

// === Styled components ===

const RootWrapper = styled(Box)(() => ({
    height: 'calc(100vh - 88px)',
    display: 'flex',
    overflow: 'hidden',
}));

const ChatContent = styled(Box)(() => ({
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
}));

const EmptyState = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: theme.spacing(2),
    color: theme.palette.text.secondary,
}));

const EmptyIcon = styled(ChatBubbleOutlineRoundedIcon)(({ theme }) => ({
    fontSize: 56,
    color: alpha(theme.palette.text.secondary, 0.2),
}));

// === Component ===

function ChatPage() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { conversationId } = useActiveChat();
    const { setActiveConversation } = useChatActions();

    /**
     * На mobile: при активном диалоге показываем ChatWindow,
     * при нажатии «Назад» — закрываем диалог и возвращаемся к списку.
     */
    const mobileView = conversationId ? 'chat' : 'list';

    const handleBack = useCallback(() => {
        setActiveConversation(null);
    }, [setActiveConversation]);

    return (
        <>
            <Helmet>
                <title>Чат поддержки и заказов - Leaf Flow</title>
            </Helmet>
            <RootWrapper>
                {/* Сайдбар: на desktop — всегда, на mobile — только если нет открытого чата */}
                {(!isMobile || mobileView === 'list') && (
                    <ChatSidebar />
                )}

                {/* Контент чата: на desktop — всегда, на mobile — только при открытом чате */}
                {(!isMobile || mobileView === 'chat') && (
                    <ChatContent>
                        {conversationId ? (
                            <ChatWindow
                                conversationId={conversationId}
                                onBack={isMobile ? handleBack : undefined}
                            />
                        ) : (
                            <EmptyState>
                                <EmptyIcon />
                                <Typography variant="h5" color="text.secondary" fontWeight={500}>
                                    Выберите диалог
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Выберите диалог из списка слева, чтобы начать общение
                                </Typography>
                            </EmptyState>
                        )}
                    </ChatContent>
                )}
            </RootWrapper>
        </>
    );
}

export default ChatPage;
