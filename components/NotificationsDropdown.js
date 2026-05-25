'use client';

import { useNotifications } from '@/context/NotificationsContext';

function formatTime(d) {
  return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function NotificationsDropdown({ onClose }) {
  const { items, clear } = useNotifications();

  return (
    <div className="absolute right-0 top-full mt-1 w-80 card p-0 shadow-glow z-50 max-h-[420px] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider">Notifications</span>
        <div className="flex items-center gap-3">
          <button onClick={clear} className="text-[11px] text-muted hover:text-fg" disabled={items.length === 0}>Clear</button>
          <button onClick={onClose} className="text-muted hover:text-fg text-lg leading-none">×</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted">No notifications yet</div>
        ) : items.map((n) => (
          <div key={n.id} className="px-3 py-2 border-b border-border/40 hover:bg-surface2/40">
            <div className="flex items-start gap-2">
              <span className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                n.type === 'success' ? 'bg-accent' :
                n.type === 'error' ? 'bg-red' : 'bg-brand-2'
              }`} />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-fg/90 break-words">{n.message}</div>
                <div className="text-[10px] text-muted mt-0.5">{formatTime(n.time)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
