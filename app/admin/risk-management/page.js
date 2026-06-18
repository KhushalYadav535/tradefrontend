'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/axios';
import AdminTable from '@/components/AdminTable';

const COLS = [
  { key: 'script',  label: 'Script' },
  { key: 'status',  label: 'Status', width: 100 },
  { key: 'reason',  label: 'Reason' },
  { key: 'actions', label: 'Actions', align: 'right', width: 120 },
];

export default function RiskManagementPage() {
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [reasonModal, setReasonModal] = useState(null); // {script}
  const [reasonInput, setReasonInput] = useState('');

  const load = useCallback(() => {
    api.get('/admin/script-master')
      .then(r => setScripts(r.data.scripts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openBanModal = (script) => { setReasonModal(script); setReasonInput('High Volatility'); };
  const closeBanModal = () => { setReasonModal(null); setReasonInput(''); };

  const confirmBan = async () => {
    if (!reasonModal) return;
    setSaving(reasonModal.id);
    closeBanModal();
    try {
      await api.patch(`/admin/scripts/${reasonModal.id}`, { is_banned: true, ban_reason: reasonInput });
      load();
    } catch { alert('Failed to ban script.'); }
    finally { setSaving(null); }
  };

  const unban = async (script) => {
    setSaving(script.id);
    try {
      await api.patch(`/admin/scripts/${script.id}`, { is_banned: false, ban_reason: null });
      load();
    } catch { alert('Failed to unban script.'); }
    finally { setSaving(null); }
  };

  const shown = scripts.filter(s => {
    if (filter === 'BANNED' && !s.is_banned) return false;
    if (filter === 'ACTIVE' && s.is_banned) return false;
    if (search) {
      const q = search.toLowerCase();
      return (s.name || '').toLowerCase().includes(q);
    }
    return true;
  });

  const bannedCount = scripts.filter(s => s.is_banned).length;
  const activeCount = scripts.length - bannedCount;

  function renderCell(row, key) {
    switch (key) {
      case 'script': return (
        <div>
          <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: 13 }}>{row.name}</div>
          <div style={{ fontSize: 10, color: 'rgb(var(--muted))', textTransform: 'uppercase' }}>{row.exchange} · {row.expiry}</div>
        </div>
      );
      case 'status': return (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 800,
          background: row.is_banned ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)',
          color: row.is_banned ? 'rgb(var(--red))' : 'rgb(var(--accent))',
          border: `1px solid ${row.is_banned ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
          {row.is_banned ? 'BANNED' : 'ACTIVE'}
        </span>
      );
      case 'reason': return (
        <span style={{ color: row.is_banned ? 'rgb(var(--red))' : 'rgb(var(--muted))', fontSize: 12 }}>
          {row.is_banned ? (row.ban_reason || '—') : '—'}
        </span>
      );
      case 'actions': return (
        <button
          onClick={() => row.is_banned ? unban(row) : openBanModal(row)}
          disabled={saving === row.id}
          style={{
            padding: '5px 14px', borderRadius: 7, border: '1px solid',
            fontSize: 11, fontWeight: 700, cursor: saving === row.id ? 'not-allowed' : 'pointer',
            opacity: saving === row.id ? 0.5 : 1, transition: 'all 150ms',
            borderColor: row.is_banned ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)',
            background: row.is_banned ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
            color: row.is_banned ? 'rgb(var(--accent))' : 'rgb(var(--red))',
          }}
        >
          {saving === row.id ? '…' : row.is_banned ? '✓ Unban' : '⊘ Ban'}
        </button>
      );
      default: return row[key] ?? '—';
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: 'rgb(var(--fg))' }}>Banned / Blocked Scripts</h1>
        <p style={{ fontSize: 12, color: 'rgb(var(--muted))', margin: '3px 0 0' }}>Control script bans and trading halts across the platform</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
        {[
          { label: 'Total Scripts', val: scripts.length, color: 'rgb(var(--fg))' },
          { label: 'Active',        val: activeCount,    color: 'rgb(var(--accent))' },
          { label: 'Banned',        val: bannedCount,    color: 'rgb(var(--red))' },
        ].map(s => (
          <div key={s.label} style={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))', borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgb(var(--muted))', fontWeight: 600 }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 800, color: s.color, marginTop: 3 }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {['ALL', 'ACTIVE', 'BANNED'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '5px 14px', borderRadius: 99, border: '1px solid',
            fontSize: 11, fontWeight: 700, cursor: 'pointer',
            borderColor: filter === f ? 'rgba(99,102,241,0.5)' : 'rgb(var(--border))',
            background: filter === f ? 'rgba(99,102,241,0.12)' : 'transparent',
            color: filter === f ? 'rgb(var(--brand-2))' : 'rgb(var(--muted))',
          }}>{f}</button>
        ))}
        <div style={{ flex: 1, minWidth: 180, position: 'relative' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search script…"
            style={{ width: '100%', padding: '6px 12px 6px 32px', borderRadius: 7, border: '1px solid rgb(var(--border))', background: 'rgb(var(--surface2))', color: 'rgb(var(--fg))', fontSize: 12, outline: 'none' }} />
          <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgb(var(--muted))' }}
            width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))', borderRadius: 10, overflow: 'hidden' }}>
        <AdminTable columns={COLS} rows={shown} renderCell={renderCell} loading={loading} emptyMsg="No scripts found." />
      </div>

      {/* Ban Reason Modal */}
      {reasonModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={closeBanModal}>
          <div style={{
            background: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))',
            borderRadius: 12, padding: 24, width: 400, maxWidth: '90vw',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Ban Script</div>
            <div style={{ fontSize: 12, color: 'rgb(var(--muted))', marginBottom: 16 }}>
              Enter reason for banning <strong>{reasonModal.name}</strong>
            </div>
            <input
              value={reasonInput}
              onChange={e => setReasonInput(e.target.value)}
              placeholder="Ban reason…"
              autoFocus
              style={{ width: '100%', padding: '9px 12px', borderRadius: 7, border: '1px solid rgb(var(--border))', background: 'rgb(var(--surface2))', color: 'rgb(var(--fg))', fontSize: 13, outline: 'none', marginBottom: 14 }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={closeBanModal} style={{ padding: '8px 16px', borderRadius: 7, border: '1px solid rgb(var(--border))', background: 'transparent', color: 'rgb(var(--fg))', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={confirmBan} style={{ padding: '8px 16px', borderRadius: 7, border: 'none', background: 'rgb(var(--red))', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>⊘ Confirm Ban</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
