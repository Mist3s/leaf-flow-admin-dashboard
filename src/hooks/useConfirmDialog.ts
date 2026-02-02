import { useState, useCallback } from 'react';

interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  confirmColor?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  onConfirm: () => void | Promise<void>;
}

interface ConfirmDialogState {
  open: boolean;
  title: string;
  message: string;
  confirmText: string;
  confirmColor: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  onConfirm: () => void | Promise<void>;
}

export interface UseConfirmDialogReturn {
  confirmDialog: ConfirmDialogState;
  openConfirmDialog: (options: ConfirmDialogOptions) => void;
  closeConfirmDialog: () => void;
  // Legacy API for backward compatibility
  dialogState: ConfirmDialogState;
  confirm: (title: string, message: string) => Promise<boolean>;
  handleConfirm: () => void;
  handleCancel: () => void;
}

const initialState: ConfirmDialogState = {
  open: false,
  title: '',
  message: '',
  confirmText: 'Подтвердить',
  confirmColor: 'primary',
  onConfirm: () => {},
};

export function useConfirmDialog(): UseConfirmDialogReturn {
  const [dialogState, setDialogState] = useState<ConfirmDialogState>(initialState);

  const openConfirmDialog = useCallback((options: ConfirmDialogOptions) => {
    setDialogState({
      open: true,
      title: options.title,
      message: options.message,
      confirmText: options.confirmText || 'Подтвердить',
      confirmColor: options.confirmColor || 'primary',
      onConfirm: options.onConfirm,
    });
  }, []);

  const closeConfirmDialog = useCallback(() => {
    setDialogState(initialState);
  }, []);

  // Legacy API
  const confirm = useCallback((title: string, message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({
        open: true,
        title,
        message,
        confirmText: 'Подтвердить',
        confirmColor: 'primary',
        onConfirm: () => {
          setDialogState(initialState);
          resolve(true);
        },
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    dialogState.onConfirm();
    closeConfirmDialog();
  }, [dialogState, closeConfirmDialog]);

  const handleCancel = useCallback(() => {
    closeConfirmDialog();
  }, [closeConfirmDialog]);

  return {
    // New API
    confirmDialog: dialogState,
    openConfirmDialog,
    closeConfirmDialog,
    // Legacy API
    dialogState,
    confirm,
    handleConfirm,
    handleCancel,
  };
}
