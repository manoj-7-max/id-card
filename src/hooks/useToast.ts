import { useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import type { ToastType } from '../types';
import { v4 as uuidv4 } from 'uuid';

export function useToast() {
  const { dispatch } = useApp();

  const addToast = useCallback(
    (type: ToastType, message: string, duration = 4000) => {
      const id = uuidv4();
      dispatch({ type: 'ADD_TOAST', payload: { id, type, message, duration } });

      // Auto-remove after duration
      setTimeout(() => {
        dispatch({ type: 'REMOVE_TOAST', payload: id });
      }, duration);
    },
    [dispatch]
  );

  return {
    addToast,
    success: (message: string, duration?: number) => addToast('success', message, duration),
    error: (message: string, duration?: number) => addToast('error', message, duration),
    warning: (message: string, duration?: number) => addToast('warning', message, duration),
    info: (message: string, duration?: number) => addToast('info', message, duration),
  };
}
