import React from 'react';
import { Box, Typography, styled, alpha, keyframes } from '@mui/material';
import { ChatMessage } from 'src/models/chat';
import { format } from 'date-fns';

// === Animations ===

const slideInRight = keyframes`
  from {
    opacity: 0;
    transform: translateY(8px) translateX(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0) translateX(0);
  }
`;

const slideInLeft = keyframes`
  from {
    opacity: 0;
    transform: translateY(8px) translateX(-12px);
  }
  to {
    opacity: 1;
    transform: translateY(0) translateX(0);
  }
`;

// === Styled components ===

const BubbleWrapper = styled(Box, {
    shouldForwardProp: (prop) => prop !== '$isMine',
})<{ $isMine: boolean }>(({ theme, $isMine }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: $isMine ? 'flex-end' : 'flex-start',
    marginBottom: theme.spacing(1.5),
    animation: `${$isMine ? slideInRight : slideInLeft} 0.3s ease-out`,
}));

const BubbleCard = styled(Box, {
    shouldForwardProp: (prop) => prop !== '$isMine',
})<{ $isMine: boolean }>(({ theme, $isMine }) => ({
    background: $isMine
        ? `linear-gradient(135deg, ${theme.colors.primary.main} 0%, ${theme.palette.primary.light} 100%)`
        : theme.palette.background.paper,
    color: $isMine
        ? theme.palette.primary.contrastText
        : theme.palette.text.primary,
    borderRadius: 18,
    borderBottomRightRadius: $isMine ? 4 : 18,
    borderBottomLeftRadius: $isMine ? 18 : 4,
    padding: theme.spacing(1.25, 2),
    maxWidth: '75%',
    boxShadow: $isMine
        ? `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`
        : `0 1px 4px ${alpha(theme.palette.common.black, 0.06)}`,
    wordBreak: 'break-word',

    [theme.breakpoints.down('md')]: {
        maxWidth: '85%',
        padding: theme.spacing(1, 1.5),
    },
}));

const TimeStamp = styled(Typography)(({ theme }) => ({
    marginTop: theme.spacing(0.5),
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
    color: theme.colors.alpha.black[50],
    fontWeight: 500,
    fontSize: '11px',
    letterSpacing: '0.3px',
    userSelect: 'none',
}));

// === Component ===

interface MessageBubbleProps {
    message: ChatMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
    const isMine = message.sender_kind === 'admin';

    return (
        <BubbleWrapper $isMine={isMine}>
            <BubbleCard $isMine={isMine}>
                <Typography
                    variant="body2"
                    sx={{ lineHeight: 1.5, whiteSpace: 'pre-wrap' }}
                >
                    {message.body}
                </Typography>
            </BubbleCard>
            <TimeStamp variant="caption">
                {format(message.created_at ? new Date(message.created_at) : new Date(), 'HH:mm')}
            </TimeStamp>
        </BubbleWrapper>
    );
};
