import { Alert, Collapse } from '@mui/material';

interface NotificationAlertProps {
  message: string | null;
  type: 'success' | 'error' | 'warning' | 'info';
  onClose?: () => void;
}

function NotificationAlert({ message, type, onClose }: NotificationAlertProps) {
  return (
    <Collapse in={!!message}>
      <Alert severity={type} onClose={onClose} sx={{ mb: 2 }}>
        {message}
      </Alert>
    </Collapse>
  );
}

export default NotificationAlert;
