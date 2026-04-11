import React from 'react';
import { Box, Typography, Link, styled, alpha, keyframes } from '@mui/material';
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

// === Helpers ===

/** Regex для Unicode эмодзи (включая составные, флаги, модификаторы скинтона) */
const EMOJI_REGEX = /^(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F)(?:\u200D(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F))*$/u;
const EMOJI_SPLIT = /(\p{Emoji_Presentation}(?:\u200D\p{Emoji_Presentation})*|\p{Emoji}\uFE0F(?:\u200D\p{Emoji}\uFE0F)*)/gu;

/**
 * Проверяет, состоит ли сообщение только из эмодзи (≤ 8 штук).
 * Паттерн Telegram: такие сообщения показываются крупно без пузыря.
 */
function isEmojiOnly(text: string): boolean {
    const trimmed = text.trim();
    if (!trimmed) return false;

    const tokens = trimmed.match(EMOJI_SPLIT);
    if (!tokens) return false;

    // Убрали все эмодзи и пробелы — должно остаться пусто
    const withoutEmoji = trimmed.replace(EMOJI_SPLIT, '').replace(/\s/g, '');
    return withoutEmoji.length === 0 && tokens.length <= 8;
}

/** Размер эмодзи зависит от количества */
function getEmojiSize(text: string): string {
    const tokens = text.trim().match(EMOJI_SPLIT);
    const count = tokens?.length || 1;
    if (count <= 3) return '40px';
    if (count <= 5) return '32px';
    return '28px';
}

/** Превращает URL в тексте в кликабельные ссылки */
const URL_REGEX = /(https?:\/\/[^\s<>"']+)/gi;

function linkifyText(text: string, isMine: boolean): React.ReactNode[] {
    const parts = text.split(URL_REGEX);
    return parts.map((part, i) =>
        URL_REGEX.test(part) ? (
            <Link
                key={i}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                    color: isMine ? 'inherit' : 'primary.main',
                    textDecorationColor: isMine ? 'rgba(255,255,255,0.5)' : undefined,
                    wordBreak: 'break-all',
                }}
            >
                {part}
            </Link>
        ) : (
            <React.Fragment key={i}>{part}</React.Fragment>
        )
    );
}

// === Component ===

interface MessageBubbleProps {
    message: ChatMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
    const isMine = message.sender_kind === 'admin';
    const emojiOnly = isEmojiOnly(message.body);

    return (
        <BubbleWrapper $isMine={isMine}>
            {emojiOnly ? (
                /* Только эмодзи — крупно, без пузыря */
                <Box sx={{ px: 0.5 }}>
                    <Typography
                        sx={{
                            fontSize: getEmojiSize(message.body),
                            lineHeight: 1.3,
                            letterSpacing: '2px',
                        }}
                    >
                        {message.body}
                    </Typography>
                </Box>
            ) : (
                /* Обычное сообщение с пузырём */
                <BubbleCard $isMine={isMine}>
                    <Typography
                        variant="body2"
                        sx={{ lineHeight: 1.5, whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}
                    >
                        {linkifyText(message.body, isMine)}
                    </Typography>
                </BubbleCard>
            )}
            <TimeStamp variant="caption">
                {format(message.created_at ? new Date(message.created_at) : new Date(), 'HH:mm')}
            </TimeStamp>
        </BubbleWrapper>
    );
};
