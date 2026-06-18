'use client';

import { useState, useCallback, useEffect } from 'react';
import api from '@/lib/axios';

const C = {
  bg: '#0f0f1a', surface: '#1a1a2e', border: '#252540',
  th: '#12122a', trHover: '#1e1e34', text: '#e0e0e0', muted: '#888', brand: '#f5a623',
};
const inp  = { background: C.surface, border: `1px solid ${C.border}`, color: C.text, borderRadius: 4, padding: '7px 10px', fontSize: 12, outline: 'none', width: '100%' };
const arr  = { position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none', fontSize: 9 };
const lblSt = { fontSize: 11, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, display: 'block' };
const thSt  = { padding: '9px 10px', fontSize: 10, fontWeight: 800, color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.07em', background: C.th, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap', cursor: 'pointer' };
const tdSt  = { padding: '8px 10px', fontSize: 12, color: C.text, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' };
const fmt2  = n => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const today = () => new Date().toISOString().split('T')[0];

function Sel({ value, onChange, placeholder, children, minWidth = 150 }) {
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

export default function CashLedgerPage() {
  const [userType,    setUserType]    = useState('');
  const [selectId,    setSelectId]    = useState('');
  const [entryAfter,  setEntryAfter]  = useState('');
  const [entryBefore, setEntryBefore] = useState('');
  const [users,       setUsers]       = useState([]);
  const [rows,        setRows]        = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [search,      setSearch]      = useState('');
  const [perPage,     setPerPage]     = useState(10);
  const [page,        setPage]        = useState(1);

  useEffect(() => { loadUsers(userType); }, [userType]);

  // Parse URL query parameters and auto‑load ledger when opened from users page
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const uid = q.get('user_id') || '';
    const after = q.get('start_date') || '';
    const before = q.get('end_date') || '';
    if (uid) {
      setUserType('user');
      setSelectId(uid);
      setEntryAfter(after);
      setEntryBefore(before);
      load();
    }
  }, []);


  const loadUsers = async (role) => {
    try {
      const r = await api.get('/admin/students', { params: role ? { role } : {} });
      setUsers(r.data.students || []);
    } catch { setUsers([]); }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectId)    params.user_id    = selectId;
      if (entryAfter)  params.start_date = entryAfter;
      if (entryBefore) params.end_date   = entryBefore;
      const { data } = await api.get('/admin/accounts/cash-ledger', { params });
      setRows(data.entries || data.ledger || []);
      setPage(1);
    } catch { setRows([]); } finally { setLoading(false); }
  }, [selectId, entryAfter, entryBefore]);

  const clear = () => { setUserType(''); setSelectId(''); setEntryAfter(''); setEntryBefore(''); setRows([]); };

  const filtered = rows.filter(r => !search || (r.name || r.username || '').toLowerCase().includes(search.toLowerCase()) || (r.remark || r.description || '').toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.ceil(filtered.length / (perPage || filtered.length)) || 1;
  const paged = perPage === 0 ? filtered : filtered.slice((page - 1) * perPage, page * perPage);
  const totals = filtered.reduce((a, r) => ({ debit: a.debit + Number(r.debit || 0), credit: a.credit + Number(r.credit || 0) }), { debit: 0, credit: 0 });

  const exportCSV = () => {
    const cols = ['Name', 'Date', 'Debit', 'Credit', 'Remark'];
    const data = filtered.map(r => [r.name || r.username, r.date || r.entry_date, Number(r.debit || 0).toFixed(2), Number(r.credit || 0).toFixed(2), r.remark || r.description || '']);
    const csv = [cols, ...data].map(row => row.join(',')).join('\n');
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: 'cash_ledger.csv' });
    a.click();
  };

  const exportPDF = () => {
    const w = window.open('', '_blank');
    const rows2 = filtered.map(r => `<tr><td>${r.name || r.username || '—'}</td><td>${r.date || r.entry_date || '—'}</td><td align="right">${fmt2(r.debit)}</td><td align="right">${fmt2(r.credit)}</td><td>${r.remark || r.description || '—'}</td></tr>`).join('');
    w.document.write(`<html><head><title>Cash Ledger</title><style>body{font-family:Arial;font-size:11px}table{width:100%;border-collapse:collapse}th{background:#1a1a2e;color:#fff;padding:6px}td{padding:5px 6px;border-bottom:1px solid #ddd}</style></head><body><h2>Cash Ledger</h2><table><thead><tr><th>Name</th><th>Date</th><th>Debit</th><th>Credit</th><th>Remark</th></tr></thead><tbody>${rows2}</tbody></table></body></html>`);
    w.document.close(); w.focus(); setTimeout(() => { w.print(); w.close(); }, 300);
  };

  return (
    <div style={{ background: C.bg, minHeight: '100%', color: C.text, fontFamily: 'var(--font-sans, Inter, sans-serif)' }}>
      <div style={{ padding: '13px 20px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontWeight: 800, fontSize: 18, color: '#fff' }}>Cash Ledger</div>
      </div>
      <div style={{ padding: '14px 20px' }}>

        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: '14px 16px', marginBottom: 14 }}>
          {/* Row 1: filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px 12px', flexWrap: 'wrap', marginBottom: 12 }}>
            <span style={{ ...lblSt, marginBottom: 0 }}>USER TYPE</span>
            <Sel value={userType} onChange={v => { setUserType(v); setSelectId(''); }} placeholder="" minWidth={140}>
              <option value="user">User</option>
              <option value="master">Master</option>
              <option value="broker">Broker</option>
            </Sel>

            <span style={{ ...lblSt, marginBottom: 0 }}>SELECT</span>
            <Sel value={selectId} onChange={setSelectId} placeholder="" minWidth={180}>
              {users.map(u => <option key={u.id} value={String(u.id)}>{u.full_name || u.username} ({u.username})</option>)}
            </Sel>

            <span style={{ ...lblSt, marginBottom: 0 }}>ENTRY AFTER</span>
            <input type="date" value={entryAfter} onChange={e => setEntryAfter(e.target.value)} style={{ ...inp, width: 160 }} />

            <span style={{ ...lblSt, marginBottom: 0 }}>ENTRY BEFORE</span>
            <input type="date" value={entryBefore} onChange={e => setEntryBefore(e.target.value)} style={{ ...inp, width: 160 }} />
          </div>

          {/* Row 2: buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={load} disabled={loading}
              style={{ padding: '8px 28px', background: '#1a1a1a', color: '#fff', border: '2px solid #444', borderRadius: 4, fontWeight: 800, fontSize: 13, cursor: 'pointer', letterSpacing: '0.05em' }}>
              {loading ? 'LOADING…' : 'SUBMIT'}
            </button>
            <button onClick={clear}
              style={{ padding: '8px 20px', background: '#555', color: '#ddd', border: 'none', borderRadius: 4, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              CLEAR FILTER
            </button>
          </div>
        </div>


        {/* ── Toolbar ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: C.muted, fontSize: 12 }}>SHOW</span>
            <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }} style={{ ...inp, width: 70 }}>
              {[10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
              <option value={0}>All</option>
            </select>
            <span style={{ color: C.muted, fontSize: 12 }}>ENTRIES</span>
            <div style={{ display: 'flex', border: '1px solid #555', borderRadius: 4, overflow: 'hidden' }}>
              <button onClick={exportCSV} style={{ padding: '5px 16px', background: '#7b4f2e', color: '#fff', border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer', borderRight: '1px solid rgba(0,0,0,0.2)' }}>CSV</button>
              <button onClick={exportPDF} style={{ padding: '5px 16px', background: '#7b4f2e', color: '#fff', border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>PDF</button>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: C.muted, fontSize: 12, fontWeight: 700 }}>SEARCH:</span>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ ...inp, width: 200, border: '1px solid #555' }} />
          </div>
        </div>

        {/* ── Table ── */}
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['NAME ↕', 'DATE ↕', 'DEBIT', 'CREDIT', 'REMARK ↕', 'ACTION'].map(h => (
                  <th key={h} style={{ ...thSt, textAlign: ['DEBIT', 'CREDIT'].includes(h) ? 'right' : 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ ...tdSt, textAlign: 'center', padding: 40, color: '#555' }}>Loading…</td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={6} style={{ ...tdSt, textAlign: 'center', padding: 40, color: '#555' }}>No data available in table</td></tr>
              ) : paged.map((r, i) => (
                <tr key={i} onMouseEnter={e => e.currentTarget.style.background = C.trHover} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ ...tdSt, fontWeight: 700 }}>{r.name || r.full_name || r.username || '—'}</td>
                  <td style={{ ...tdSt, color: '#aaa', fontSize: 11 }}>{r.date || r.entry_date || '—'}</td>
                  <td style={{ ...tdSt, textAlign: 'right', color: '#dc3545', fontWeight: 700, fontFamily: 'monospace' }}>{Number(r.debit) > 0 ? `₹${fmt2(r.debit)}` : '—'}</td>
                  <td style={{ ...tdSt, textAlign: 'right', color: '#28a745', fontWeight: 700, fontFamily: 'monospace' }}>{Number(r.credit) > 0 ? `₹${fmt2(r.credit)}` : '—'}</td>
                  <td style={{ ...tdSt, color: '#888', fontSize: 11 }}>{r.remark || r.description || '—'}</td>
                  <td style={{ ...tdSt }}>
                    <button onClick={() => alert(`ID: ${r.id}`)} style={{ padding: '3px 10px', background: '#17a2b820', color: '#17a2b8', border: '1px solid #17a2b840', borderRadius: 3, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>View</button>
                  </td>
                </tr>
              ))}
              {paged.length > 0 && (
                <tr style={{ background: '#12122a', borderTop: '2px solid #333' }}>
                  <td colSpan={2} style={{ ...tdSt, fontWeight: 800, color: '#fff' }}>TOTALS ({filtered.length})</td>
                  <td style={{ ...tdSt, textAlign: 'right', fontWeight: 800, color: '#dc3545', fontFamily: 'monospace' }}>₹{fmt2(totals.debit)}</td>
                  <td style={{ ...tdSt, textAlign: 'right', fontWeight: 800, color: '#28a745', fontFamily: 'monospace' }}>₹{fmt2(totals.credit)}</td>
                  <td colSpan={2} style={tdSt} />
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, flexWrap: 'wrap', gap: 8 }}>
          <span style={{ color: C.muted, fontSize: 12 }}>Showing {paged.length === 0 ? 0 : (page - 1) * (perPage || filtered.length) + 1}–{Math.min(page * (perPage || filtered.length), filtered.length)} of {filtered.length} entries</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '5px 14px', background: page === 1 ? '#1a1a2e' : '#252535', color: page === 1 ? '#555' : '#aaa', border: `1px solid ${C.border}`, borderRadius: 4, cursor: page === 1 ? 'default' : 'pointer', fontSize: 12 }}>Previous</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, k) => { const pg = Math.max(1, Math.min(page - 2, totalPages - 4)) + k; return pg <= totalPages ? <button key={pg} onClick={() => setPage(pg)} style={{ padding: '5px 10px', background: pg === page ? C.brand : '#252535', color: pg === page ? '#000' : '#aaa', border: `1px solid ${C.border}`, borderRadius: 4, cursor: 'pointer', fontWeight: pg === page ? 800 : 400, fontSize: 12 }}>{pg}</button> : null; })}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '5px 14px', background: page === totalPages ? '#1a1a2e' : '#252535', color: page === totalPages ? '#555' : '#aaa', border: `1px solid ${C.border}`, borderRadius: 4, cursor: page === totalPages ? 'default' : 'pointer', fontSize: 12 }}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
