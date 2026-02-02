import { Box, Typography, Button } from '@mui/material';
import InboxTwoToneIcon from '@mui/icons-material/InboxTwoTone';

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

function EmptyState({
  title = 'Нет данных',
  message = 'Данные отсутствуют',
  icon,
  action,
}: EmptyStateProps) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      py={6}
      gap={2}
    >
      {icon || <InboxTwoToneIcon sx={{ fontSize: 64, color: 'text.secondary' }} />}
      <Typography variant="h5" color="text.secondary">
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
      {action && (
        <Button variant="contained" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </Box>
  );
}

export default EmptyState;
