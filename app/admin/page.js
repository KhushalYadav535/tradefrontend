'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/axios';
import Link from 'next/link';

/* ─── Tiny helpers ─────────────────────────────────────────────── */
const fmt = (n) =>
  Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtInt = (n) => Number(n || 0).toLocaleString('en-IN');

function StatCard({ label, value, sub, color = 'brand', icon }) {
  const colorMap = {
    brand:  { bg: 'rgba(99,102,241,0.12)',  border: 'rgba(99,102,241,0.25)',  text: 'rgb(var(--brand-2))' },
    green:  { bg: 'rgba(34,197,94,0.10)',   border: 'rgba(34,197,94,0.25)',   text: 'rgb(var(--accent))' },
    red:    { bg: 'rgba(239,68,68,0.10)',   border: 'rgba(239,68,68,0.25)',   text: 'rgb(var(--red))' },
    yellow: { bg: 'rgba(234,179,8,0.10)',   border: 'rgba(234,179,8,0.25)',   text: 'rgb(var(--warn))' },
    purple: { bg: 'rgba(139,92,246,0.10)',  border: 'rgba(139,92,246,0.25)',  text: '#a78bfa' },
  };
  const c = colorMap[color] || colorMap.brand;
  return (
    <div style={{
      background: 'rgb(var(--surface))',
      border: `1px solid ${c.border}`,
      borderRadius: 10,
      padding: '16px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${c.text}, transparent)`,
      }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgb(var(--muted))', fontWeight: 600 }}>{label}</span>
        {icon && (
          <div style={{ width: 28, height: 28, borderRadius: 7, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.text }}>
            {icon}
          </div>
        )}
      </div>
      <div style={{ fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 800, color: c.text, letterSpacing: '-0.02em', lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: 'rgb(var(--muted))' }}>{sub}</div>}
    </div>
  );
}

function SectionTable({ title, viewHref, columns, rows, emptyMsg = 'No data available in table' }) {
  return (
    <div style={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderBottom: '1px solid rgb(var(--border))',
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'rgb(var(--fg))', fontFamily: 'var(--font-heading)' }}>{title}</span>
        {viewHref && (
          <Link href={viewHref} style={{
            fontSize: 11, color: 'rgb(var(--brand-2))', textDecoration: 'none', fontWeight: 600,
            padding: '3px 8px', borderRadius: 5, border: '1px solid rgba(139,92,246,0.3)',
          }}>View More</Link>
        )}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: 'rgb(var(--surface2))' }}>
              {columns.map((col) => (
                <th key={col} style={{
                  padding: '7px 10px', textAlign: 'left', fontSize: 10,
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  color: 'rgb(var(--muted))', fontWeight: 600,
                  borderBottom: '1px solid rgb(var(--border))',
                  whiteSpace: 'nowrap',
                }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{
                  padding: '24px', textAlign: 'center', color: 'rgb(var(--muted))', fontSize: 12,
                }}>{emptyMsg}</td>
              </tr>
            ) : rows.map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(var(--border), 0.5)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgb(var(--surface2))'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {row.map((cell, j) => (
                  <td key={j} style={{ padding: '7px 10px', color: 'rgb(var(--fg))' }}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Quick Action Card ───────────────────────── */
function QuickAction({ href, icon, label, desc, color = 'brand' }) {
  const [hov, setHov] = useState(false);
  const colorMap = {
    brand:  'rgba(99,102,241,0.12)',
    green:  'rgba(34,197,94,0.10)',
    yellow: 'rgba(234,179,8,0.10)',
    red:    'rgba(239,68,68,0.10)',
  };
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 14px', borderRadius: 8,
          border: '1px solid rgb(var(--border))',
          background: hov ? colorMap[color] : 'rgb(var(--surface2))',
          cursor: 'pointer', transition: 'all 150ms',
        }}
      >
        <div style={{
          width: 32, height: 32, borderRadius: 8, background: colorMap[color],
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>{icon}</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'rgb(var(--fg))', lineHeight: 1.2 }}>{label}</div>
          <div style={{ fontSize: 11, color: 'rgb(var(--muted))', marginTop: 2 }}>{desc}</div>
        </div>
        <svg style={{ marginLeft: 'auto', color: 'rgb(var(--muted))' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>
    </Link>
  );
}

/* ─── Main Dashboard ──────────────────────────── */
export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState({ executed: [], pending: [] });
  const [rejections, setRejections] = useState([]);
  const [mtmAlerts, setMtmAlerts] = useState([]);
  const [now, setNow] = useState(new Date());

  /* Live clock */
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const load = useCallback(async () => {
    try {
      const r = await api.get('/admin/stats');
      setStats(r.data);
    } catch {}
    /* Try to pull recent orders / rejections — graceful fallback */
    try {
      const ro = await api.get('/admin/orders?limit=5');
      const all = ro.data.orders || ro.data || [];
      setOrders({
        executed: all.filter((o) => o.status === 'executed' || o.status === 'filled').slice(0, 5),
        pending:  all.filter((o) => o.status === 'pending').slice(0, 5),
      });
    } catch {}
    try {
      const rr = await api.get('/admin/rejections?limit=5');
      setRejections((rr.data.rejections || rr.data || []).slice(0, 5));
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const timeStr = now.toLocaleTimeString('en-IN', { hour12: false });
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

  /* ─── Order row formatter ─ */
  const orderCols = ['D', 'Time', 'Client', 'Script', 'Type', 'Lot', 'Qty'];
  const formatOrderRow = (o) => [
    <span style={{ fontSize: 10, fontWeight: 700, color: o.side === 'BUY' ? 'rgb(var(--accent))' : 'rgb(var(--red))' }}>{o.side === 'BUY' ? 'B' : 'S'}</span>,
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{o.created_at ? new Date(o.created_at).toLocaleTimeString('en-IN', { hour12: false }) : '—'}</span>,
    <span style={{ fontWeight: 600 }}>{o.client || o.username || '—'}</span>,
    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{o.script || o.symbol || '—'}</span>,
    o.order_type || o.type || '—',
    o.lot || '—',
    o.qty || o.quantity || '—',
  ];

  const rejCols = ['D', 'A', 'Date', 'Client', 'Script', 'Type', 'Lot', 'Qty', 'Rate', 'Reason'];
  const formatRejRow = (r) => [
    <span style={{ fontSize: 10, fontWeight: 700, color: 'rgb(var(--red))' }}>S</span>,
    '—',
    <span style={{ fontSize: 11 }}>{r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN') : '—'}</span>,
    r.client || r.username || '—',
    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{r.script || r.symbol || '—'}</span>,
    r.order_type || '—',
    r.lot || '—',
    r.qty || '—',
    <span style={{ fontFamily: 'var(--font-mono)' }}>{r.rate || r.price ? fmt(r.rate || r.price) : '—'}</span>,
    <span style={{ color: 'rgb(var(--red))', fontSize: 11 }}>{r.reason || '—'}</span>,
  ];

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          border: '3px solid rgb(var(--border))',
          borderTopColor: 'rgb(var(--brand))',
          animation: 'spin 0.8s linear infinite',
        }} />
        <span style={{ fontSize: 13, color: 'rgb(var(--muted))' }}>Loading dashboard…</span>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 800, color: 'rgb(var(--fg))', margin: 0, letterSpacing: '-0.02em' }}>
            Dashboard
          </h1>
          <p style={{ fontSize: 12, color: 'rgb(var(--muted))', margin: '4px 0 0' }}>Platform overview at a glance</p>
        </div>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1,
          padding: '8px 14px', borderRadius: 8,
          background: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))',
        }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: 'rgb(var(--fg))', letterSpacing: '0.05em' }}>{timeStr}</span>
          <span style={{ fontSize: 10, color: 'rgb(var(--muted))', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{dateStr}</span>
        </div>
      </div>

      {/* ── Stat cards ── */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
          <StatCard
            label="Total Students" value={fmtInt(stats.students?.total)}
            color="brand"
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
          />
          <StatCard
            label="Active Students" value={fmtInt(stats.students?.active)}
            color="green"
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
          />
          <StatCard
            label="Trades Today" value={fmtInt(stats.trades_today)}
            color="yellow"
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
          />
          <StatCard
            label="Total Capital" value={`₹${fmt(stats.students?.total_balance)}`}
            color="purple"
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
          />
          <StatCard
            label="Total Scripts" value={fmtInt(stats.scripts?.total_scripts)}
            color="brand"
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
          />
          <StatCard
            label="Banned Scripts" value={fmtInt(stats.scripts?.banned)}
            color="red"
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>}
          />
          <StatCard
            label="Net P&L"
            value={`${stats.net_pnl >= 0 ? '+' : ''}₹${fmt(stats.net_pnl)}`}
            color={stats.net_pnl >= 0 ? 'green' : 'red'}
            sub="All ledgers combined"
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>}
          />
        </div>
      )}

      {/* ── Two-column: Executed + Pending Orders ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <SectionTable
          title="Executed Order"
          viewHref="/admin/orders"
          columns={orderCols}
          rows={orders.executed.map(formatOrderRow)}
        />
        <SectionTable
          title="Pending Order"
          viewHref="/admin/orders"
          columns={orderCols}
          rows={orders.pending.map(formatOrderRow)}
        />
      </div>

      {/* ── Rejection Log (full width) ── */}
      <div style={{ marginBottom: 14 }}>
        <SectionTable
          title="Rejection Log"
          viewHref="/admin/rejections"
          columns={rejCols}
          rows={rejections.map(formatRejRow)}
        />
      </div>

      {/* ── Auto SquareUp Log + MTM Alert ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        <SectionTable
          title="Auto SquareUp Log"
          viewHref="/admin/trades"
          columns={['Client', 'Limit', 'Time']}
          rows={[]}
        />
        <SectionTable
          title="MTM Alert"
          viewHref="/admin/risk-management"
          columns={['User', 'Master', 'Alert(%)', 'Amount', 'Time']}
          rows={mtmAlerts.map((m) => [
            m.user, m.master,
            <span style={{ color: 'rgb(var(--warn))' }}>{m.alert_pct}%</span>,
            <span style={{ fontFamily: 'var(--font-mono)' }}>₹{fmt(m.amount)}</span>,
            m.time,
          ])}
        />
      </div>

      {/* ── Quick Actions + Platform Info ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <div style={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))', borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgb(var(--muted))', fontWeight: 600, marginBottom: 12 }}>Quick Actions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <QuickAction href="/admin/students" color="brand"
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--brand-2))" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>}
              label="Manage Students"
              desc="Create logins, reset passwords, adjust balances"
            />
            <QuickAction href="/admin/trades" color="green"
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--accent))" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
              label="View All Trades"
              desc="Activity across every student account"
            />
            <QuickAction href="/admin/risk-management" color="red"
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--red))" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
              label="Risk Management"
              desc="Control script bans and trading halts"
            />
            <QuickAction href="/watchlist" color="yellow"
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--warn))" strokeWidth="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>}
              label="Open Trading View"
              desc="See the platform as students see it"
            />
          </div>
        </div>

        {/* Platform health */}
        <div style={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))', borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgb(var(--muted))', fontWeight: 600, marginBottom: 12 }}>Platform Health</div>

          {stats && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Student Activation Rate', val: stats.students?.total ? Math.round((stats.students.active / stats.students.total) * 100) : 0, color: 'rgb(var(--accent))' },
                { label: 'Script Ban Rate', val: stats.scripts?.total_scripts ? Math.round((stats.scripts.banned / stats.scripts.total_scripts) * 100) : 0, color: 'rgb(var(--red))' },
              ].map(({ label, val, color }) => (
                <div key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: 'rgb(var(--fg))' }}>{label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color, fontFamily: 'var(--font-mono)' }}>{val}%</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 99, background: 'rgb(var(--surface2))' }}>
                    <div style={{ height: '100%', borderRadius: 99, background: color, width: `${Math.min(val, 100)}%`, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              ))}

              <div style={{ marginTop: 8, padding: '10px 12px', borderRadius: 8, background: 'rgb(var(--surface2))', border: '1px solid rgb(var(--border))' }}>
                <div style={{ fontSize: 10, color: 'rgb(var(--muted))', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, fontWeight: 600 }}>Net Cash Flow</div>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 800,
                  color: stats.net_pnl >= 0 ? 'rgb(var(--accent))' : 'rgb(var(--red))',
                  letterSpacing: '-0.02em',
                }}>
                  {stats.net_pnl >= 0 ? '+' : ''}₹{fmt(stats.net_pnl)}
                </div>
                <div style={{ fontSize: 10, color: 'rgb(var(--muted))', marginTop: 2 }}>Across all student ledgers</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
                {[
                  { label: 'Total Scripts', val: fmtInt(stats.scripts?.total_scripts), color: 'rgb(var(--brand-2))' },
                  { label: 'Banned Scripts', val: fmtInt(stats.scripts?.banned), color: 'rgb(var(--red))' },
                ].map(({ label, val, color }) => (
                  <div key={label} style={{ padding: '10px 12px', borderRadius: 8, background: 'rgb(var(--surface2))' }}>
                    <div style={{ fontSize: 10, color: 'rgb(var(--muted))', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 800, color, marginTop: 2 }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
