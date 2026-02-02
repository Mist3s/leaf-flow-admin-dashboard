import { useState, useCallback } from 'react';

interface UseFormDialogOptions<T> {
  defaultValues: T;
  onSubmit: (data: T, isEditing: boolean) => Promise<void>;
  onSuccess?: () => void;
}

interface UseFormDialogResult<T, E> {
  isOpen: boolean;
  isEditing: boolean;
  editingItem: E | null;
  formData: T;
  isLoading: boolean;
  error: string;
  open: (item?: E) => void;
  close: () => void;
  setFormData: React.Dispatch<React.SetStateAction<T>>;
  updateField: <K extends keyof T>(field: K, value: T[K]) => void;
  handleSubmit: () => Promise<void>;
  clearError: () => void;
}

/**
 * Hook for managing form dialog state for create/edit operations
 */
export function useFormDialog<T extends Record<string, any>, E = any>(
  options: UseFormDialogOptions<T>,
  itemToFormData?: (item: E) => T
): UseFormDialogResult<T, E> {
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<E | null>(null);
  const [formData, setFormData] = useState<T>(options.defaultValues);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const open = useCallback((item?: E) => {
    if (item && itemToFormData) {
      setEditingItem(item);
      setFormData(itemToFormData(item));
    } else {
      setEditingItem(null);
      setFormData(options.defaultValues);
    }
    setError('');
    setIsOpen(true);
  }, [options.defaultValues, itemToFormData]);

  const close = useCallback(() => {
    setIsOpen(false);
    setEditingItem(null);
    setFormData(options.defaultValues);
    setError('');
  }, [options.defaultValues]);

  const updateField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      await options.onSubmit(formData, !!editingItem);
      close();
      options.onSuccess?.();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Ошибка сохранения');
    } finally {
      setIsLoading(false);
    }
  }, [formData, editingItem, options, close]);

  const clearError = useCallback(() => setError(''), []);

  return {
    isOpen,
    isEditing: !!editingItem,
    editingItem,
    formData,
    isLoading,
    error,
    open,
    close,
    setFormData,
    updateField,
    handleSubmit,
    clearError,
  };
}
