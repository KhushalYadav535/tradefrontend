'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/axios';

/* ─── theme tokens ───────────────────────────────────────────── */
const C = {
  bg:      '#0f0f1a',
  surface: '#1a1a2e',
  border:  '#252540',
  th:      '#12122a',
  trHover: '#1e1e34',
  text:    '#e0e0e0',
  muted:   '#888',
  brand:   '#f5a623',   // amber — AVADH11 accent
};

const inp = {
  background: C.surface, border: `1px solid ${C.border}`, color: C.text,
  borderRadius: 4, padding: '6px 10px', fontSize: 12, outline: 'none', width: '100%',
};
const selWrap = { position: 'relative', display: 'inline-block' };
const selSt = { ...inp, paddingRight: 28, appearance: 'none', cursor: 'pointer', minWidth: 140 };
const arr = { position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none', fontSize: 9 };

function Sel({ value, onChange, placeholder, children, minWidth = 140 }) {
  return (
    <div style={{ ...selWrap, minWidth }}>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ ...selSt, minWidth }}>
        {placeholder && <option value="">{placeholder}</option>}
        {children}
      </select>
      <span style={arr}>▼</span>
    </div>
  );
}

const labelSt = { fontSize: 11, fontWeight: 800, color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginRight: 8, whiteSpace: 'nowrap' };
const rowSt   = { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' };

/* ─── ACTION button colors ───────────────────────────────────── */
const actionBtn = (bg, label) => (
  <button style={{ background: bg, color: '#fff', border: 'none', borderRadius: 3, padding: '3px 8px', fontSize: 11, fontWeight: 800, cursor: 'pointer', minWidth: 28 }}>
    {label}
  </button>
);

/* ─── position square radio ─────────────────────────────────── */
function PosRadio({ userId, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
      {['YES', 'NO'].map(opt => (
        <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 12, color: opt === 'YES' ? '#28a745' : '#dc3545', fontWeight: 700 }}>
          <input
            type="radio"
            name={`pos_${userId}`}
            value={opt}
            checked={value === opt}
            onChange={() => onChange(opt)}
            style={{ accentColor: opt === 'YES' ? '#28a745' : '#dc3545', width: 14, height: 14 }}
          />
          {opt}
        </label>
      ))}
    </div>
  );
}

/* ─── helpers ────────────────────────────────────────────────── */
const fmt2 = n => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function UserListingPage() {
  /* filters */
  const [brokerF,     setBrokerF]     = useState('');
  const [masterF,     setMasterF]     = useState('');
  const [statusF,     setStatusF]     = useState('');
  const [clientF,     setClientF]     = useState('');
  const [loginAfter,  setLoginAfter]  = useState('');
  const [loginBefore, setLoginBefore] = useState('');
  const [joinAfter,   setJoinAfter]   = useState('');
  const [joinBefore,  setJoinBefore]  = useState('');

  /* data */
  const [users,    setUsers]    = useState([]);
  const [brokers,  setBrokers]  = useState([]);
  const [masters,  setMasters]  = useState([]);
  const [loading,  setLoading]  = useState(false);

  /* table controls */
  const [search,   setSearch]   = useState('');
  const [perPage,  setPerPage]  = useState(10);
  const [page,     setPage]     = useState(1);
  const [posMap,   setPosMap]   = useState({}); // userId → YES|NO

  /* modals */
  const [editUser,    setEditUser]    = useState(null);
  const [deleteUser,  setDeleteUser]  = useState(null);
  const [ledgerUser,  setLedgerUser]  = useState(null);
  const [toast,       setToast]       = useState(null);

  const showToast = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500); };

  /* load dropdowns */
  useEffect(() => {
    api.get('/admin/students', { params: { role: 'broker' } }).then(r => setBrokers(r.data.students || [])).catch(() => {});
    api.get('/admin/students', { params: { role: 'master' } }).then(r => setMasters(r.data.students || [])).catch(() => {});
    loadUsers();
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { role: 'user' };
      if (brokerF)     params.broker_id  = brokerF;
      if (masterF)     params.master_id  = masterF;
      if (statusF)     params.status     = statusF;
      if (joinAfter)   params.join_after  = joinAfter;
      if (joinBefore)  params.join_before = joinBefore;
      const { data } = await api.get('/admin/students', { params });
      const list = data.students || [];
      setUsers(list);
      const m = {};
      list.forEach(u => { m[u.id] = 'YES'; });
      setPosMap(m);
      setPage(1);
    } catch { setUsers([]); } finally { setLoading(false); }
  }, [brokerF, masterF, statusF, joinAfter, joinBefore]);

  const clearFilter = () => {
    setBrokerF(''); setMasterF(''); setStatusF(''); setClientF('');
    setLoginAfter(''); setLoginBefore(''); setJoinAfter(''); setJoinBefore('');
    api.get('/admin/students', { params: { role: 'user' } }).then(r => {
      const list = r.data.students || [];
      setUsers(list);
      const m = {}; list.forEach(u => { m[u.id] = 'YES'; }); setPosMap(m);
    }).catch(() => {});
  };

  /* filtered + paged */
  const filtered = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (u.full_name||'').toLowerCase().includes(q) || u.username.toLowerCase().includes(q);
  });
  const totalPages = Math.ceil(filtered.length / perPage) || 1;
  const paged = perPage === 0 ? filtered : filtered.slice((page - 1) * perPage, page * perPage);

  /* CSV export */
  const exportCSV = () => {
    const cols = ['Name', 'Login ID', 'Account Type', 'Broker', 'Master', 'Balance', 'Exposure', 'Status', 'Joined'];
    const rows = filtered.map(u => [u.full_name || u.username, u.username, u.brokerage_type === 'per_lot' ? `${u.brokerage_value || 0} LOT` : u.brokerage_type, u.broker_name || '—', u.master_name || '—', u.balance, u.exposure, u.is_active ? 'Active' : 'Inactive', new Date(u.created_at).toLocaleDateString('en-IN')]);
    const csv = [cols, ...rows].map(r => r.join(',')).join('\n');
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: 'user_listing.csv' });
    a.click();
  };

  /* PDF print */
  const exportPDF = () => {
    const w = window.open('', '_blank');
    const rows = filtered.map(u => `<tr><td>${u.full_name||u.username}</td><td>${u.username}</td><td>${u.brokerage_value||0} LOT</td><td>${u.broker_name||'—'}</td><td>${u.master_name||'—'}</td><td>₹${fmt2(u.balance)}</td><td style="color:${u.is_active?'green':'red'}">${u.is_active?'Active':'Inactive'}</td></tr>`).join('');
    w.document.write(`<html><head><title>User Listing</title><style>body{font-family:Arial;font-size:11px}table{width:100%;border-collapse:collapse}th{background:#1a1a2e;color:#fff;padding:6px}td{padding:5px 6px;border-bottom:1px solid #ddd}</style></head><body><h2>User Listing</h2><table><thead><tr><th>Name</th><th>Login ID</th><th>Account Type</th><th>Broker</th><th>Master</th><th>Balance</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></body></html>`);
    w.document.close(); w.focus(); setTimeout(() => { w.print(); w.close(); }, 300);
  };

  /* inline position square toggle */
  const togglePos = async (userId, val) => {
    setPosMap(prev => ({ ...prev, [userId]: val }));
    // real-time: could call an API here if needed
  };

  /* delete */
  const confirmDelete = async () => {
    if (!deleteUser) return;
    try {
      await api.delete(`/admin/students/${deleteUser.id}`);
      showToast(`${deleteUser.username} deleted!`, false);
      setDeleteUser(null);
      loadUsers();
    } catch (err) { showToast(err.response?.data?.error || 'Delete failed', false); }
  };

  /* ─── Styles ─────────────────────────────────────────────── */
  const thSt = { padding: '9px 10px', fontSize: 10, fontWeight: 800, color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.07em', background: C.th, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' };
  const tdSt = { padding: '8px 10px', fontSize: 12, color: C.text, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' };

  return (
    <div style={{ background: C.bg, minHeight: '100%', color: C.text, fontFamily: 'var(--font-sans, Inter, sans-serif)' }}>
      {/* Toast */}
      {toast && <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, padding: '12px 20px', borderRadius: 6, fontWeight: 700, fontSize: 13, background: toast.ok ? '#28a745' : '#dc3545', color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>{toast.ok ? '✅ ' : '❌ '}{toast.msg}</div>}

      {/* Delete Modal */}
      {deleteUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: C.surface, border: `1px solid #333`, borderRadius: 10, padding: 28, width: 380 }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: '#dc3545', marginBottom: 10 }}>🗑 Delete User</div>
            <div style={{ color: '#aaa', marginBottom: 20 }}>Delete <strong style={{ color: '#fff' }}>{deleteUser.username}</strong>? This cannot be undone.</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={confirmDelete} style={{ padding: '8px 20px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 700, cursor: 'pointer' }}>Delete</button>
              <button onClick={() => setDeleteUser(null)} style={{ padding: '8px 20px', background: '#2a2a4a', color: '#aaa', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Page header */}
      <div style={{ padding: '13px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontWeight: 800, fontSize: 18, color: '#fff', fontFamily: 'var(--font-heading)' }}>User Listing</div>
        <span style={{ background: '#17a2b820', color: '#17a2b8', border: '1px solid #17a2b835', borderRadius: 20, padding: '2px 12px', fontSize: 11, fontWeight: 700 }}>{users.length} users</span>
      </div>

      <div style={{ padding: '14px 20px' }}>

        {/* ── Filter panel (exact AVADH11 layout) ── */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: '14px 16px', marginBottom: 14 }}>

          {/* Row 1: BROKER / MASTER / STATUS / CLIENT */}
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto 1fr auto 1fr auto 1fr', alignItems: 'center', gap: '10px 8px', marginBottom: 12 }}>
            <span style={labelSt}>BROKER</span>
            <Sel value={brokerF} onChange={setBrokerF} placeholder="Select…">
              {brokers.map(b => <option key={b.id} value={String(b.id)}>{b.full_name || b.username} ({b.username})</option>)}
            </Sel>

            <span style={labelSt}>MASTER</span>
            <Sel value={masterF} onChange={setMasterF} placeholder="Select…">
              {masters.map(m => <option key={m.id} value={String(m.id)}>{m.full_name || m.username} ({m.username})</option>)}
            </Sel>

            <span style={labelSt}>STATUS</span>
            <Sel value={statusF} onChange={setStatusF} placeholder="Select Status" minWidth={130}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Sel>

            <span style={labelSt}>CLIENT</span>
            <Sel value={clientF} onChange={setClientF} placeholder="Select…" minWidth={140}>
              {users.slice(0, 100).map(u => <option key={u.id} value={String(u.id)}>{u.full_name || u.username}</option>)}
            </Sel>
          </div>

          {/* Row 2: Date filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px 12px', flexWrap: 'wrap', marginBottom: 14 }}>
            <span style={labelSt}>LOGIN AFTER</span>
            <input type="date" value={loginAfter} onChange={e => setLoginAfter(e.target.value)}
              style={{ ...inp, width: 150, minWidth: 140 }} />

            <span style={labelSt}>LOGIN BEFORE</span>
            <input type="date" value={loginBefore} onChange={e => setLoginBefore(e.target.value)}
              style={{ ...inp, width: 150, minWidth: 140 }} />

            <span style={labelSt}>JOIN AFTER</span>
            <input type="date" value={joinAfter} onChange={e => setJoinAfter(e.target.value)}
              style={{ ...inp, width: 150, minWidth: 140 }} />

            <span style={labelSt}>JOIN BEFORE</span>
            <input type="date" value={joinBefore} onChange={e => setJoinBefore(e.target.value)}
              style={{ ...inp, width: 150, minWidth: 140 }} />
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={loadUsers} disabled={loading} style={{ padding: '8px 28px', background: '#1a1a1a', color: '#fff', border: '2px solid #444', borderRadius: 4, fontWeight: 800, fontSize: 13, cursor: 'pointer', letterSpacing: '0.05em' }}>
              {loading ? 'LOADING…' : 'SUBMIT'}
            </button>
            <button onClick={clearFilter} style={{ padding: '8px 20px', background: '#555', color: '#ddd', border: 'none', borderRadius: 4, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              CLEAR FILTER
            </button>
          </div>
        </div>

        {/* ── Table toolbar ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
          {/* Left: SHOW + CSV + PDF */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: C.muted, fontSize: 12 }}>SHOW</span>
            <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }} style={{ ...inp, width: 70 }}>
              {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
              <option value={0}>All</option>
            </select>
            <span style={{ color: C.muted, fontSize: 12 }}>ENTRIES</span>

            <div style={{ display: 'flex', border: `1px solid ${C.border}`, borderRadius: 4, overflow: 'hidden' }}>
              <button onClick={exportCSV} style={{ padding: '6px 16px', background: C.brand, color: '#000', border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer', borderRight: `1px solid rgba(0,0,0,0.2)` }}>CSV</button>
              <button onClick={exportPDF} style={{ padding: '6px 16px', background: C.brand, color: '#000', border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>PDF</button>
            </div>
          </div>

          {/* Right: Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: C.muted, fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>SEARCH:</span>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ ...inp, width: 200, border: '1px solid #555' }} />
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
                  <th style={thSt}>ACCOUNT TYPE ↕</th>
                  <th style={thSt}>BROKER</th>
                  <th style={thSt}>MASTER</th>
                  <th style={{ ...thSt, textAlign: 'center' }}>POSITION SQUARE</th>
                  <th style={{ ...thSt, textAlign: 'center' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} style={{ ...tdSt, textAlign: 'center', padding: 40, color: '#555' }}>Loading…</td></tr>
                ) : paged.length === 0 ? (
                  <tr><td colSpan={8} style={{ ...tdSt, textAlign: 'center', padding: 40, color: '#555' }}>No users found.</td></tr>
                ) : paged.map((u, i) => {
                  const accountType = u.brokerage_type === 'per_lot'
                    ? `${Number(u.brokerage_value || 0).toFixed(0)} LOT`
                    : u.brokerage_type === 'per_crore'
                      ? `${Number(u.brokerage_value || 0).toFixed(2)} CR`
                      : u.brokerage_type || '—';

                  return (
                    <tr key={u.id}
                      onMouseEnter={e => e.currentTarget.style.background = C.trHover}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* # */}
                      <td style={{ ...tdSt, color: '#555', fontSize: 11 }}>{(page - 1) * perPage + i + 1}</td>

                      {/* NAME */}
                      <td style={tdSt}>
                        <div style={{ fontWeight: 700, color: '#fff' }}>{u.full_name || u.username}</div>
                        {!u.is_active && <span style={{ fontSize: 9, color: '#dc3545', fontWeight: 700 }}>INACTIVE</span>}
                      </td>

                      {/* LOGIN ID */}
                      <td style={{ ...tdSt, fontFamily: 'var(--font-mono, monospace)', color: C.brand, fontWeight: 700 }}>
                        {u.username}
                      </td>

                      {/* ACCOUNT TYPE */}
                      <td style={tdSt}>
                        <span style={{ background: '#2a2020', color: C.brand, border: `1px solid ${C.brand}40`, borderRadius: 3, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                          {accountType}
                        </span>
                      </td>

                      {/* BROKER */}
                      <td style={{ ...tdSt, color: '#aaa', fontSize: 11 }}>
                        {u.broker_name ? (
                          <span>{u.broker_name} <span style={{ color: '#555' }}>({u.broker_id})</span></span>
                        ) : '—'}
                      </td>

                      {/* MASTER */}
                      <td style={{ ...tdSt, color: '#aaa', fontSize: 11 }}>
                        {u.master_name ? (
                          <span>{u.master_name} <span style={{ color: '#555' }}>({u.master_id})</span></span>
                        ) : '—'}
                      </td>

                      {/* POSITION SQUARE */}
                      <td style={{ ...tdSt, textAlign: 'center' }}>
                        <PosRadio
                          userId={u.id}
                          value={posMap[u.id] || 'YES'}
                          onChange={val => togglePos(u.id, val)}
                        />
                      </td>

                      {/* ACTION: L R A CL */}
                      <td style={{ ...tdSt, textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                          {/* L = Ledger */}
                          <button
                            title="Ledger"
                            onClick={() => {
                              const params = new URLSearchParams({
                                user_id: u.id,
                                broker_id: brokerF,
                                master_id: masterF,
                                status: statusF,
                                client_id: clientF,
                                login_after: loginAfter,
                                login_before: loginBefore,
                                join_after: joinAfter,
                                join_before: joinBefore,
                              }).toString();
                              window.open(`/admin/cash-ledger?${params}`, '_blank');
                            }}
                            style={{ background: '#17a2b8', color: '#fff', border: 'none', borderRadius: 3, padding: '4px 9px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
                            L
                          </button>
                          {/* R = Reset / Trade History */}
                          <button
                            title="Trade History"
                            onClick={() => {
                              const params = new URLSearchParams({
                                user_id: u.id,
                                broker_id: brokerF,
                                master_id: masterF,
                                status: statusF,
                                client_id: clientF,
                                login_after: loginAfter,
                                login_before: loginBefore,
                                join_after: joinAfter,
                                join_before: joinBefore,
                              }).toString();
                              window.open(`/admin/reports?${params}`, '_blank');
                            }}
                            style={{ background: '#dc3545', color: '#fff', border: 'none', borderRadius: 3, padding: '4px 9px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
                            R
                          </button>
                          {/* A = Edit Account */}
                          <button
                            title="Edit User"
                            onClick={() => setEditUser(u)}
                            style={{ background: '#28a745', color: '#fff', border: 'none', borderRadius: 3, padding: '4px 9px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
                            A
                          </button>
                          {/* CL = Close / Delete */}
                          <button
                            title="Delete User"
                            onClick={() => setDeleteUser(u)}
                            style={{ background: '#495057', color: '#fff', border: 'none', borderRadius: 3, padding: '4px 9px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
                            CL
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Pagination ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, flexWrap: 'wrap', gap: 8 }}>
          <span style={{ color: C.muted, fontSize: 12 }}>
            Showing {paged.length === 0 ? 0 : (page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length} entries
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
                  style={{ padding: '5px 10px', background: pg === page ? '#17a2b8' : '#252535', color: pg === page ? '#fff' : '#aaa', border: `1px solid ${C.border}`, borderRadius: 4, cursor: 'pointer', fontWeight: pg === page ? 800 : 400, fontSize: 12 }}>
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

      {/* ── Edit User Modal ── */}
      {editUser && <EditUserModal user={editUser} brokers={brokers} masters={masters} onClose={() => setEditUser(null)} onSaved={() => { setEditUser(null); loadUsers(); showToast('User updated!'); }} />}
    </div>
  );
}

/* ─── Edit User Modal ────────────────────────────────────────── */
function EditUserModal({ user, brokers, masters, onClose, onSaved }) {
  const [form, setForm] = useState({
    full_name:       user.full_name || '',
    balance:         user.balance || '',
    exposure:        user.exposure || '',
    brokerage_type:  user.brokerage_type || 'per_lot',
    brokerage_value: user.brokerage_value || '',
    auto_cut:        user.auto_cut || false,
    auto_cut_limit:  user.auto_cut_limit || '',
    master_id:       user.master_id || '',
    broker_id:       user.broker_id || '',
    is_active:       user.is_active ?? true,
    phone:           user.phone || '',
    city:            user.city || '',
    commission_pct:  user.commission_pct || '',
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true); setError('');
    try {
      await api.patch(`/admin/students/${user.id}`, { ...form, balance: Number(form.balance), exposure: Number(form.exposure), brokerage_value: Number(form.brokerage_value), auto_cut_limit: Number(form.auto_cut_limit) || null, master_id: form.master_id ? Number(form.master_id) : null, broker_id: form.broker_id ? Number(form.broker_id) : null, commission_pct: form.commission_pct ? Number(form.commission_pct) : null });
      onSaved();
    } catch (err) { setError(err.response?.data?.error || 'Save failed'); } finally { setSaving(false); }
  };

  const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', zIndex: 9997, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 };
  const modal   = { background: '#1a1a2e', border: '1px solid #333', borderRadius: 10, padding: 24, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' };

  const fld = (label, key, type = 'text', extra = {}) => (
    <div>
      <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', fontWeight: 700, marginBottom: 3 }}>{label}</div>
      <input type={type} value={form[key]} onChange={e => upd(key, type === 'number' ? e.target.value : e.target.value)} style={{ ...inp }} {...extra} />
    </div>
  );

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modal}>
        <div style={{ fontWeight: 800, fontSize: 16, color: '#fff', marginBottom: 18 }}>
          ✎ Edit — <span style={{ color: C.brand }}>{user.username}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          {fld('Full Name', 'full_name')}
          {fld('Phone', 'phone', 'tel')}
          {fld('Balance (₹)', 'balance', 'number')}
          {fld('Exposure (₹)', 'exposure', 'number')}
          {fld('City', 'city')}
          {fld('Commission %', 'commission_pct', 'number')}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', fontWeight: 700, marginBottom: 3 }}>Brokerage Type</div>
            <div style={{ position: 'relative' }}>
              <select value={form.brokerage_type} onChange={e => upd('brokerage_type', e.target.value)} style={{ ...inp, paddingRight: 28, appearance: 'none' }}>
                <option value="per_lot">Per Lot</option>
                <option value="per_crore">Per Crore</option>
              </select>
              <span style={arr}>▼</span>
            </div>
          </div>
          {fld('Brokerage Value', 'brokerage_value', 'number')}
          <div>
            <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', fontWeight: 700, marginBottom: 3 }}>Broker</div>
            <div style={{ position: 'relative' }}>
              <select value={form.broker_id} onChange={e => upd('broker_id', e.target.value)} style={{ ...inp, paddingRight: 28, appearance: 'none' }}>
                <option value="">None</option>
                {brokers.map(b => <option key={b.id} value={String(b.id)}>{b.username}</option>)}
              </select>
              <span style={arr}>▼</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', fontWeight: 700, marginBottom: 3 }}>Master</div>
            <div style={{ position: 'relative' }}>
              <select value={form.master_id} onChange={e => upd('master_id', e.target.value)} style={{ ...inp, paddingRight: 28, appearance: 'none' }}>
                <option value="">None</option>
                {masters.map(m => <option key={m.id} value={String(m.id)}>{m.username}</option>)}
              </select>
              <span style={arr}>▼</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 20, marginBottom: 14, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
            <input type="checkbox" checked={form.is_active} onChange={e => upd('is_active', e.target.checked)} style={{ accentColor: '#28a745', width: 16, height: 16 }} />
            <span style={{ color: form.is_active ? '#28a745' : '#dc3545', fontWeight: 700 }}>{form.is_active ? 'ACTIVE' : 'INACTIVE'}</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
            <input type="checkbox" checked={form.auto_cut} onChange={e => upd('auto_cut', e.target.checked)} style={{ accentColor: '#fd7e14', width: 16, height: 16 }} />
            <span style={{ color: '#fd7e14', fontWeight: 700 }}>Auto Cut</span>
          </label>
          {form.auto_cut && (
            <div style={{ flex: 1, minWidth: 150 }}>
              {fld('Auto Cut Limit (₹)', 'auto_cut_limit', 'number')}
            </div>
          )}
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
