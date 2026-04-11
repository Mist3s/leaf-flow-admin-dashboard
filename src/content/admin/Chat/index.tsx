import { Helmet } from 'react-helmet-async';
import {
    Box,
    styled,
    Typography
} from '@mui/material';
import { ChatSidebar } from './Sidebar';
import { ChatWindow } from 'src/components/ChatWindow';
import { useActiveChat } from 'src/contexts/chat';

const RootWrapper = styled(Box)(
    () => `
    height: calc(100vh - 88px);
    display: flex;
    overflow: hidden;
`
);

const ChatContent = styled(Box)(
    () => `
    flex-grow: 1;
    display: flex;
    flex-direction: column;
`
);

function ChatPage() {
    const { conversationId } = useActiveChat();

    return (
        <>
            <Helmet>
                <title>Чат поддержки и заказов - Leaf Flow</title>
            </Helmet>
            <RootWrapper>
                <ChatSidebar />
                <ChatContent>
                    {conversationId ? (
                        <ChatWindow conversationId={conversationId} />
                    ) : (
                        <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                            <Typography variant="h4" color="text.secondary">
                                Выберите диалог из списка
                            </Typography>
                        </Box>
                    )}
                </ChatContent>
            </RootWrapper>
        </>
    );
}

export default ChatPage;
