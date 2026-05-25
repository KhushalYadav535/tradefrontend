'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { useNotifications } from '@/context/NotificationsContext';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const { add: addNotification } = useNotifications();

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    addNotification(message, type);
    setTimeout(() => remove(id), 3500);
  }, [remove, addNotification]);

  const api = {
    success: (m) => push(m, 'success'),
    error: (m) => push(m, 'error'),
    info: (m) => push(m, 'info'),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[320px]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`card px-4 py-3 text-sm shadow-glow border-l-4 ${
              t.type === 'success' ? 'border-l-accent' :
              t.type === 'error' ? 'border-l-red' : 'border-l-brand'
            }`}
          >
            <div className={`font-semibold mb-0.5 ${
              t.type === 'success' ? 'text-accent' :
              t.type === 'error' ? 'text-red' : 'text-brand-2'
            }`}>
              {t.type === 'success' ? 'Success' : t.type === 'error' ? 'Error' : 'Info'}
            </div>
            <div className="text-fg/90">{t.message}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
