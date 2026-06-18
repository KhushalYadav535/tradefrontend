'use client';

import { useState, useCallback, useEffect } from 'react';

const arr = { position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none', fontSize: 9 };

function AccSel({ label, value, onChange, accounts, style }) {
  return (
    <div style={{ marginBottom: 14, ...style }}>
      <span style={{ fontSize: 11, fontWeight: 800, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5, display: 'block' }}>{label}</span>
      <div style={{ position: 'relative' }}>
        <select value={value} onChange={e => onChange(e.target.value)}
          style={{ background: '#1a1a2e', border: '1px solid #252540', color: '#e0e0e0', borderRadius: 4, padding: '7px 32px 7px 10px', fontSize: 12, outline: 'none', width: '100%', appearance: 'none', cursor: 'pointer' }}>
          <option value=""></option>
          {accounts.map(a => (
            <option key={a.id} value={String(a.id)}>{a.id} - {(a.full_name || a.username || '').toUpperCase()}</option>
          ))}
        </select>
        <span style={arr}>▼</span>
      </div>
    </div>
  );
}
import api from '@/lib/axios';

const C = {
  bg: '#0f0f1a', surface: '#1a1a2e', border: '#252540',
  th: '#12122a', trHover: '#1e1e34', text: '#e0e0e0', muted: '#888', brand: '#f5a623',
};
const inp  = { background: C.surface, border: `1px solid ${C.border}`, color: C.text, borderRadius: 4, padding: '7px 10px', fontSize: 12, outline: 'none', width: '100%' };
const lblSt = { fontSize: 11, fontWeight: 800, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5, display: 'block' };
const thSt  = { padding: '9px 10px', fontSize: 10, fontWeight: 800, color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.07em', background: C.th, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap', cursor: 'pointer' };
const tdSt  = { padding: '8px 10px', fontSize: 12, color: C.text, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' };
const fmt2  = n => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const today = () => new Date().toISOString().split('T')[0];

export default function JVPage() {
  /* accounts dropdown data */
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    // Load all account types and combine into one list
    const loadAll = async () => {
      try {
        const [u, m, b] = await Promise.allSettled([
          api.get('/admin/students', { params: { role: 'user' } }),
          api.get('/admin/masters'),
          api.get('/admin/brokers'),
        ]);
        const users   = u.status === 'fulfilled' ? (u.value.data.students || []) : [];
        const masters = m.status === 'fulfilled' ? (m.value.data.masters  || []) : [];
        const brokers = b.status === 'fulfilled' ? (b.value.data.brokers  || []) : [];
        // Combine all; suffix role for disambiguation
        const all = [
          ...masters.map(x => ({ ...x, full_name: `${x.full_name || x.username}` })),
          ...brokers.map(x => ({ ...x, full_name: `${x.full_name || x.username} BROKER` })),
          ...users.map(x => ({ ...x, full_name: `${x.full_name || x.username}` })),
        ];
        setAccounts(all);
      } catch {}
    };
    loadAll();
  }, []);

  /* form */
  const [fromAcc,  setFromAcc]  = useState('');
  const [toAcc,    setToAcc]    = useState('');
  const [date,     setDate]     = useState(today());
  const [toDate,   setToDate]   = useState(today());
  const [jvType,   setJvType]   = useState('RECEIPT');
  const [amount,   setAmount]   = useState('');
  const [remarks,  setRemarks]  = useState('');

  /* table */
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy,    setBusy]    = useState(false);
  const [search,  setSearch]  = useState('');
  const [perPage, setPerPage] = useState(0); // default All
  const [page,    setPage]    = useState(1);
  const [toast,   setToast]   = useState(null);

  const showToast = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500); };

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (date)   params.start_date = date;
      if (toDate) params.end_date   = toDate;
      const { data } = await api.get('/admin/accounts/jv', { params });
      setRows(data.jv || data.entries || []);
      setPage(1);
    } catch { setRows([]); } finally { setLoading(false); }
  }, [date, toDate]);

  const submit = async (e) => {
    e.preventDefault();
    if (!fromAcc) return showToast('Enter From Account', false);
    if (!toAcc)   return showToast('Enter To Account', false);
    if (!amount || Number(amount) <= 0) return showToast('Enter valid amount', false);
    setBusy(true);
    try {
      await api.post('/admin/accounts/jv', {
        from_account: fromAcc, to_account: toAcc,
        type: jvType, amount: Number(amount), remarks, date,
      });
      showToast('JV entry created!');
      setFromAcc(''); setToAcc(''); setAmount(''); setRemarks('');
      loadEntries();
    } catch (err) { showToast(err.response?.data?.error || 'Failed', false); } finally { setBusy(false); }
  };

  const filtered = rows.filter(r => !search || (r.from_account || '').toLowerCase().includes(search.toLowerCase()) || (r.to_account || '').toLowerCase().includes(search.toLowerCase()) || (r.remarks || '').toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.ceil(filtered.length / (perPage || filtered.length)) || 1;
  const paged = perPage === 0 ? filtered : filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div style={{ background: C.bg, minHeight: '100%', color: C.text, fontFamily: 'var(--font-sans, Inter, sans-serif)' }}>
      {toast && <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, padding: '12px 20px', borderRadius: 6, fontWeight: 700, fontSize: 13, background: toast.ok ? '#28a745' : '#dc3545', color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>{toast.ok ? '✅ ' : '❌ '}{toast.msg}</div>}

      <div style={{ padding: '13px 20px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontWeight: 800, fontSize: 18, color: '#fff' }}>JV</div>
      </div>

      <div style={{ padding: '16px 20px' }}>

        {/* ── JV Form ── */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: 20, maxWidth: 650, marginBottom: 20 }}>
          <form onSubmit={submit}>
            {/* FROM ACCOUNT — dropdown */}
            <AccSel label="FROM ACCOUNT" value={fromAcc} onChange={setFromAcc} accounts={accounts} />

            {/* TO ACCOUNT — dropdown */}
            <AccSel label="TO ACCOUNT" value={toAcc} onChange={setToAcc} accounts={accounts} />

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
                  <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: jvType === t ? (t === 'RECEIPT' ? '#28a745' : '#dc3545') : '#888' }}>
                    <input type="radio" name="jvType" value={t} checked={jvType === t} onChange={() => setJvType(t)} style={{ accentColor: t === 'RECEIPT' ? '#28a745' : '#dc3545', width: 16, height: 16 }} />
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
              <option value={0}>All</option>
              {[10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <span style={{ color: C.muted, fontSize: 12 }}>ENTRIES</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: C.muted, fontSize: 12, fontWeight: 700 }}>SEARCH:</span>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ ...inp, width: 200, border: '1px solid #555' }} />
          </div>
        </div>

        {/* ── Table ── */}
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
              <thead>
                <tr>
                  {['SR NO ↕', 'FROM ACCOUNT ↕', 'TO ACCOUNT ↕', 'DATE ↕', 'TYPE', 'DEBIT', 'CREDIT', 'REMARKS', 'ACTION'].map(h => (
                    <th key={h} style={{ ...thSt, textAlign: ['DEBIT', 'CREDIT'].includes(h) ? 'right' : 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} style={{ ...tdSt, textAlign: 'center', padding: 40, color: '#555' }}>Loading…</td></tr>
                ) : paged.length === 0 ? (
                  <tr><td colSpan={9} style={{ ...tdSt, textAlign: 'center', padding: 40, color: '#555' }}>No data available in table</td></tr>
                ) : paged.map((r, i) => (
                  <tr key={i} onMouseEnter={e => e.currentTarget.style.background = C.trHover} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ ...tdSt, color: '#555', fontSize: 11 }}>{i + 1}</td>
                    <td style={{ ...tdSt, fontWeight: 600, color: '#17a2b8' }}>{r.from_account || '—'}</td>
                    <td style={{ ...tdSt, fontWeight: 600, color: C.brand }}>{r.to_account || '—'}</td>
                    <td style={{ ...tdSt, color: '#aaa', fontSize: 11 }}>{r.date || r.entry_date || '—'}</td>
                    <td style={{ ...tdSt }}><span style={{ fontWeight: 800, fontSize: 11, color: r.type === 'RECEIPT' ? '#28a745' : '#dc3545' }}>{r.type || '—'}</span></td>
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
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
          <span style={{ color: C.muted, fontSize: 12 }}>Showing {paged.length === 0 ? 0 : 1}–{paged.length} of {filtered.length} entries</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '5px 14px', background: page === 1 ? '#1a1a2e' : '#252535', color: page === 1 ? '#555' : '#aaa', border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 12, cursor: page === 1 ? 'default' : 'pointer' }}>Previous</button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '5px 14px', background: page === totalPages ? '#1a1a2e' : '#252535', color: page === totalPages ? '#555' : '#aaa', border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 12, cursor: page === totalPages ? 'default' : 'pointer' }}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
