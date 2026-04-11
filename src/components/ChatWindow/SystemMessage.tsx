import { Box, Typography, styled, alpha } from '@mui/material';
import { ChatMessage } from 'src/models/chat';

const SystemWrapper = styled(Box)(
    ({ theme }) => `
  display: flex;
  justify-content: center;
  margin-bottom: ${theme.spacing(2)};
  margin-top: ${theme.spacing(1)};
`
);

const SystemCard = styled(Box)(
    ({ theme }) => `
  background-color: ${alpha(theme.palette.text.secondary, 0.1)};
  padding: ${theme.spacing(0.5, 2)};
  border-radius: ${theme.general.borderRadiusSm};
`
);

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

export const SystemMessage = ({ message }: { message: ChatMessage }) => {
    return (
        <SystemWrapper>
            <SystemCard>
                <Typography variant="caption" color="text.secondary" fontWeight="bold">
                    {renderSystemBody(message)}
                </Typography>
            </SystemCard>
        </SystemWrapper>
    );
};
