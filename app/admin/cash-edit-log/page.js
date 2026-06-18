'use client';

import { useState, useCallback, useEffect } from 'react';
import api from '@/lib/axios';

/* ─── AVADH11 style tokens ───────────────────────────────────── */
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
const inp  = { background: C.surface, border: `1px solid ${C.border}`, color: C.text, borderRadius: 4, padding: '7px 10px', fontSize: 12, outline: 'none', width: '100%' };
const arr  = { position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none', fontSize: 9 };
const lblSt = { fontSize: 11, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' };
const thSt  = { padding: '9px 10px', fontSize: 10, fontWeight: 800, color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.07em', background: C.th, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap', cursor: 'pointer' };
const tdSt  = { padding: '8px 10px', fontSize: 12, color: C.text, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' };

const fmt2  = n => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDT = v => v ? new Date(v).toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(/\//g, '-') : '—';

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

export default function CashEditLogPage() {
  /* checkboxes */
  const [showUpdate, setShowUpdate] = useState(true);
  const [showDelete, setShowDelete] = useState(true);

  /* filters */
  const [masterF,   setMasterF]   = useState('');
  const [clientF,   setClientF]   = useState('');
  const [fromDate,  setFromDate]  = useState('');
  const [toDate,    setToDate]    = useState('');

  /* dropdown data */
  const [masters, setMasters] = useState([]);
  const [clients, setClients] = useState([]);

  /* table */
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(false);
  const [search,  setSearch]  = useState('');
  const [perPage, setPerPage] = useState(10);
  const [page,    setPage]    = useState(1);

  useEffect(() => {
    api.get('/admin/masters').then(r => setMasters(r.data.masters || [])).catch(() => {});
    api.get('/admin/students', { params: { role: 'user' } }).then(r => setClients(r.data.students || [])).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (fromDate) params.start_date = fromDate;
      if (toDate)   params.end_date   = toDate;
      if (clientF)  params.user_id    = clientF;
      if (masterF)  params.master_id  = masterF;
      const { data } = await api.get('/admin/logs/cash', { params });
      let list = data.logs || [];
      // action filter
      list = list.filter(r => {
        const act = (r.action || r.type || '').toUpperCase();
        if (act.includes('DELETE')) return showDelete;
        return showUpdate;
      });
      setRows(list);
      setPage(1);
    } catch { setRows([]); } finally { setLoading(false); }
  }, [fromDate, toDate, clientF, masterF, showUpdate, showDelete]);

  const clearFilter = () => {
    setMasterF(''); setClientF(''); setFromDate(''); setToDate('');
    setShowUpdate(true); setShowDelete(true); setRows([]);
  };

  /* search */
  const filtered = rows.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (r.username || '').toLowerCase().includes(q)
      || (r.full_name || '').toLowerCase().includes(q)
      || (r.description || '').toLowerCase().includes(q);
  });

  const totalPages = Math.ceil(filtered.length / (perPage || filtered.length)) || 1;
  const paged = perPage === 0 ? filtered : filtered.slice((page - 1) * perPage, page * perPage);

  /* totals */
  const totals = filtered.reduce((a, r) => ({
    debit:  a.debit  + Number(r.debit  || 0),
    credit: a.credit + Number(r.credit || 0),
  }), { debit: 0, credit: 0 });

  /* CSV */
  const exportCSV = () => {
    const cols = ['Action', 'Client', 'Date', 'Debit', 'Credit', 'Changed By', 'IP Address', 'Changed Date Time'];
    const data = filtered.map(r => [r.action || r.type, r.username, r.logged_at ? new Date(r.logged_at).toLocaleDateString('en-IN') : '—', Number(r.debit || 0).toFixed(2), Number(r.credit || 0).toFixed(2), r.admin_name || '—', r.ip_address || '—', fmtDT(r.logged_at)]);
    const csv = [cols, ...data].map(row => row.join(',')).join('\n');
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: 'cash_edit_log.csv' });
    a.click();
  };

  return (
    <div style={{ background: C.bg, minHeight: '100%', color: C.text, fontFamily: 'var(--font-sans, Inter, sans-serif)' }}>
      {/* Header */}
      <div style={{ padding: '13px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontWeight: 800, fontSize: 18, color: '#fff' }}>Cash Edit/Delete Log</div>
        {rows.length > 0 && <span style={{ background: '#28a74520', color: '#28a745', border: '1px solid #28a74535', borderRadius: 20, padding: '2px 12px', fontSize: 11, fontWeight: 700 }}>{rows.length} records</span>}
      </div>

      <div style={{ padding: '14px 20px' }}>

        {/* ══ FILTER PANEL ══ */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: '14px 16px', marginBottom: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto auto 1fr 1fr 1fr 1fr auto', alignItems: 'center', gap: '12px 14px' }}>

            {/* UPDATE + DELETE checkboxes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 12, fontWeight: 800, color: showUpdate ? '#ffc107' : '#555' }}>
                <input type="checkbox" checked={showUpdate} onChange={e => setShowUpdate(e.target.checked)}
                  style={{ width: 15, height: 15, accentColor: '#ffc107', cursor: 'pointer' }} />
                UPDATE
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 12, fontWeight: 800, color: showDelete ? '#dc3545' : '#555' }}>
                <input type="checkbox" checked={showDelete} onChange={e => setShowDelete(e.target.checked)}
                  style={{ width: 15, height: 15, accentColor: '#dc3545', cursor: 'pointer' }} />
                DELETE
              </label>
            </div>

            {/* spacer */}
            <div />

            {/* SELECT MASTER */}
            <div>
              <div style={{ ...lblSt, marginBottom: 4 }}>SELECT MASTER</div>
              <Sel value={masterF} onChange={setMasterF} placeholder="Select Ma..." minWidth={150}>
                {masters.map(m => <option key={m.id} value={String(m.id)}>{m.full_name || m.username} ({m.username})</option>)}
              </Sel>
            </div>

            {/* SELECT CLIENT */}
            <div>
              <div style={{ ...lblSt, marginBottom: 4 }}>SELECT CLIENT</div>
              <Sel value={clientF} onChange={setClientF} placeholder="Select Clie..." minWidth={150}>
                {clients.map(c => <option key={c.id} value={String(c.id)}>{c.full_name || c.username} ({c.username})</option>)}
              </Sel>
            </div>

            {/* FROM DATE */}
            <div>
              <div style={{ ...lblSt, marginBottom: 4 }}>FROM DATE</div>
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={{ ...inp, minWidth: 150 }} />
            </div>

            {/* TO DATE */}
            <div>
              <div style={{ ...lblSt, marginBottom: 4 }}>TO DATE</div>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={{ ...inp, minWidth: 150 }} />
            </div>

            {/* FIND LOGS button */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, justifyContent: 'flex-end' }}>
              <button onClick={load} disabled={loading}
                style={{ padding: '8px 22px', background: '#1a1a1a', color: '#fff', border: '2px solid #444', borderRadius: 4, fontWeight: 800, fontSize: 13, cursor: 'pointer', letterSpacing: '0.04em' }}>
                {loading ? 'LOADING…' : 'FIND LOGS'}
              </button>
              <button onClick={clearFilter}
                style={{ padding: '6px 14px', background: '#555', color: '#ddd', border: 'none', borderRadius: 4, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                CLEAR
              </button>
            </div>
          </div>
        </div>

        {/* ══ SUMMARY CARDS ══ */}
        {rows.length > 0 && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            {[
              { label: 'Total Records', val: rows.length,    fmt: v => v,             color: '#17a2b8' },
              { label: 'Total Credit',  val: totals.credit,  fmt: v => `₹${fmt2(v)}`, color: '#28a745' },
              { label: 'Total Debit',   val: totals.debit,   fmt: v => `₹${fmt2(v)}`, color: '#dc3545' },
              { label: 'Net Flow',      val: totals.credit - totals.debit, fmt: v => `₹${fmt2(Math.abs(v))}`, color: (totals.credit - totals.debit) >= 0 ? '#28a745' : '#dc3545' },
            ].map(c => (
              <div key={c.label} style={{ background: C.surface, border: `1px solid ${c.color}25`, borderRadius: 6, padding: '10px 18px', flex: 1, minWidth: 120 }}>
                <div style={{ fontSize: 9, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>{c.label}</div>
                <div style={{ fontWeight: 800, color: c.color, fontFamily: 'var(--font-mono)', fontSize: 14 }}>{c.fmt(c.val)}</div>
              </div>
            ))}
          </div>
        )}

        {/* ══ TABLE TOOLBAR ══ */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: C.muted, fontSize: 12 }}>SHOW</span>
            <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }}
              style={{ ...inp, width: 70 }}>
              {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
              <option value={0}>All</option>
            </select>
            <span style={{ color: C.muted, fontSize: 12 }}>ENTRIES</span>
            {filtered.length > 0 && <button onClick={exportCSV} style={{ padding: '5px 14px', background: C.brand, color: '#000', border: 'none', borderRadius: 4, fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>CSV</button>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: C.muted, fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>SEARCH:</span>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ ...inp, width: 200, border: '1px solid #555' }} />
          </div>
        </div>

        {/* ══ TABLE ══ */}
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
              <thead>
                <tr>
                  {['ACTION ↕', 'CLIENT ↕', 'DATE ↕', 'DEBIT', 'CREDIT', 'CHANGED BY', 'IP ADDRESS', 'CHANGED DATE TIME ↕'].map((h, i) => (
                    <th key={h} style={{ ...thSt, textAlign: ['DEBIT', 'CREDIT'].includes(h) ? 'right' : 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} style={{ ...tdSt, textAlign: 'center', padding: 30, color: '#888' }}>
                      <div style={{ marginBottom: 6, color: '#aaa', fontWeight: 600 }}>Processing...</div>
                      <div style={{ color: '#555', fontSize: 12 }}>Loading data...</div>
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr><td colSpan={8} style={{ ...tdSt, textAlign: 'center', padding: 40, color: '#555' }}>No data available in table</td></tr>
                ) : paged.map((r, i) => {
                  const act = (r.action || r.type || '').toUpperCase();
                  const isDel = act.includes('DELETE');
                  return (
                    <tr key={i}
                      onMouseEnter={e => e.currentTarget.style.background = C.trHover}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                      {/* ACTION */}
                      <td style={tdSt}>
                        <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 3, fontSize: 10, fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase',
                          background: isDel ? '#3a1a1a' : '#1a2a1a',
                          color: isDel ? '#dc3545' : '#28a745',
                          border: `1px solid ${isDel ? '#dc354540' : '#28a74540'}`,
                        }}>
                          {r.action || r.type || '—'}
                        </span>
                      </td>

                      {/* CLIENT */}
                      <td style={tdSt}>
                        <div style={{ fontWeight: 700, color: '#fff' }}>{r.full_name || r.username || '—'}</div>
                        {r.username && <div style={{ fontSize: 10, color: '#888' }}>{r.username}</div>}
                      </td>

                      {/* DATE */}
                      <td style={{ ...tdSt, color: '#aaa', fontFamily: 'monospace', fontSize: 11 }}>
                        {r.logged_at ? new Date(r.logged_at).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-') : '—'}
                      </td>

                      {/* DEBIT */}
                      <td style={{ ...tdSt, textAlign: 'right', fontFamily: 'var(--font-mono)', color: Number(r.debit) > 0 ? '#dc3545' : '#444', fontWeight: Number(r.debit) > 0 ? 700 : 400 }}>
                        {Number(r.debit) > 0 ? `₹${fmt2(r.debit)}` : '—'}
                      </td>

                      {/* CREDIT */}
                      <td style={{ ...tdSt, textAlign: 'right', fontFamily: 'var(--font-mono)', color: Number(r.credit) > 0 ? '#28a745' : '#444', fontWeight: Number(r.credit) > 0 ? 700 : 400 }}>
                        {Number(r.credit) > 0 ? `₹${fmt2(r.credit)}` : '—'}
                      </td>

                      {/* CHANGED BY */}
                      <td style={{ ...tdSt, color: '#6f42c1', fontWeight: 700, fontSize: 11 }}>
                        {r.admin_name || r.changed_by || '—'}
                      </td>

                      {/* IP ADDRESS */}
                      <td style={{ ...tdSt, color: '#888', fontFamily: 'monospace', fontSize: 11 }}>
                        {r.ip_address || '—'}
                      </td>

                      {/* CHANGED DATE TIME */}
                      <td style={{ ...tdSt, color: '#888', fontFamily: 'monospace', fontSize: 11 }}>
                        {fmtDT(r.logged_at || r.created_at)}
                      </td>
                    </tr>
                  );
                })}

                {/* Totals row */}
                {paged.length > 0 && (
                  <tr style={{ background: '#12122a', borderTop: '2px solid #333' }}>
                    <td colSpan={3} style={{ ...tdSt, fontWeight: 800, color: '#fff', fontSize: 11 }}>TOTALS ({filtered.length})</td>
                    <td style={{ ...tdSt, textAlign: 'right', fontWeight: 800, color: '#dc3545', fontFamily: 'var(--font-mono)' }}>₹{fmt2(totals.debit)}</td>
                    <td style={{ ...tdSt, textAlign: 'right', fontWeight: 800, color: '#28a745', fontFamily: 'var(--font-mono)' }}>₹{fmt2(totals.credit)}</td>
                    <td colSpan={3} style={tdSt} />
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
              style={{ padding: '5px 14px', background: page === 1 ? '#1a1a2e' : '#252535', color: page === 1 ? '#555' : '#aaa', border: `1px solid ${C.border}`, borderRadius: 4, cursor: page === 1 ? 'default' : 'pointer', fontSize: 12 }}>Previous</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pg = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              return pg <= totalPages ? (
                <button key={pg} onClick={() => setPage(pg)}
                  style={{ padding: '5px 10px', background: pg === page ? '#28a745' : '#252535', color: pg === page ? '#fff' : '#aaa', border: `1px solid ${C.border}`, borderRadius: 4, cursor: 'pointer', fontWeight: pg === page ? 800 : 400, fontSize: 12 }}>
                  {pg}
                </button>
              ) : null;
            })}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ padding: '5px 14px', background: page === totalPages ? '#1a1a2e' : '#252535', color: page === totalPages ? '#555' : '#aaa', border: `1px solid ${C.border}`, borderRadius: 4, cursor: page === totalPages ? 'default' : 'pointer', fontSize: 12 }}>Next</button>
          </div>
        </div>

      </div>
    </div>
  );
}
