import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext({
  showToast: () => {},
});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 4200, title) => {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
    const toast = { id, title, message, type, duration };
    setToasts((prevToasts) => [...prevToasts, toast]);
    window.setTimeout(() => removeToast(id), duration);
  }, [removeToast]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="toast-root">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-card toast-${toast.type}`} role="status">
            <div className="flex flex-col gap-1">
              {toast.title && <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{toast.title}</p>}
              <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">{toast.message}</p>
            </div>
            <button type="button" className="toast-close" onClick={() => removeToast(toast.id)}>
              Dismiss
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
