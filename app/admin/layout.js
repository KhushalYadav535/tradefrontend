'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import ThemeToggle from '@/components/ThemeToggle';

/* ── Icon helpers ─────────────────────────────── */
const Icon = ({ d, d2, extra = '' }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={extra}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
    {d2 && <path d={d2} />}
  </svg>
);

/* ── Nav structure matching screenshot ────────── */
/* ── Full Admin Nav ─────────────────────────── */
const NAV_SECTIONS = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    href: '/admin',
    exact: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    key: 'trading',
    label: 'Trading',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    children: [
      { href: '/admin/watchlist',    label: 'Watchlist',              icon: '◎' },
      { href: '/admin/trades',       label: 'Trades',                 icon: '◎' },
      { href: '/admin/positions',    label: 'Portfolio/Position',     icon: '◎' },
      { href: '/admin/risk-management', label: 'Banned/Blocked Scripts', icon: '◎' },
      { href: '/admin/lot-master',   label: 'Max Quantity Details',   icon: '◎' },
      { href: '/admin/ledgers',      label: 'Margin Management',      icon: '◎' },
      { href: '/admin/reports',      label: 'Summary Report',         icon: '◎' },
      { href: '/admin/rejections',   label: 'Summary Report V2',      icon: '◎' },
    ],
  },
  {
    key: 'users',
    label: 'Users',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    children: [
      { href: '/admin/users',       label: 'User Listing',   icon: '◎' },
      { href: '/admin/masters',     label: 'Master Listing', icon: '◎' },
      { href: '/admin/brokers',     label: 'Broker Listing', icon: '◎' },
      { href: '/admin/add-account', label: 'Add Account',    icon: '◎' },
    ],
  },
  {
    key: 'utilities',
    label: 'Utilities',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
    children: [
      { href: '/admin/bulk-trading',     label: 'Bulk Trading',       icon: '◎' },
      { href: '/admin/bill-filter',      label: 'Bill Filter',        icon: '◎' },
      { href: '/admin/trade-edit-log',   label: 'Trade Edit/Del Log', icon: '◎' },
      { href: '/admin/user-edit-log',    label: 'User Edit Log',      icon: '◎' },
      { href: '/admin/ip-log',           label: 'IP Address Log',     icon: '◎' },
      { href: '/admin/cash-edit-log',    label: 'Cash Edit/Del Log',  icon: '◎' },
      { href: '/admin/auto-squareup-log',label: 'Auto SquareUp Log',  icon: '◎' },
      { href: '/admin/cross-trade-log',  label: 'Cross Trade(s) Log', icon: '◎' },
      { href: '/admin/rejection-log',    label: 'Rejection Log',      icon: '◎' },
      { href: '/admin/script-master',    label: 'Script Master',      icon: '◎' },
      { href: '/admin/indices-master',   label: 'Indices Master',     icon: '◎' },
      { href: '/admin/market-data',      label: 'Market Data',        icon: '◎' },
    ],
  },
  {
    key: 'accounts',
    label: 'Accounts',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    ),
    children: [
      { href: '/admin/ledger',        label: 'Ledger',         icon: '◎' },
      { href: '/admin/cash-ledger',   label: 'Cash Ledger',    icon: '◎' },
      { href: '/admin/cash-entry',    label: 'Cash Entry',     icon: '◎' },
      { href: '/admin/jv',            label: 'JV',             icon: '◎' },
      { href: '/admin/trial-balance', label: 'Trial Balance',  icon: '◎' },
      { href: '/admin/ops',           label: 'Ops & Revenue',  icon: '◎' },
    ],

  },
  {
    key: 'settings',
    label: 'Settings',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
    children: [
      { href: '/admin/settings/quantity',      label: 'Quantity Settings',   icon: '◎' },
      { href: '/admin/settings/order-limit',   label: 'Order Limit',         icon: '◎' },
      { href: '/admin/settings/block-scripts', label: 'Block/Allow Scripts', icon: '◎' },
      { href: '/admin/settings/master-qty',    label: 'Master Qty Settings', icon: '◎' },
      { href: '/admin/settings',               label: 'Feature Flags',       icon: '◎' },
    ],

  },
];

/* ── Non-Admin Nav (master / broker) ─────────── */
const NAV_SECTIONS_NON_ADMIN = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    href: '/admin',
    exact: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    key: 'trading',
    label: 'Trading',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    children: [
      { href: '/admin/watchlist',       label: 'Watchlist',              icon: '◎' },
      { href: '/admin/trades',          label: 'Trades',                 icon: '◎' },
      { href: '/admin/positions',       label: 'Portfolio/Position',     icon: '◎' },
      { href: '/admin/risk-management', label: 'Banned/Blocked Scripts', icon: '◎' },
      { href: '/admin/lot-master',      label: 'Max Quantity Details',   icon: '◎' },
    ],
  },
];

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, user, loading, logout } = useAuth();

  /* Mobile sidebar state */
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  /* which group is open */
  const getInitialOpen = () => {
    for (const s of NAV_SECTIONS) {
      if (s.children?.some((c) => pathname.startsWith(c.href))) return s.key;
    }
    return 'trading';
  };
  const [open, setOpen] = useState(getInitialOpen);

  const isAdmin   = user?.role === 'admin';
  const isMaster  = user?.role === 'master';
  const isBroker  = user?.role === 'broker';
  const hasAccess = isAdmin || isMaster || isBroker;

  /* Close sidebar when route changes */
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  /* Redirect: unauthenticated → login, regular user → trading view */
  useEffect(() => {
    if (loading) return;
    if (!token) router.replace('/login');
    else if (user && !hasAccess) router.replace('/watchlist'); // normal user
  }, [token, user, loading, router, hasAccess]);

  if (loading || !token || !hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'rgb(var(--bg))' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: 'linear-gradient(135deg, rgb(var(--brand)), rgb(var(--brand-2)))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'pulse 1.5s ease-in-out infinite'
          }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 22, fontFamily: 'var(--font-heading)' }}>A</span>
          </div>
          <span style={{ color: 'rgb(var(--muted))', fontSize: 13 }}>Loading…</span>
        </div>
      </div>
    );
  }

  /* Choose nav based on role */
  const activeNav = isAdmin ? NAV_SECTIONS : NAV_SECTIONS_NON_ADMIN;

  const onLogout = () => { logout(); router.replace('/login'); };
  const toggle = (key) => setOpen((prev) => (prev === key ? null : key));

  const isActive = (href, exact) =>
    exact ? pathname === href : pathname.startsWith(href);

  /* ── Sidebar content (shared between desktop and mobile drawer) ── */
  const SidebarContent = () => (
    <>
      {/* Navigation label */}
      <div style={{ padding: '12px 12px 8px' }}>
        <div style={{
          fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em',
          color: 'rgb(var(--muted))', fontWeight: 600, paddingLeft: 4,
        }}>Navigation</div>
      </div>

      <nav style={{ flex: 1, padding: '0 8px 8px', overflowY: 'auto' }}>
        {activeNav.map((section) => {
          if (!section.children) {
            /* Single link (Dashboard) */
            const active = isActive(section.href, section.exact);
            return (
              <Link key={section.key} href={section.href} style={{ textDecoration: 'none' }}
                onClick={() => setSidebarOpen(false)}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px', borderRadius: 7, marginBottom: 2,
                  background: active ? 'rgba(var(--brand), 0.12)' : 'transparent',
                  borderLeft: active ? '2px solid rgb(var(--brand))' : '2px solid transparent',
                  cursor: 'pointer', transition: 'all 150ms',
                }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgb(var(--surface2))'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ color: active ? 'rgb(var(--brand-2))' : 'rgb(var(--muted))' }}>{section.icon}</span>
                  <span style={{
                    fontSize: 13, fontWeight: active ? 600 : 500,
                    color: active ? 'rgb(var(--brand-2))' : 'rgb(var(--fg))',
                  }}>{section.label}</span>
                </div>
              </Link>
            );
          }

          /* Collapsible group */
          const isGroupActive = section.children.some((c) => pathname.startsWith(c.href));
          const isOpen = open === section.key;

          return (
            <div key={section.key} style={{ marginBottom: 2 }}>
              <button
                onClick={() => toggle(section.key)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px', borderRadius: 7,
                  background: isGroupActive ? 'rgb(var(--surface2))' : 'transparent',
                  border: 'none', cursor: 'pointer', transition: 'background 150ms',
                }}
                onMouseEnter={e => { if (!isGroupActive) e.currentTarget.style.background = 'rgb(var(--surface2))'; }}
                onMouseLeave={e => { if (!isGroupActive) e.currentTarget.style.background = isGroupActive ? 'rgb(var(--surface2))' : 'transparent'; }}
              >
                <span style={{ color: isGroupActive ? 'rgb(var(--warn))' : 'rgb(var(--muted))' }}>{section.icon}</span>
                <span style={{
                  flex: 1, textAlign: 'left', fontSize: 13, fontWeight: 600,
                  color: 'rgb(var(--fg))',
                }}>{section.label}</span>
                <svg
                  width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5"
                  style={{ color: 'rgb(var(--muted))', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 200ms' }}
                >
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>

              {isOpen && (
                <ul style={{ listStyle: 'none', padding: '2px 0 4px 14px', margin: 0, borderLeft: '1px solid rgb(var(--border))', marginLeft: 18 }}>
                  {section.children.map((child) => {
                    const childActive = pathname === child.href || pathname.startsWith(child.href + '/');
                    return (
                      <li key={child.href}>
                        <Link href={child.href} style={{ textDecoration: 'none' }}
                          onClick={() => setSidebarOpen(false)}>
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '6px 8px', borderRadius: 6, margin: '1px 0',
                            background: childActive ? 'rgba(var(--brand), 0.1)' : 'transparent',
                            cursor: 'pointer', transition: 'all 150ms',
                          }}
                            onMouseEnter={e => { if (!childActive) e.currentTarget.style.background = 'rgb(var(--surface2))'; }}
                            onMouseLeave={e => { if (!childActive) e.currentTarget.style.background = childActive ? 'rgba(var(--brand), 0.1)' : 'transparent'; }}
                          >
                            <span style={{
                              fontSize: 7, color: childActive ? 'rgb(var(--warn))' : 'rgb(var(--muted))',
                            }}>◉</span>
                            <span style={{
                              fontSize: 12, color: childActive ? 'rgb(var(--warn))' : 'rgb(var(--fg) / 0.75)',
                              fontWeight: childActive ? 600 : 400,
                            }}>{child.label}</span>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: '8px', borderTop: '1px solid rgb(var(--border))' }}>
        <button onClick={onLogout} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 10px', borderRadius: 7, border: 'none', cursor: 'pointer',
          background: 'transparent', color: 'rgb(var(--red))',
          fontSize: 13, fontWeight: 600, transition: 'background 150ms',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'rgb(var(--bg))' }}>
      {/* ── TOP HEADER ── */}
      <header style={{
        height: 56,
        background: 'rgb(var(--surface))',
        borderBottom: '1px solid rgb(var(--border))',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: 10,
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        {/* Hamburger button — visible only on mobile */}
        {isMobile && (
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle menu"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 8,
              border: 'none',
              background: 'transparent',
              color: 'rgb(var(--muted))',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'background 150ms, color 150ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgb(var(--surface2))'; e.currentTarget.style.color = 'rgb(var(--fg))'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgb(var(--muted))'; }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: 'linear-gradient(135deg, rgb(var(--brand)), rgb(var(--brand-2)))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 18, fontFamily: 'var(--font-heading)' }}>A</span>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 16,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              background: 'linear-gradient(135deg, rgb(var(--brand-2)), rgb(var(--brand)))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              whiteSpace: 'nowrap',
            }}>AVADH11</div>
            <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgb(var(--muted))', marginTop: -2, whiteSpace: 'nowrap' }}>
              {isAdmin ? 'Admin Panel' : isMaster ? 'Master Panel' : 'Broker Panel'}
            </div>
          </div>
        </div>

        <ThemeToggle />

        <Link href="/watchlist" style={{
          padding: '5px 10px', borderRadius: 6, border: '1px solid rgb(var(--border))',
          fontSize: 11, color: 'rgb(var(--fg))', textDecoration: 'none',
          transition: 'background 150ms', whiteSpace: 'nowrap', flexShrink: 0,
          display: isMobile ? 'none' : 'inline-flex', alignItems: 'center',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgb(var(--surface2))'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          Trading →
        </Link>

        {/* User chip */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          paddingLeft: 10, borderLeft: '1px solid rgb(var(--border))',
          flexShrink: 0,
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'linear-gradient(135deg, rgb(var(--brand)), rgb(var(--brand-2)))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>
            {(user.full_name || user.username).charAt(0).toUpperCase()}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, ...(isMobile ? { display: 'none' } : {}) }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'rgb(var(--fg))', lineHeight: 1 }}>{user.full_name || user.username}</div>
            <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgb(var(--muted))', lineHeight: 1 }}>{user.role}</div>
          </div>
          <button onClick={onLogout} style={{
            padding: '4px 8px', borderRadius: 6,
            border: '1px solid rgba(239,68,68,0.3)',
            fontSize: 11, fontWeight: 600, color: 'rgb(var(--red))',
            background: 'transparent', cursor: 'pointer',
            transition: 'background 150ms', whiteSpace: 'nowrap',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >Logout</button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, minHeight: 0, position: 'relative' }}>
        {/* ── MOBILE OVERLAY ── */}
        {isMobile && sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(3px)',
              WebkitBackdropFilter: 'blur(3px)',
              zIndex: 44,
            }}
          />
        )}

        {/* ── SIDEBAR ── */}
        {/* Desktop: always-visible sidebar */}
        {!isMobile && (
          <aside style={{
            width: 200,
            flexShrink: 0,
            background: 'rgb(var(--surface))',
            borderRight: '1px solid rgb(var(--border))',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
          }}>
            <SidebarContent />
          </aside>
        )}

        {/* Mobile sidebar drawer */}
        {isMobile && (
          <aside
            style={{
              width: 260,
              background: 'rgb(var(--surface))',
              borderRight: '1px solid rgb(var(--border))',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              zIndex: 45,
              transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
              transition: 'transform 280ms cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: sidebarOpen ? '6px 0 32px rgba(0,0,0,0.4)' : 'none',
            }}
          >
            {/* Mobile drawer header */}
            <div style={{
              height: 56,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 12px',
              borderBottom: '1px solid rgb(var(--border))',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 7,
                  background: 'linear-gradient(135deg, rgb(var(--brand)), rgb(var(--brand-2)))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ color: '#fff', fontWeight: 800, fontSize: 15, fontFamily: 'var(--font-heading)' }}>A</span>
                </div>
                <div>
                  <div style={{
                    fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 800,
                    background: 'linear-gradient(135deg, rgb(var(--brand-2)), rgb(var(--brand)))',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  }}>AVADH11</div>
                  <div style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgb(var(--muted))' }}>
                    {isAdmin ? 'Admin Panel' : isMaster ? 'Master Panel' : 'Broker Panel'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                style={{
                  width: 32, height: 32, borderRadius: 7, border: 'none',
                  background: 'rgb(var(--surface2))', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'rgb(var(--muted))',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <SidebarContent />
          </aside>
        )}

        {/* ── MAIN CONTENT ── */}
        <main style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
