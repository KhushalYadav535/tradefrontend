'use client';

import { createContext, useContext, useState, useCallback } from 'react';

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);

  const add = useCallback((message, type = 'info') => {
    const entry = { id: Date.now() + Math.random(), message, type, time: new Date() };
    setItems((prev) => [entry, ...prev].slice(0, 30));
    setUnread((u) => u + 1);
  }, []);

  const markAllRead = useCallback(() => setUnread(0), []);
  const clear = useCallback(() => { setItems([]); setUnread(0); }, []);

  return (
    <NotificationsContext.Provider value={{ items, unread, add, markAllRead, clear }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationsProvider');
  return ctx;
}
