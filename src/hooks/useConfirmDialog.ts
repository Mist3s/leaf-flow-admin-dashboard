import { useState, useCallback } from 'react';

interface ConfirmDialogState {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

interface UseConfirmDialogReturn {
  dialogState: ConfirmDialogState;
  confirm: (title: string, message: string) => Promise<boolean>;
  handleConfirm: () => void;
  handleCancel: () => void;
}

export function useConfirmDialog(): UseConfirmDialogReturn {
  const [dialogState, setDialogState] = useState<ConfirmDialogState>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const confirm = useCallback((title: string, message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({
        open: true,
        title,
        message,
        onConfirm: () => {
          setDialogState((prev) => ({ ...prev, open: false }));
          resolve(true);
        },
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    dialogState.onConfirm();
  }, [dialogState]);

  const handleCancel = useCallback(() => {
    setDialogState((prev) => ({ ...prev, open: false }));
  }, []);

  return { dialogState, confirm, handleConfirm, handleCancel };
}
