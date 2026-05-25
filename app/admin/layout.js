'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import ThemeToggle from '@/components/ThemeToggle';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
  )},
  { href: '/admin/students', label: 'Students', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  )},
  { href: '/admin/trades', label: 'All Trades', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h18v18H3z"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
  )},
];

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, user, loading, logout } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!token) router.replace('/login');
    else if (user && user.role !== 'admin') router.replace('/watchlist');
  }, [token, user, loading, router]);

  if (loading || !token || user?.role !== 'admin') {
    return <div className="min-h-screen flex items-center justify-center text-muted">Loading…</div>;
  }

  const onLogout = () => { logout(); router.replace('/login'); };

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <header className="h-16 bg-surface border-b border-border flex items-center px-4 gap-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-md flex items-center justify-center bg-gradient-to-br from-brand to-brand-2">
            <span className="heading font-bold text-white text-lg">A</span>
          </div>
          <div>
            <div className="heading text-xl font-bold tracking-tight bg-gradient-to-br from-brand-2 to-brand bg-clip-text text-transparent">
              AVADH15
            </div>
            <div className="text-[10px] uppercase tracking-widest text-muted -mt-1">Admin Panel</div>
          </div>
        </div>

        <div className="flex-1" />

        <ThemeToggle />

        <Link href="/watchlist" className="btn-ghost text-xs py-1.5 px-3" title="Open trading view">
          Trading View →
        </Link>

        <div className="flex items-center gap-2 pl-3 border-l border-border">
          <div className="w-8 h-8 rounded-full bg-surface2 border border-border flex items-center justify-center text-sm font-semibold">
            {(user.full_name || user.username).charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-semibold leading-tight">{user.full_name || user.username}</div>
            <div className="text-[10px] text-muted uppercase">{user.role}</div>
          </div>
          <button onClick={onLogout} className="btn-ghost py-1.5 px-3 text-xs ml-2 text-red border-red/30 hover:bg-red/10">Logout</button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <aside className="w-56 shrink-0 bg-surface border-r border-border p-3">
          <div className="text-[10px] uppercase tracking-widest text-muted px-2 mb-2 font-semibold">Manage</div>
          <ul className="space-y-1">
            {NAV.map((n) => {
              const active = pathname === n.href;
              return (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors ${
                      active ? 'bg-brand/15 text-brand-2 border-l-2 border-brand pl-2' : 'text-fg/80 hover:bg-surface2'
                    }`}
                  >
                    <span className={active ? 'text-brand-2' : 'text-muted'}>{n.icon}</span>
                    {n.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </aside>

        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
