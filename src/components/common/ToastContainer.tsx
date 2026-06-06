import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import styles from './ToastContainer.module.css';

const ICON_MAP = {
  success: <CheckCircle2 size={18} />,
  warning: <AlertTriangle size={18} />,
  error: <XCircle size={18} />,
  info: <Info size={18} />,
};

export default function ToastContainer() {
  const { state, dispatch } = useApp();

  const removeToast = (id: string) => {
    dispatch({ type: 'REMOVE_TOAST', payload: id });
  };

  if (state.toasts.length === 0) return null;

  return (
    <div className={styles.toastContainer}>
      {state.toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${styles.toast} ${styles[toast.type]}`}
        >
          <span className={`${styles.iconWrap} ${styles[toast.type]}`}>
            {ICON_MAP[toast.type]}
          </span>
          <span className={styles.message}>{toast.message}</span>
          <button className={styles.closeBtn} onClick={() => removeToast(toast.id)}>
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
