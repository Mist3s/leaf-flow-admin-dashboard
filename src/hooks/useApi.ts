import { useState, useCallback } from 'react';
import { extractErrorMessage } from 'src/utils';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiReturn<T, P extends any[]> extends UseApiState<T> {
  execute: (...params: P) => Promise<T | null>;
  reset: () => void;
  setData: (data: T | null) => void;
}

export function useApi<T, P extends any[] = []>(
  apiFunction: (...params: P) => Promise<T>
): UseApiReturn<T, P> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...params: P): Promise<T | null> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const result = await apiFunction(...params);
        setState({ data: result, loading: false, error: null });
        return result;
      } catch (err) {
        const errorMessage = extractErrorMessage(err);
        setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
        return null;
      }
    },
    [apiFunction]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  const setData = useCallback((data: T | null) => {
    setState((prev) => ({ ...prev, data }));
  }, []);

  return { ...state, execute, reset, setData };
}

// Hook for mutations (create, update, delete)
interface UseMutationReturn<T, P extends any[]> {
  mutate: (...params: P) => Promise<T | null>;
  loading: boolean;
  error: string | null;
  reset: () => void;
}

export function useMutation<T, P extends any[] = []>(
  mutationFn: (...params: P) => Promise<T>
): UseMutationReturn<T, P> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (...params: P): Promise<T | null> => {
      setLoading(true);
      setError(null);
      try {
        const result = await mutationFn(...params);
        setLoading(false);
        return result;
      } catch (err) {
        const errorMessage = extractErrorMessage(err);
        setError(errorMessage);
        setLoading(false);
        return null;
      }
    },
    [mutationFn]
  );

  const reset = useCallback(() => {
    setError(null);
    setLoading(false);
  }, []);

  return { mutate, loading, error, reset };
}
