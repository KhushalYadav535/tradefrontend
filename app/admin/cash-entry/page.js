'use client';

import { useState, useCallback, useEffect } from 'react';
import api from '@/lib/axios';

const C = {
  bg: '#0f0f1a', surface: '#1a1a2e', border: '#252540',
  th: '#12122a', trHover: '#1e1e34', text: '#e0e0e0', muted: '#888', brand: '#f5a623',
};
const inp  = { background: C.surface, border: `1px solid ${C.border}`, color: C.text, borderRadius: 4, padding: '7px 10px', fontSize: 12, outline: 'none', width: '100%' };
const arr  = { position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none', fontSize: 9 };
const lblSt = { fontSize: 11, fontWeight: 800, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5, display: 'block' };
const thSt  = { padding: '9px 10px', fontSize: 10, fontWeight: 800, color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.07em', background: C.th, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap', cursor: 'pointer' };
const tdSt  = { padding: '8px 10px', fontSize: 12, color: C.text, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' };
const fmt2  = n => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const today = () => new Date().toISOString().split('T')[0];

function Sel({ value, onChange, placeholder, children, minWidth = 200 }) {
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

export default function CashEntryPage() {
  /* form */
  const [inNseeqt, setInNseeqt] = useState(false);
  const [userType, setUserType] = useState('');
  const [selectId, setSelectId] = useState('');
  const [date,     setDate]     = useState(today());
  const [toDate,   setToDate]   = useState(today());
  const [entryType,setEntryType]= useState('RECEIPT');
  const [amount,   setAmount]   = useState('');
  const [remarks,  setRemarks]  = useState('');
  const [users,    setUsers]    = useState([]);

  /* table */
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy,    setBusy]    = useState(false);
  const [search,  setSearch]  = useState('');
  const [perPage, setPerPage] = useState(10);
  const [page,    setPage]    = useState(1);
  const [toast,   setToast]   = useState(null);

  const showToast = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500); };

  useEffect(() => {
    if (userType) {
      api.get('/admin/students', { params: { role: userType } }).then(r => setUsers(r.data.students || [])).catch(() => {});
    } else { setUsers([]); }
  }, [userType]);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectId) params.user_id    = selectId;
      if (date)     params.start_date = date;
      if (toDate)   params.end_date   = toDate;
      const { data } = await api.get('/admin/accounts/cash-entries', { params });
      setRows(data.entries || []);
      setPage(1);
    } catch { setRows([]); } finally { setLoading(false); }
  }, [selectId, date, toDate]);

  const submit = async (e) => {
    e.preventDefault();
    if (!selectId) return showToast('Please select a user', false);
    if (!amount || Number(amount) <= 0) return showToast('Enter a valid amount', false);
    setBusy(true);
    try {
      await api.post('/admin/accounts/cash-entry', {
        user_id: Number(selectId), type: entryType,
        amount: Number(amount), remarks, in_nseeqt: inNseeqt,
      });
      showToast(`${entryType} of ₹${Number(amount).toLocaleString('en-IN')} added!`);
      setAmount(''); setRemarks('');
      loadEntries();
    } catch (err) { showToast(err.response?.data?.error || 'Failed', false); } finally { setBusy(false); }
  };

  const filtered = rows.filter(r => !search || (r.username || '').toLowerCase().includes(search.toLowerCase()) || (r.remarks || '').toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.ceil(filtered.length / (perPage || filtered.length)) || 1;
  const paged = perPage === 0 ? filtered : filtered.slice((page - 1) * perPage, page * perPage);

  const exportCSV = () => {
    const cols = ['Date', 'User', 'Type', 'Debit', 'Credit', 'Remarks'];
    const data = filtered.map(r => [r.entry_date || r.date, r.username, r.type, Number(r.debit || 0).toFixed(2), Number(r.credit || 0).toFixed(2), r.remarks || '']);
    const csv = [cols, ...data].map(row => row.join(',')).join('\n');
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: 'cash_entry.csv' });
    a.click();
  };

  return (
    <div style={{ background: C.bg, minHeight: '100%', color: C.text, fontFamily: 'var(--font-sans, Inter, sans-serif)' }}>
      {toast && <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, padding: '12px 20px', borderRadius: 6, fontWeight: 700, fontSize: 13, background: toast.ok ? '#28a745' : '#dc3545', color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>{toast.ok ? '✅ ' : '❌ '}{toast.msg}</div>}

      <div style={{ padding: '13px 20px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontWeight: 800, fontSize: 18, color: '#fff' }}>Payment</div>
      </div>

      <div style={{ padding: '16px 20px' }}>

        {/* ── Entry Form ── */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: 20, maxWidth: 650, marginBottom: 20 }}>
          <form onSubmit={submit}>
            {/* IN NSEEQT checkbox */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#aaa', marginBottom: 18 }}>
              <input type="checkbox" checked={inNseeqt} onChange={e => setInNseeqt(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: '#6f42c1', cursor: 'pointer' }} />
              IN NSEEQT
            </label>

            {/* USER TYPE */}
            <div style={{ marginBottom: 14 }}>
              <span style={lblSt}>USER TYPE</span>
              <Sel value={userType} onChange={v => { setUserType(v); setSelectId(''); }} placeholder="">
                <option value="user">User</option>
                <option value="master">Master</option>
                <option value="broker">Broker</option>
              </Sel>
            </div>

            {/* SELECT */}
            <div style={{ marginBottom: 14 }}>
              <span style={lblSt}>SELECT</span>
              <Sel value={selectId} onChange={setSelectId} placeholder="">
                {users.map(u => <option key={u.id} value={String(u.id)}>{u.full_name || u.username} ({u.username})</option>)}
              </Sel>
            </div>

            {/* DATE / TO DATE / SHOW ENTRIES */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <span style={lblSt}>DATE</span>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inp} />
              </div>
              <div style={{ flex: 1 }}>
                <span style={lblSt}>TO DATE</span>
                <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={inp} />
              </div>
              <button type="button" onClick={loadEntries} disabled={loading}
                style={{ padding: '8px 18px', background: '#6f42c1', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 800, fontSize: 12, cursor: 'pointer', marginBottom: 1 }}>
                SHOW ENTRIES
              </button>
            </div>

            {/* TYPE radios */}
            <div style={{ marginBottom: 14 }}>
              <span style={lblSt}>TYPE</span>
              <div style={{ display: 'flex', gap: 24 }}>
                {['RECEIPT', 'PAYMENT'].map(t => (
                  <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: entryType === t ? (t === 'RECEIPT' ? '#28a745' : '#dc3545') : '#888' }}>
                    <input type="radio" name="entryType" value={t} checked={entryType === t} onChange={() => setEntryType(t)} style={{ accentColor: t === 'RECEIPT' ? '#28a745' : '#dc3545', width: 16, height: 16 }} />
                    {t}
                  </label>
                ))}
              </div>
            </div>

            {/* AMOUNT */}
            <div style={{ marginBottom: 14 }}>
              <span style={lblSt}>AMOUNT</span>
              <input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} style={inp} />
            </div>

            {/* REMARKS */}
            <div style={{ marginBottom: 18 }}>
              <span style={lblSt}>REMARKS</span>
              <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={3} style={{ ...inp, resize: 'vertical', fontFamily: 'inherit' }} />
            </div>

            <button type="submit" disabled={busy}
              style={{ padding: '10px 28px', background: '#6f42c1', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 800, fontSize: 14, cursor: 'pointer', opacity: busy ? 0.7 : 1 }}>
              {busy ? '⏳ SUBMITTING…' : 'SUBMIT'}
            </button>
          </form>
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
              <button style={{ padding: '5px 16px', background: '#7b4f2e', color: '#fff', border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>PDF</button>
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
                {['DATE ↕', 'USER', 'TYPE', 'DEBIT', 'CREDIT', 'REMARKS', 'ACTION'].map(h => (
                  <th key={h} style={{ ...thSt, textAlign: ['DEBIT', 'CREDIT'].includes(h) ? 'right' : 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ ...tdSt, textAlign: 'center', padding: 40, color: '#555' }}>Loading…</td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={7} style={{ ...tdSt, textAlign: 'center', padding: 40, color: '#555' }}>No data available in table</td></tr>
              ) : paged.map((r, i) => (
                <tr key={i} onMouseEnter={e => e.currentTarget.style.background = C.trHover} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ ...tdSt, color: '#aaa', fontSize: 11 }}>{r.entry_date || r.date || '—'}</td>
                  <td style={{ ...tdSt, fontWeight: 700 }}>{r.username || r.full_name || '—'}</td>
                  <td style={{ ...tdSt }}><span style={{ fontWeight: 800, fontSize: 11, color: r.type === 'RECEIPT' ? '#28a745' : '#dc3545' }}>{r.type}</span></td>
                  <td style={{ ...tdSt, textAlign: 'right', color: '#dc3545', fontFamily: 'monospace' }}>{Number(r.debit) > 0 ? `₹${fmt2(r.debit)}` : '—'}</td>
                  <td style={{ ...tdSt, textAlign: 'right', color: '#28a745', fontFamily: 'monospace' }}>{Number(r.credit) > 0 ? `₹${fmt2(r.credit)}` : '—'}</td>
                  <td style={{ ...tdSt, color: '#888', fontSize: 11 }}>{r.remarks || '—'}</td>
                  <td style={{ ...tdSt }}>
                    <button style={{ padding: '3px 10px', background: '#dc354520', color: '#dc3545', border: '1px solid #dc354540', borderRadius: 3, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
          <span style={{ color: C.muted, fontSize: 12 }}>Showing {paged.length === 0 ? 0 : (page - 1) * (perPage || filtered.length) + 1}–{Math.min(page * (perPage || filtered.length), filtered.length)} of {filtered.length} entries</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '5px 14px', background: page === 1 ? '#1a1a2e' : '#252535', color: page === 1 ? '#555' : '#aaa', border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 12, cursor: page === 1 ? 'default' : 'pointer' }}>Previous</button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '5px 14px', background: page === totalPages ? '#1a1a2e' : '#252535', color: page === totalPages ? '#555' : '#aaa', border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 12, cursor: page === totalPages ? 'default' : 'pointer' }}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
