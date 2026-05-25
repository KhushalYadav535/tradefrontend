'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationsContext';
import IndexTickers from './IndexTickers';
import ContactUplineModal from './ContactUplineModal';
import NotificationsDropdown from './NotificationsDropdown';
import ThemeToggle from './ThemeToggle';

export default function Header({ onToggleSidebar }) {
  const { user, logout, refreshUser } = useAuth();
  const router = useRouter();
  const { unread, markAllRead } = useNotifications();
  const [profileOpen, setProfileOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [isFs, setIsFs] = useState(false);

  useEffect(() => {
    refreshUser();
    const t = setInterval(refreshUser, 5000);
    return () => clearInterval(t);
  }, [refreshUser]);

  useEffect(() => {
    const handler = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  useEffect(() => {
    const close = (e) => {
      if (!e.target.closest?.('[data-menu]')) {
        setProfileOpen(false);
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const onLogout = () => {
    logout();
    router.replace('/login');
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {}
  };

  const onBellClick = () => {
    setBellOpen((v) => {
      const next = !v;
      if (next) markAllRead();
      return next;
    });
    setProfileOpen(false);
  };

  const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <>
      <header className="h-16 bg-surface border-b border-border flex items-center px-2 md:px-3 gap-2 md:gap-3">
        <div className="flex items-center gap-1.5 md:gap-2 shrink-0 ml-1">
          <div className="w-9 h-9 rounded-md flex items-center justify-center bg-gradient-to-br from-brand to-brand-2 shrink-0">
            <span className="heading font-bold text-white text-lg">A</span>
          </div>
          <div className="heading text-xl md:text-2xl font-bold tracking-tight bg-gradient-to-br from-brand-2 to-brand bg-clip-text text-transparent hidden sm:block">
            AVADH15
          </div>
        </div>

        <button
          onClick={onToggleSidebar}
          className="hidden md:flex w-9 h-9 items-center justify-center rounded hover:bg-surface2 text-muted hover:text-fg"
          aria-label="Toggle sidebar"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <IndexTickers />

        <div className="flex-1" />

        <div className="hidden lg:flex items-center gap-3 text-xs">
          <div className="px-3 py-1.5 rounded bg-surface2 border border-border">
            <span className="text-[10px] uppercase text-muted mr-1">Bal</span>
            <span className="price text-accent">₹{fmt(user?.balance)}</span>
          </div>
          <div className="px-3 py-1.5 rounded bg-surface2 border border-border">
            <span className="text-[10px] uppercase text-muted mr-1">Exp</span>
            <span className="price text-warn">₹{fmt(user?.exposure)}</span>
          </div>
        </div>

        <button
          onClick={() => setContactOpen(true)}
          className="hidden md:flex flex-col items-center justify-center px-4 py-1.5 rounded bg-red text-white text-xs font-bold leading-tight hover:bg-red/90"
        >
          <span>CONTACT</span>
          <span>UPLINE</span>
        </button>

        <div className="flex items-center gap-1 ml-2">
          <ThemeToggle />

          {/* Bell */}
          <div className="relative" data-menu>
            <button
              onClick={onBellClick}
              className="relative w-9 h-9 flex items-center justify-center rounded hover:bg-surface2 text-muted hover:text-fg"
              aria-label="Notifications"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-brand text-white text-[10px] rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center font-bold">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
            {bellOpen && <NotificationsDropdown onClose={() => setBellOpen(false)} />}
          </div>

          {/* Profile */}
          <div className="relative" data-menu>
            <button
              onClick={() => { setProfileOpen((v) => !v); setBellOpen(false); }}
              className="w-9 h-9 flex items-center justify-center rounded hover:bg-surface2 text-muted hover:text-fg"
              aria-label="Profile"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-full mt-1 w-56 card p-2 shadow-glow z-50">
                <div className="px-3 py-2 border-b border-border">
                  <div className="text-sm font-semibold">{user?.full_name || user?.username}</div>
                  <div className="text-[10px] text-muted uppercase">{user?.role}</div>
                </div>
                <div className="px-3 py-2 text-xs flex justify-between">
                  <span className="text-muted">Balance</span>
                  <span className="price text-accent">₹{fmt(user?.balance)}</span>
                </div>
                <div className="px-3 py-2 text-xs flex justify-between">
                  <span className="text-muted">Exposure</span>
                  <span className="price text-warn">₹{fmt(user?.exposure)}</span>
                </div>
                <button onClick={onLogout} className="w-full mt-1 text-left px-3 py-2 text-sm text-red hover:bg-red/10 rounded">
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="w-9 h-9 flex items-center justify-center rounded hover:bg-surface2 text-muted hover:text-fg"
            aria-label={isFs ? 'Exit fullscreen' : 'Enter fullscreen'}
            title={isFs ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFs ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3v3a2 2 0 0 1-2 2H3" /><path d="M21 8h-3a2 2 0 0 1-2-2V3" /><path d="M3 16h3a2 2 0 0 1 2 2v3" /><path d="M16 21v-3a2 2 0 0 1 2-2h3" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {contactOpen && <ContactUplineModal onClose={() => setContactOpen(false)} />}
    </>
  );
}
