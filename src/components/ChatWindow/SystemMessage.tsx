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

export const SystemMessage = ({ message }: { message: ChatMessage }) => {
    return (
        <SystemWrapper>
            <SystemCard>
                <Typography variant="caption" color="text.secondary" fontWeight="bold">
                    {message.body}
                </Typography>
            </SystemCard>
        </SystemWrapper>
    );
};
