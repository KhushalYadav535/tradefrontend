'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/axios';
import AdminTable from '@/components/AdminTable';

const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const COLS = [
  { key: 'side',    label: 'B/S',    width: 40 },
  { key: 'time',    label: 'Time',   width: 80 },
  { key: 'user',    label: 'Client', width: 120 },
  { key: 'script',  label: 'Script' },
  { key: 'type',    label: 'Type',   width: 80 },
  { key: 'qty',     label: 'Qty',    align: 'right', width: 60 },
  { key: 'price',   label: 'Price',  align: 'right', width: 90 },
  { key: 'status',  label: 'Status', align: 'center', width: 100 },
];

function StatusBadge({ status }) {
  const map = {
    EXECUTED: { bg: 'rgba(34,197,94,0.12)', color: 'rgb(var(--accent))', border: 'rgba(34,197,94,0.3)' },
    PENDING:  { bg: 'rgba(234,179,8,0.12)', color: 'rgb(var(--warn))',   border: 'rgba(234,179,8,0.3)' },
    REJECTED: { bg: 'rgba(239,68,68,0.12)', color: 'rgb(var(--red))',    border: 'rgba(239,68,68,0.3)' },
  };
  const s = map[status] || { bg: 'rgba(125,133,144,0.12)', color: 'rgb(var(--muted))', border: 'rgba(125,133,144,0.3)' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 99,
      fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>
      {status === 'EXECUTED' && <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />}
      {status}
    </span>
  );
}

export default function WatchlistPage() {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [lastRefresh, setLastRefresh] = useState(null);
  const [live, setLive] = useState(true);

  const fetch = useCallback(() => {
    api.get('/admin/all-trades')
      .then(r => { setTrades(r.data.trades || []); setLastRefresh(new Date()); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch();
    if (!live) return;
    const t = setInterval(fetch, 5000);
    return () => clearInterval(t);
  }, [fetch, live]);

  const filtered = trades.filter(t => {
    if (filter !== 'ALL' && t.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (t.username || '').toLowerCase().includes(q) || (t.script || '').toLowerCase().includes(q);
    }
    return true;
  });

  const counts = {
    ALL: trades.length,
    EXECUTED: trades.filter(t => t.status === 'EXECUTED').length,
    PENDING:  trades.filter(t => t.status === 'PENDING').length,
    REJECTED: trades.filter(t => t.status === 'REJECTED').length,
  };

  function renderCell(row, key) {
    switch (key) {
      case 'side': return (
        <span style={{
          display: 'inline-block', width: 22, height: 22, borderRadius: 4,
          fontSize: 10, fontWeight: 800, textAlign: 'center', lineHeight: '22px',
          background: row.trade_type === 'BUY' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
          color: row.trade_type === 'BUY' ? 'rgb(var(--accent))' : 'rgb(var(--red))',
        }}>{row.trade_type === 'BUY' ? 'B' : 'S'}</span>
      );
      case 'time': return <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgb(var(--muted))' }}>{new Date(row.created_at).toLocaleTimeString('en-IN', { hour12: false })}</span>;
      case 'user': return <span style={{ fontWeight: 600 }}>{row.username}</span>;
      case 'script': return (
        <div>
          <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: 12 }}>{row.script}</div>
          <div style={{ fontSize: 10, color: 'rgb(var(--muted))', textTransform: 'uppercase' }}>{row.exchange}</div>
        </div>
      );
      case 'type': return <span style={{ fontSize: 11, color: 'rgb(var(--muted))' }}>{row.order_type || row.type || 'MARKET'}</span>;
      case 'qty': return <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{row.quantity}</span>;
      case 'price': return <span style={{ fontFamily: 'var(--font-mono)' }}>₹{fmt(row.price)}</span>;
      case 'status': return <StatusBadge status={row.status} />;
      default: return row[key] ?? '—';
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: 'rgb(var(--fg))' }}>
            Watchlist
          </h1>
          <p style={{ fontSize: 12, color: 'rgb(var(--muted))', margin: '3px 0 0' }}>Live order monitoring across all users</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Live indicator */}
          <button onClick={() => setLive(v => !v)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 12px', borderRadius: 99, border: '1px solid',
            borderColor: live ? 'rgba(34,197,94,0.4)' : 'rgb(var(--border))',
            background: live ? 'rgba(34,197,94,0.08)' : 'transparent',
            color: live ? 'rgb(var(--accent))' : 'rgb(var(--muted))',
            fontSize: 11, fontWeight: 700, cursor: 'pointer',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', animation: live ? 'pulse 1.5s ease-in-out infinite' : 'none' }} />
            {live ? 'LIVE' : 'PAUSED'}
          </button>
          {lastRefresh && (
            <span style={{ fontSize: 10, color: 'rgb(var(--muted))' }}>
              Last: {lastRefresh.toLocaleTimeString('en-IN', { hour12: false })}
            </span>
          )}
          <button onClick={fetch} style={{
            padding: '5px 12px', borderRadius: 6, border: '1px solid rgb(var(--border))',
            background: 'transparent', color: 'rgb(var(--fg))', fontSize: 12, cursor: 'pointer',
          }}>↻ Refresh</button>
        </div>
      </div>

      {/* Filter chips + search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        {['ALL', 'EXECUTED', 'PENDING', 'REJECTED'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '5px 14px', borderRadius: 99, border: '1px solid',
            fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 150ms',
            borderColor: filter === f ? 'rgba(99,102,241,0.5)' : 'rgb(var(--border))',
            background: filter === f ? 'rgba(99,102,241,0.12)' : 'transparent',
            color: filter === f ? 'rgb(var(--brand-2))' : 'rgb(var(--muted))',
          }}>
            {f} <span style={{ opacity: 0.7, fontSize: 10 }}>({counts[f]})</span>
          </button>
        ))}
        <div style={{ flex: 1, minWidth: 180, position: 'relative' }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search client or script…"
            style={{
              width: '100%', padding: '6px 12px 6px 32px', borderRadius: 7,
              border: '1px solid rgb(var(--border))', background: 'rgb(var(--surface2))',
              color: 'rgb(var(--fg))', fontSize: 12, outline: 'none',
            }}
          />
          <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgb(var(--muted))' }}
            width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))', borderRadius: 10, overflow: 'hidden' }}>
        <AdminTable columns={COLS} rows={filtered} renderCell={renderCell} loading={loading} emptyMsg="No orders found for selected filter." />
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}
