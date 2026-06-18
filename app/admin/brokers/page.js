'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';

/* ─── shared style tokens ────────────────────────────────────── */
const C = {
  bg:      '#0f0f1a',
  surface: '#1a1a2e',
  border:  '#252540',
  th:      '#12122a',
  trHover: '#1e1e34',
  text:    '#e0e0e0',
  muted:   '#888',
  brand:   '#f5a623',
};
const inp  = { background: C.surface, border: `1px solid ${C.border}`, color: C.text, borderRadius: 4, padding: '6px 10px', fontSize: 12, outline: 'none', width: '100%' };
const arr  = { position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none', fontSize: 9 };
const labelSt = { fontSize: 11, fontWeight: 800, color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' };
const thSt    = { padding: '9px 10px', fontSize: 10, fontWeight: 800, color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.07em', background: C.th, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' };
const tdSt    = { padding: '8px 10px', fontSize: 12, color: C.text, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' };

function Sel({ value, onChange, placeholder, children, minWidth = 140 }) {
  return (
    <div style={{ position: 'relative', minWidth }}>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ ...inp, paddingRight: 28, appearance: 'none', cursor: 'pointer', minWidth }}>
        {placeholder && <option value="">{placeholder}</option>}
        {children}
      </select>
      <span style={arr}>▼</span>
    </div>
  );
}

const fmt2   = n => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtNum = n => Number(n || 0).toLocaleString('en-IN');

export default function BrokerListingPage() {
  const router = useRouter();

  /* filters */
  const [statusF,     setStatusF]     = useState('');
  const [loginAfter,  setLoginAfter]  = useState('');
  const [loginBefore, setLoginBefore] = useState('');
  const [joinAfter,   setJoinAfter]   = useState('');
  const [joinBefore,  setJoinBefore]  = useState('');

  /* data */
  const [brokers,  setBrokers]  = useState([]);
  const [loading,  setLoading]  = useState(false);

  /* table controls */
  const [search,   setSearch]   = useState('');
  const [perPage,  setPerPage]  = useState(10);
  const [page,     setPage]     = useState(1);

  /* modals */
  const [editUser,   setEditUser]   = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);
  const [toast,      setToast]      = useState(null);

  const showToast = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500); };

  useEffect(() => { loadBrokers(); }, []);

  const loadBrokers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusF)    params.status      = statusF;
      if (joinAfter)  params.join_after  = joinAfter;
      if (joinBefore) params.join_before = joinBefore;
      const { data } = await api.get('/admin/brokers', { params });
      setBrokers(data.brokers || []);
      setPage(1);
    } catch { setBrokers([]); } finally { setLoading(false); }
  }, [statusF, joinAfter, joinBefore]);

  const clearFilter = () => {
    setStatusF(''); setLoginAfter(''); setLoginBefore(''); setJoinAfter(''); setJoinBefore('');
    api.get('/admin/brokers').then(r => setBrokers(r.data.brokers || [])).catch(() => {});
  };

  /* filtered + paged */
  const filtered = brokers.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (u.full_name || '').toLowerCase().includes(q) || u.username.toLowerCase().includes(q);
  });
  const totalPages = Math.ceil(filtered.length / perPage) || 1;
  const paged = perPage === 0 ? filtered : filtered.slice((page - 1) * perPage, page * perPage);

  /* CSV export */
  const exportCSV = () => {
    const cols = ['Name', 'Login ID', 'Master', 'Total Users', 'Outstanding', 'Live Brokerage', 'Status', 'Joined'];
    const rows = filtered.map(u => [
      u.full_name || u.username, u.username, u.master_name || '—',
      u.total_users, Number(u.outstanding || 0).toFixed(2),
      Number(u.live_brokerage || 0).toFixed(2),
      u.is_active ? 'Active' : 'Inactive',
      new Date(u.created_at).toLocaleDateString('en-IN')
    ]);
    const csv = [cols, ...rows].map(r => r.join(',')).join('\n');
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
      download: 'broker_listing.csv'
    });
    a.click();
  };

  /* PDF export */
  const exportPDF = () => {
    const w = window.open('', '_blank');
    const rows = filtered.map(u => `
      <tr>
        <td>${u.full_name || u.username}</td>
        <td>${u.username}</td>
        <td>${u.master_name || '—'} ${u.master_id_val ? `(${u.master_id_val})` : ''}</td>
        <td style="text-align:right">${u.total_users}</td>
        <td style="text-align:right">${fmt2(u.outstanding)}</td>
        <td style="text-align:right">${fmt2(u.live_brokerage)}</td>
        <td style="color:${u.is_active ? 'green' : 'red'}">${u.is_active ? 'Active' : 'Inactive'}</td>
      </tr>`).join('');
    w.document.write(`<html><head><title>Broker Listing</title>
    <style>body{font-family:Arial;font-size:11px}table{width:100%;border-collapse:collapse}
    th{background:#1a1a2e;color:#fff;padding:6px}td{padding:5px 6px;border-bottom:1px solid #ddd}h2{margin-bottom:4px}</style>
    </head><body><h2>Broker Listing</h2><p>Total: ${filtered.length} brokers</p>
    <table><thead><tr><th>Name</th><th>Login ID</th><th>Master</th><th>Total Users</th><th>Outstanding</th><th>Live Brokerage</th><th>Status</th></tr></thead>
    <tbody>${rows}</tbody></table></body></html>`);
    w.document.close(); w.focus(); setTimeout(() => { w.print(); w.close(); }, 300);
  };

  /* delete */
  const confirmDelete = async () => {
    if (!deleteUser) return;
    try {
      await api.delete(`/admin/students/${deleteUser.id}`);
      showToast(`${deleteUser.username} deleted!`);
      setDeleteUser(null);
      loadBrokers();
    } catch (err) { showToast(err.response?.data?.error || 'Delete failed', false); }
  };

  /* Summary totals */
  const totals = filtered.reduce((a, b) => ({
    total_users:    a.total_users    + Number(b.total_users    || 0),
    outstanding:    a.outstanding    + Number(b.outstanding    || 0),
    live_brokerage: a.live_brokerage + Number(b.live_brokerage || 0),
  }), { total_users: 0, outstanding: 0, live_brokerage: 0 });

  return (
    <div style={{ background: C.bg, minHeight: '100%', color: C.text, fontFamily: 'var(--font-sans, Inter, sans-serif)' }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, padding: '12px 20px', borderRadius: 6, fontWeight: 700, fontSize: 13, background: toast.ok ? '#28a745' : '#dc3545', color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
          {toast.ok ? '✅ ' : '❌ '}{toast.msg}
        </div>
      )}

      {/* Delete Modal */}
      {deleteUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: C.surface, border: '1px solid #333', borderRadius: 10, padding: 28, width: 380 }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: '#dc3545', marginBottom: 10 }}>🗑 Delete Broker</div>
            <div style={{ color: '#aaa', marginBottom: 20 }}>
              Delete <strong style={{ color: '#fff' }}>{deleteUser.username}</strong>?
              {Number(deleteUser.total_users) > 0 && (
                <div style={{ color: '#ffc107', fontSize: 12, marginTop: 6 }}>
                  ⚠ This broker has {deleteUser.total_users} user(s) linked!
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={confirmDelete} style={{ padding: '8px 20px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 700, cursor: 'pointer' }}>Delete</button>
              <button onClick={() => setDeleteUser(null)} style={{ padding: '8px 20px', background: '#2a2a4a', color: '#aaa', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '13px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontWeight: 800, fontSize: 18, color: '#fff' }}>Broker Listing</div>
        <span style={{ background: '#e8772220', color: '#e87722', border: '1px solid #e8772235', borderRadius: 20, padding: '2px 12px', fontSize: 11, fontWeight: 700 }}>
          {brokers.length} brokers
        </span>
      </div>

      <div style={{ padding: '14px 20px' }}>

        {/* ── Filter Panel ── */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: '14px 16px', marginBottom: 14 }}>

          {/* Row 1: STATUS + LOGIN AFTER + LOGIN BEFORE + JOIN AFTER */}
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto 1fr auto 1fr auto 1fr', alignItems: 'center', gap: '10px 8px', marginBottom: 12 }}>
            <span style={labelSt}>STATUS</span>
            <Sel value={statusF} onChange={setStatusF} placeholder="Select Status" minWidth={130}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Sel>

            <span style={labelSt}>LOGIN AFTER</span>
            <input type="date" value={loginAfter} onChange={e => setLoginAfter(e.target.value)} style={{ ...inp, minWidth: 150 }} />

            <span style={labelSt}>LOGIN BEFORE</span>
            <input type="date" value={loginBefore} onChange={e => setLoginBefore(e.target.value)} style={{ ...inp, minWidth: 150 }} />

            <span style={labelSt}>JOIN AFTER</span>
            <input type="date" value={joinAfter} onChange={e => setJoinAfter(e.target.value)} style={{ ...inp, minWidth: 150 }} />
          </div>

          {/* Row 2: JOIN BEFORE + SUBMIT + CLEAR FILTER */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={labelSt}>JOIN BEFORE</span>
            <input type="date" value={joinBefore} onChange={e => setJoinBefore(e.target.value)} style={{ ...inp, width: 160 }} />
            <button onClick={loadBrokers} disabled={loading}
              style={{ padding: '8px 28px', background: '#1a1a1a', color: '#fff', border: '2px solid #444', borderRadius: 4, fontWeight: 800, fontSize: 13, cursor: 'pointer', letterSpacing: '0.05em' }}>
              {loading ? 'LOADING…' : 'SUBMIT'}
            </button>
            <button onClick={clearFilter}
              style={{ padding: '8px 20px', background: '#555', color: '#ddd', border: 'none', borderRadius: 4, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              CLEAR FILTER
            </button>
          </div>
        </div>

        {/* ── Summary Cards ── */}
        {brokers.length > 0 && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            {[
              { label: 'Total Brokers',    val: brokers.length,         fmt: v => v,         color: '#e87722' },
              { label: 'Total Users',      val: totals.total_users,     fmt: v => v,         color: '#17a2b8' },
              { label: 'Outstanding',      val: totals.outstanding,     fmt: v => `₹${fmt2(v)}`, color: '#ffc107' },
              { label: 'Live Brokerage',   val: totals.live_brokerage,  fmt: v => `₹${fmt2(v)}`, color: '#28a745' },
            ].map(c => (
              <div key={c.label} style={{ background: C.surface, border: `1px solid ${c.color}25`, borderRadius: 6, padding: '10px 18px', flex: 1, minWidth: 130 }}>
                <div style={{ fontSize: 9, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>{c.label}</div>
                <div style={{ fontWeight: 800, color: c.color, fontFamily: 'var(--font-mono)', fontSize: 14 }}>{c.fmt(c.val)}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Table toolbar ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: C.muted, fontSize: 12 }}>SHOW</span>
            <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }}
              style={{ ...inp, width: 70 }}>
              {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
              <option value={0}>All</option>
            </select>
            <span style={{ color: C.muted, fontSize: 12 }}>ENTRIES</span>
            <div style={{ display: 'flex', border: `1px solid ${C.border}`, borderRadius: 4, overflow: 'hidden' }}>
              <button onClick={exportCSV} style={{ padding: '6px 16px', background: C.brand, color: '#000', border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer', borderRight: '1px solid rgba(0,0,0,0.2)' }}>CSV</button>
              <button onClick={exportPDF} style={{ padding: '6px 16px', background: C.brand, color: '#000', border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>PDF</button>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: C.muted, fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>SEARCH:</span>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{ ...inp, width: 200, border: '1px solid #555' }} />
          </div>
        </div>

        {/* ── Main Table ── */}
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
              <thead>
                <tr>
                  <th style={{ ...thSt, width: 36 }}>#</th>
                  <th style={thSt}>NAME ↕</th>
                  <th style={thSt}>LOGIN ID ↕</th>
                  <th style={thSt}>MASTER</th>
                  <th style={{ ...thSt, textAlign: 'right' }}>TOTAL USERS</th>
                  <th style={{ ...thSt, textAlign: 'right' }}>OUTSTANDING</th>
                  <th style={{ ...thSt, textAlign: 'right' }}>LIVE BROKERAGE</th>
                  <th style={{ ...thSt, textAlign: 'center' }}>ACTION</th>
                  <th style={thSt}>LOGIN IP</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} style={{ ...tdSt, textAlign: 'center', padding: 40, color: '#555' }}>Loading…</td></tr>
                ) : paged.length === 0 ? (
                  <tr><td colSpan={9} style={{ ...tdSt, textAlign: 'center', padding: 40, color: '#555' }}>No data available in table</td></tr>
                ) : paged.map((u, i) => (
                  <tr key={u.id}
                    onMouseEnter={e => e.currentTarget.style.background = C.trHover}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                    {/* # */}
                    <td style={{ ...tdSt, color: '#555', fontSize: 11 }}>{(page - 1) * (perPage || filtered.length) + i + 1}</td>

                    {/* NAME */}
                    <td style={tdSt}>
                      <div style={{ fontWeight: 700, color: '#fff' }}>{u.full_name || u.username}</div>
                      <div style={{ fontSize: 10, color: u.is_active ? '#28a745' : '#dc3545', fontWeight: 700 }}>
                        {u.is_active ? '● Active' : '● Inactive'}
                      </div>
                    </td>

                    {/* LOGIN ID */}
                    <td style={{ ...tdSt, fontFamily: 'var(--font-mono, monospace)', color: C.brand, fontWeight: 800, fontSize: 13 }}>
                      {u.username}
                    </td>

                    {/* MASTER */}
                    <td style={tdSt}>
                      {u.master_name ? (
                        <span>
                          <span style={{ color: '#aaa' }}>{u.master_name}</span>
                          {u.master_id_val && <span style={{ color: '#555', fontSize: 10 }}> ({u.master_id_val})</span>}
                        </span>
                      ) : <span style={{ color: '#444' }}>—</span>}
                    </td>

                    {/* TOTAL USERS */}
                    <td style={{ ...tdSt, textAlign: 'right' }}>
                      <span style={{
                        background: u.total_users > 0 ? '#17a2b820' : '#1a1a1a',
                        color: u.total_users > 0 ? '#17a2b8' : '#444',
                        border: `1px solid ${u.total_users > 0 ? '#17a2b840' : '#2a2a2a'}`,
                        borderRadius: 10, padding: '2px 10px', fontSize: 12, fontWeight: 800,
                      }}>
                        {u.total_users}
                      </span>
                    </td>

                    {/* OUTSTANDING */}
                    <td style={{ ...tdSt, textAlign: 'right', fontFamily: 'var(--font-mono)', color: '#ffc107', fontWeight: 700 }}>
                      {fmt2(u.outstanding)}
                    </td>

                    {/* LIVE BROKERAGE */}
                    <td style={{ ...tdSt, textAlign: 'right', fontFamily: 'var(--font-mono)', color: Number(u.live_brokerage) > 0 ? '#28a745' : '#555', fontWeight: 700 }}>
                      {fmt2(u.live_brokerage)}
                    </td>

                    {/* ACTION: L R A E */}
                    <td style={{ ...tdSt, textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                        {/* L = Ledger */}
                        <button title="Ledger"
                          onClick={() => window.open(`/admin/cash-ledger?user_id=${u.id}`, '_blank')}
                          style={{ background: '#7b5ea7', color: '#fff', border: 'none', borderRadius: 3, padding: '4px 9px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
                          L
                        </button>
                        {/* R = Reports */}
                        <button title="Reports"
                          onClick={() => window.open(`/admin/reports?user_id=${u.id}`, '_blank')}
                          style={{ background: '#dc3545', color: '#fff', border: 'none', borderRadius: 3, padding: '4px 9px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
                          R
                        </button>
                        {/* A = Edit Account */}
                        <button title="Edit Account"
                          onClick={() => setEditUser(u)}
                          style={{ background: '#28a745', color: '#fff', border: 'none', borderRadius: 3, padding: '4px 9px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
                          A
                        </button>
                        {/* E = Users under this broker */}
                        <button title={`View ${u.total_users} users under ${u.username}`}
                          onClick={() => window.open(`/admin/users?broker_id=${u.id}`, '_blank')}
                          style={{ background: '#e8a020', color: '#000', border: 'none', borderRadius: 3, padding: '4px 9px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
                          E
                        </button>
                      </div>
                    </td>

                    {/* LOGIN IP */}
                    <td style={{ ...tdSt, color: '#555', fontFamily: 'monospace', fontSize: 11 }}>
                      —
                    </td>
                  </tr>
                ))}

                {/* Totals row */}
                {paged.length > 0 && (
                  <tr style={{ background: '#12122a', borderTop: '2px solid #333' }}>
                    <td colSpan={4} style={{ ...tdSt, fontWeight: 800, color: '#fff' }}>
                      TOTALS ({filtered.length} brokers)
                    </td>
                    <td style={{ ...tdSt, textAlign: 'right', fontWeight: 800, color: '#17a2b8', fontFamily: 'var(--font-mono)' }}>
                      {totals.total_users}
                    </td>
                    <td style={{ ...tdSt, textAlign: 'right', fontWeight: 800, color: '#ffc107', fontFamily: 'var(--font-mono)' }}>
                      {fmt2(totals.outstanding)}
                    </td>
                    <td style={{ ...tdSt, textAlign: 'right', fontWeight: 800, color: '#28a745', fontFamily: 'var(--font-mono)' }}>
                      {fmt2(totals.live_brokerage)}
                    </td>
                    <td colSpan={2} style={tdSt} />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Pagination ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, flexWrap: 'wrap', gap: 8 }}>
          <span style={{ color: C.muted, fontSize: 12 }}>
            Showing {paged.length === 0 ? 0 : (page - 1) * (perPage || filtered.length) + 1}–{Math.min(page * (perPage || filtered.length), filtered.length)} of {filtered.length} entries
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: '5px 14px', background: page === 1 ? '#1a1a2e' : '#252535', color: page === 1 ? '#555' : '#aaa', border: `1px solid ${C.border}`, borderRadius: 4, cursor: page === 1 ? 'default' : 'pointer', fontSize: 12 }}>
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pg = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              return pg <= totalPages ? (
                <button key={pg} onClick={() => setPage(pg)}
                  style={{ padding: '5px 10px', background: pg === page ? '#e87722' : '#252535', color: pg === page ? '#fff' : '#aaa', border: `1px solid ${C.border}`, borderRadius: 4, cursor: 'pointer', fontWeight: pg === page ? 800 : 400, fontSize: 12 }}>
                  {pg}
                </button>
              ) : null;
            })}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ padding: '5px 14px', background: page === totalPages ? '#1a1a2e' : '#252535', color: page === totalPages ? '#555' : '#aaa', border: `1px solid ${C.border}`, borderRadius: 4, cursor: page === totalPages ? 'default' : 'pointer', fontSize: 12 }}>
              Next
            </button>
          </div>
        </div>

      </div>

      {/* Edit Modal */}
      {editUser && (
        <EditBrokerModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSaved={() => { setEditUser(null); loadBrokers(); showToast('Broker updated!'); }}
        />
      )}
    </div>
  );
}

/* ─── Edit Broker Modal ──────────────────────────────────────── */
function EditBrokerModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState({
    full_name:       user.full_name || '',
    commission_pct:  user.commission_pct || '',
    brokerage_type:  user.brokerage_type || 'per_lot',
    brokerage_value: user.brokerage_value || '',
    balance:         user.balance || '',
    exposure:        user.exposure || '',
    is_active:       user.is_active ?? true,
    phone:           user.phone || '',
    city:            user.city || '',
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const upd  = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const inp2 = { background: '#12122a', border: '1px solid #252540', color: '#e0e0e0', borderRadius: 4, padding: '7px 10px', fontSize: 12, outline: 'none', width: '100%' };

  const save = async () => {
    setSaving(true); setError('');
    try {
      await api.patch(`/admin/students/${user.id}`, {
        ...form,
        balance:         Number(form.balance),
        exposure:        Number(form.exposure),
        brokerage_value: Number(form.brokerage_value),
        commission_pct:  form.commission_pct ? Number(form.commission_pct) : null,
      });
      onSaved();
    } catch (err) { setError(err.response?.data?.error || 'Save failed'); } finally { setSaving(false); }
  };

  const fld = (label, key, type = 'text') => (
    <div>
      <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', fontWeight: 700, marginBottom: 3 }}>{label}</div>
      <input type={type} value={form[key]} onChange={e => upd(key, e.target.value)} style={inp2} />
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', zIndex: 9997, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: 10, padding: 24, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: '#fff', marginBottom: 18 }}>
          ✎ Edit Broker — <span style={{ color: '#f5a623' }}>{user.username}</span>
        </div>

        {/* Info cards */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          {[
            { label: 'Total Users',    val: user.total_users,    color: '#17a2b8', fmt: v => v },
            { label: 'Outstanding',    val: user.outstanding,    color: '#ffc107', fmt: v => `₹${Number(v||0).toLocaleString('en-IN',{minimumFractionDigits:2})}` },
            { label: 'Live Brokerage', val: user.live_brokerage, color: '#28a745', fmt: v => `₹${Number(v||0).toLocaleString('en-IN',{minimumFractionDigits:2})}` },
          ].map(c => (
            <div key={c.label} style={{ background: '#12122a', border: `1px solid ${c.color}25`, borderRadius: 6, padding: '8px 14px', flex: 1, minWidth: 110 }}>
              <div style={{ fontSize: 9, color: '#888', textTransform: 'uppercase', marginBottom: 2 }}>{c.label}</div>
              <div style={{ fontWeight: 800, color: c.color, fontSize: 13 }}>{c.fmt(c.val)}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          {fld('Full Name', 'full_name')}
          {fld('Phone', 'phone', 'tel')}
          {fld('Balance (₹)', 'balance', 'number')}
          {fld('Exposure (₹)', 'exposure', 'number')}
          {fld('Commission %', 'commission_pct', 'number')}
          {fld('City', 'city')}
          <div>
            <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', fontWeight: 700, marginBottom: 3 }}>Brokerage Type</div>
            <div style={{ position: 'relative' }}>
              <select value={form.brokerage_type} onChange={e => upd('brokerage_type', e.target.value)} style={{ ...inp2, paddingRight: 28, appearance: 'none' }}>
                <option value="per_lot">Per Lot</option>
                <option value="per_crore">Per Crore</option>
              </select>
              <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none', fontSize: 9 }}>▼</span>
            </div>
          </div>
          {fld('Brokerage Value', 'brokerage_value', 'number')}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
            <input type="checkbox" checked={form.is_active} onChange={e => upd('is_active', e.target.checked)} style={{ accentColor: '#28a745', width: 16, height: 16 }} />
            <span style={{ color: form.is_active ? '#28a745' : '#dc3545', fontWeight: 700 }}>{form.is_active ? 'ACTIVE' : 'INACTIVE'}</span>
          </label>
        </div>

        {error && <div style={{ color: '#dc3545', fontSize: 12, marginBottom: 10 }}>⚠ {error}</div>}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={save} disabled={saving} style={{ padding: '9px 24px', background: '#28a745', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 700, cursor: 'pointer' }}>
            {saving ? '⏳ Saving…' : '💾 SAVE CHANGES'}
          </button>
          <button onClick={onClose} style={{ padding: '9px 18px', background: '#2a2a4a', color: '#aaa', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
