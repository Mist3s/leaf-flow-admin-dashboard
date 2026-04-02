import React from 'react';
import { Box, Typography, Divider, styled } from '@mui/material';

interface NewMessagesSeparatorProps {
    visible?: boolean;
}

const SeparatorWrapper = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'visible'
})<{ visible?: boolean }>(
    ({ theme, visible }) => `
  display: flex;
  align-items: center;
  padding: ${theme.spacing(2, 0)};
  width: 100%;
  opacity: ${visible ? 1 : 0};
  max-height: ${visible ? '100px' : '0px'};
  overflow: hidden;
  transition: opacity 0.5s ease-out, max-height 0.5s ease-out, padding 0.5s ease-out;
  ${!visible && `padding: 0;`}
`
);

const Line = styled(Divider)(
    ({ theme }) => `
  flex-grow: 1;
  border-color: ${theme.palette.error.main};
  opacity: 0.5;
`
);

export const NewMessagesSeparator: React.FC<NewMessagesSeparatorProps> = ({ visible = true }) => {
    return (
        <SeparatorWrapper visible={visible}>
            <Line />
            <Typography
                variant="caption"
                sx={{
                    mx: 2,
                    color: 'error.main',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    fontSize: '10px',
                    letterSpacing: '1px'
                }}
            >
                Новые сообщения
            </Typography>
            <Line />
        </SeparatorWrapper>
    );
};
