import { Box, Typography, styled } from '@mui/material';
import { ChatMessage } from 'src/models/chat';
import { format } from 'date-fns';

const BubbleWrapper = styled(Box)<{ ismine: string }>(
    ({ theme, ismine }) => `
  display: flex;
  flex-direction: column;
  align-items: ${ismine === 'true' ? 'flex-end' : 'flex-start'};
  margin-bottom: ${theme.spacing(2)};
`
);

const BubbleCard = styled(Box)<{ ismine: string }>(
    ({ theme, ismine }) => `
  background: ${ismine === 'true'
            ? `linear-gradient(135deg, ${theme.colors.primary.main} 0%, ${theme.palette.primary.light} 100%)`
            : theme.palette.background.paper
        };
  color: ${ismine === 'true'
            ? theme.palette.primary.contrastText
            : theme.palette.text.primary
        };
  border-radius: 20px;
  border-bottom-right-radius: ${ismine === 'true' ? 0 : '20px'};
  border-bottom-left-radius: ${ismine !== 'true' ? 0 : '20px'};
  padding: ${theme.spacing(1.5, 2.5)};
  max-width: 80%;
  box-shadow: ${ismine === 'true'
            ? '0 4px 12px 0 rgba(85, 105, 255, 0.25)'
            : '0 2px 8px 0 rgba(0, 0, 0, 0.05)'
        };
`
);

interface MessageBubbleProps {
    message: ChatMessage;
}

export const MessageBubble = ({ message }: MessageBubbleProps) => {
    const isMine = message.sender_kind === 'admin';

    return (
        <BubbleWrapper ismine={isMine.toString()}>
            <BubbleCard ismine={isMine.toString()}>
                <Typography variant="body1">{message.body}</Typography>
            </BubbleCard>
            <Typography
                variant="caption"
                sx={{ mt: 0.5, px: 1.5, color: theme => theme.colors.alpha.black[50], fontWeight: 600, fontSize: '11px', letterSpacing: '0.5px' }}
            >
                {format(message.created_at ? new Date(message.created_at) : new Date(), 'HH:mm')}
            </Typography>
        </BubbleWrapper>
    );
};
