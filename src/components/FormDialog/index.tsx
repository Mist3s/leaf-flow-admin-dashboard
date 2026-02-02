import { ReactNode } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';

export interface FormDialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  onSubmit: () => void | Promise<void>;
  children: ReactNode;
  submitText?: string;
  cancelText?: string;
  isLoading?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  submitDisabled?: boolean;
}

/**
 * Reusable form dialog component for create/edit operations
 */
function FormDialog({
  open,
  title,
  onClose,
  onSubmit,
  children,
  submitText = 'Сохранить',
  cancelText = 'Отмена',
  isLoading = false,
  maxWidth = 'sm',
  submitDisabled = false,
}: FormDialogProps) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit();
  };

  return (
    <Dialog 
      open={open} 
      onClose={isLoading ? undefined : onClose} 
      maxWidth={maxWidth} 
      fullWidth
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          <Typography variant="h6" fontWeight={600}>
            {title}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {children}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={onClose} 
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button 
            type="submit"
            variant="contained" 
            disabled={isLoading || submitDisabled}
            startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {isLoading ? 'Сохранение...' : submitText}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default FormDialog;
