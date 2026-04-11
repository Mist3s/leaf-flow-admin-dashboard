import React from 'react';
import { Box, Typography, styled, alpha, keyframes } from '@mui/material';
import PersonAddAltRoundedIcon from '@mui/icons-material/PersonAddAltRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { ChatMessage } from 'src/models/chat';

// === Animation ===

const fadeIn = keyframes`
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
`;

// === Styled components ===

const SystemWrapper = styled(Box)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'center',
    marginBottom: theme.spacing(1.5),
    marginTop: theme.spacing(0.5),
    animation: `${fadeIn} 0.3s ease-out`,
}));

const SystemPill = styled(Box)(({ theme }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing(0.75),
    backgroundColor: alpha(theme.palette.text.secondary, 0.06),
    padding: theme.spacing(0.5, 1.5),
    borderRadius: 20,
}));

const SystemIcon = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    color: theme.palette.text.secondary,
    '& .MuiSvgIcon-root': {
        fontSize: 14,
    },
}));

// === Helpers ===

function getSystemIcon(action?: string): React.ReactNode {
    switch (action) {
        case 'assigned':
            return <PersonAddAltRoundedIcon />;
        case 'closed':
            return <CheckCircleOutlineRoundedIcon />;
        default:
            return <InfoOutlinedIcon />;
    }
}

/**
 * Рендерит системное сообщение по payload.action (если доступен),
 * иначе показывает raw body.
 */
function renderSystemBody(message: ChatMessage): string {
    if (message.type !== 'system' || !message.payload) {
        return message.body || '';
    }

    switch (message.payload.action) {
        case 'assigned':
            return `${message.payload.admin_name || 'Сотрудник'} подключился к диалогу`;
        case 'closed':
            return `Диалог завершён${message.payload.admin_name ? ` (${message.payload.admin_name})` : ''}`;
        default:
            return message.body || '';
    }
}

// === Component ===

export const SystemMessage: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const action = message.payload?.action;

    return (
        <SystemWrapper>
            <SystemPill>
                <SystemIcon>{getSystemIcon(action)}</SystemIcon>
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 600, fontSize: '11px', letterSpacing: '0.2px' }}
                >
                    {renderSystemBody(message)}
                </Typography>
            </SystemPill>
        </SystemWrapper>
    );
};
