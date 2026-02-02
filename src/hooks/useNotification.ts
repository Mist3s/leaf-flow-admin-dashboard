import { useState, useCallback } from 'react';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
  message: string;
  type: NotificationType;
}

interface UseNotificationReturn {
  notification: Notification | null;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
  clear: () => void;
}

export function useNotification(): UseNotificationReturn {
  const [notification, setNotification] = useState<Notification | null>(null);

  const showSuccess = useCallback((message: string) => {
    setNotification({ message, type: 'success' });
  }, []);

  const showError = useCallback((message: string) => {
    setNotification({ message, type: 'error' });
  }, []);

  const showWarning = useCallback((message: string) => {
    setNotification({ message, type: 'warning' });
  }, []);

  const showInfo = useCallback((message: string) => {
    setNotification({ message, type: 'info' });
  }, []);

  const clear = useCallback(() => {
    setNotification(null);
  }, []);

  return {
    notification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clear,
  };
}
