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

const MARKETS = ['NSEFUT', 'NSEOPTION', 'MCXFUT', 'MCXOPTION', 'BSEFUT', 'BSEOPTION'];

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

export default function RejectionLogPage() {
  /* filters */
  const [marketF,  setMarketF]  = useState('');
  const [scriptF,  setScriptF]  = useState('');
  const [masterF,  setMasterF]  = useState('');
  const [clientF,  setClientF]  = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate,   setToDate]   = useState('');

  /* dropdown data */
  const [scripts, setScripts] = useState([]);
  const [masters, setMasters] = useState([]);
  const [clients, setClients] = useState([]);

  /* table */
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(false);
  const [search,  setSearch]  = useState('');
  const [perPage, setPerPage] = useState(10);
  const [page,    setPage]    = useState(1);

  useEffect(() => {
    api.get('/scripts').then(r => setScripts(r.data.scripts || [])).catch(() => {});
    api.get('/admin/masters').then(r => setMasters(r.data.masters || [])).catch(() => {});
    api.get('/admin/students', { params: { role: 'user' } }).then(r => setClients(r.data.students || [])).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (fromDate) params.start_date = fromDate;
      if (toDate)   params.end_date   = toDate;
      if (scriptF)  params.script_id  = scriptF;
      if (marketF)  params.exchange   = marketF;
      if (masterF)  params.master_id  = masterF;
      if (clientF)  params.user_id    = clientF;

      // Try logs endpoint first, fallback to rejections endpoint
      let list = [];
      try {
        const { data } = await api.get('/admin/logs/rejections', { params });
        list = data.logs || [];
      } catch {
        const { data } = await api.get('/admin/rejections', { params });
        list = data.rejections || [];
      }
      setRows(list);
      setPage(1);
    } catch { setRows([]); } finally { setLoading(false); }
  }, [fromDate, toDate, scriptF, marketF, masterF, clientF]);

  const clearFilter = () => {
    setMarketF(''); setScriptF(''); setMasterF(''); setClientF('');
    setFromDate(''); setToDate(''); setRows([]);
  };

  /* search */
  const filtered = rows.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (r.username || r.user_name || '').toLowerCase().includes(q)
      || (r.script || r.script_name || '').toLowerCase().includes(q)
      || (r.rejection_reason || r.reason || '').toLowerCase().includes(q);
  });

  const totalPages = Math.ceil(filtered.length / (perPage || filtered.length)) || 1;
  const paged = perPage === 0 ? filtered : filtered.slice((page - 1) * perPage, page * perPage);

  /* CSV */
  const exportCSV = () => {
    const cols = ['ACTION', 'DATE', 'CLIENT', 'SCRIPT', 'TYPE', 'LOT', 'QTY', 'RATE', 'REJECTION REASON'];
    const data = filtered.map(r => [
      r.action || 'REJECT', r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN') : '—',
      r.username || r.user_name || '—', r.script || r.script_name || '—',
      r.trade_type || '—', r.lot_size || '—', r.quantity || '—',
      r.price || '—', r.rejection_reason || r.reason || '—',
    ]);
    const csv = [cols, ...data].map(row => row.join(',')).join('\n');
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: 'rejection_log.csv' });
    a.click();
  };

  return (
    <div style={{ background: C.bg, minHeight: '100%', color: C.text, fontFamily: 'var(--font-sans, Inter, sans-serif)' }}>
      {/* Header */}
      <div style={{ padding: '13px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontWeight: 800, fontSize: 18, color: '#fff' }}>Rejection Log</div>
        {rows.length > 0 && <span style={{ background: '#dc354520', color: '#dc3545', border: '1px solid #dc354535', borderRadius: 20, padding: '2px 12px', fontSize: 11, fontWeight: 700 }}>{rows.length} rejections</span>}
      </div>

      <div style={{ padding: '14px 20px' }}>

        {/* ══ FILTER ROW 1: SELECT MARKET / SCRIPT / MASTER / CLIENT / FROM DATE / TO DATE ══ */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: '14px 16px', marginBottom: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto 1fr auto 1fr auto 1fr auto 1fr auto 1fr', alignItems: 'center', gap: '10px 8px', marginBottom: 12 }}>

            <span style={lblSt}>SELECT MARKET</span>
            <Sel value={marketF} onChange={setMarketF} placeholder="Select Market" minWidth={130}>
              {MARKETS.map(m => <option key={m}>{m}</option>)}
            </Sel>

            <span style={lblSt}>SELECT SCRIPT</span>
            <Sel value={scriptF} onChange={setScriptF} placeholder="Select Scri..." minWidth={140}>
              {scripts.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
            </Sel>

            <span style={lblSt}>SELECT MASTER</span>
            <Sel value={masterF} onChange={setMasterF} placeholder="Select Ma..." minWidth={140}>
              {masters.map(m => <option key={m.id} value={String(m.id)}>{m.full_name || m.username} ({m.username})</option>)}
            </Sel>

            <span style={lblSt}>SELECT CLIENT</span>
            <Sel value={clientF} onChange={setClientF} placeholder="Select Clie..." minWidth={140}>
              {clients.map(c => <option key={c.id} value={String(c.id)}>{c.full_name || c.username} ({c.username})</option>)}
            </Sel>

            <span style={lblSt}>FROM DATE</span>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={{ ...inp, minWidth: 150 }} />

            <span style={lblSt}>TO DATE</span>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={{ ...inp, minWidth: 150 }} />
          </div>

          {/* FIND LOGS */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={load} disabled={loading}
              style={{ padding: '8px 28px', background: '#1a1a1a', color: '#fff', border: '2px solid #444', borderRadius: 4, fontWeight: 800, fontSize: 13, cursor: 'pointer', letterSpacing: '0.04em' }}>
              {loading ? 'LOADING…' : 'FIND LOGS'}
            </button>
            {filtered.length > 0 && (
              <button onClick={exportCSV}
                style={{ padding: '8px 18px', background: C.brand, color: '#000', border: 'none', borderRadius: 4, fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                CSV
              </button>
            )}
            <button onClick={clearFilter}
              style={{ padding: '8px 18px', background: '#555', color: '#ddd', border: 'none', borderRadius: 4, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              CLEAR
            </button>
          </div>
        </div>

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
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: C.muted, fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>SEARCH:</span>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{ ...inp, width: 200, border: '1px solid #555' }} />
          </div>
        </div>

        {/* ══ TABLE ══ */}
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
              <thead>
                <tr>
                  {[
                    { label: 'ACTION ↕',          align: 'left' },
                    { label: 'DATE ↕',             align: 'left' },
                    { label: 'CLIENT ↕',           align: 'left' },
                    { label: 'SCRIPT ↕',           align: 'left' },
                    { label: 'TYPE ↕',             align: 'center' },
                    { label: 'LOT ↕',              align: 'right' },
                    { label: 'QTY ↕',              align: 'right' },
                    { label: 'RATE',               align: 'right' },
                    { label: 'REJECTION REASON ↕', align: 'left' },
                  ].map(h => (
                    <th key={h.label} style={{ ...thSt, textAlign: h.align }}>{h.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} style={{ ...tdSt, textAlign: 'center', padding: 40, color: '#555' }}>Loading…</td></tr>
                ) : paged.length === 0 ? (
                  <tr><td colSpan={9} style={{ ...tdSt, textAlign: 'center', padding: 40, color: '#555' }}>No data available in table</td></tr>
                ) : paged.map((r, i) => (
                  <tr key={i}
                    onMouseEnter={e => e.currentTarget.style.background = C.trHover}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                    {/* ACTION */}
                    <td style={tdSt}>
                      <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 3, fontSize: 10, fontWeight: 800, background: '#3a1a1a', color: '#dc3545', border: '1px solid #dc354540', textTransform: 'uppercase' }}>
                        {r.action || 'REJECTED'}
                      </span>
                    </td>

                    {/* DATE */}
                    <td style={{ ...tdSt, color: '#aaa', fontFamily: 'monospace', fontSize: 11 }}>
                      {r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-') : '—'}
                    </td>

                    {/* CLIENT */}
                    <td style={tdSt}>
                      <div style={{ fontWeight: 700, color: '#fff' }}>{r.full_name || r.username || r.user_name || '—'}</div>
                      {(r.username || r.user_name) && r.full_name && <div style={{ fontSize: 10, color: '#888' }}>{r.username || r.user_name}</div>}
                    </td>

                    {/* SCRIPT */}
                    <td style={{ ...tdSt, color: '#17a2b8', fontWeight: 600 }}>
                      {r.script || r.script_name || '—'}
                    </td>

                    {/* TYPE */}
                    <td style={{ ...tdSt, textAlign: 'center', fontWeight: 800, color: (r.trade_type || '').toUpperCase() === 'BUY' ? '#28a745' : (r.trade_type || '').toUpperCase() === 'SELL' ? '#dc3545' : '#888' }}>
                      {r.trade_type || '—'}
                    </td>

                    {/* LOT */}
                    <td style={{ ...tdSt, textAlign: 'right', fontFamily: 'monospace', color: C.brand }}>
                      {r.lot_size || r.lots || '—'}
                    </td>

                    {/* QTY */}
                    <td style={{ ...tdSt, textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>
                      {r.quantity || r.qty || '—'}
                    </td>

                    {/* RATE */}
                    <td style={{ ...tdSt, textAlign: 'right', fontFamily: 'monospace', color: '#aaa' }}>
                      {r.price ? `₹${fmt2(r.price)}` : '—'}
                    </td>

                    {/* REJECTION REASON */}
                    <td style={{ ...tdSt, color: '#dc3545', maxWidth: 250 }}>
                      <div style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        title={r.rejection_reason || r.reason || '—'}>
                        {r.rejection_reason || r.reason || '—'}
                      </div>
                    </td>
                  </tr>
                ))}
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
            {Array.from({ length: Math.min(5, totalPages) }, (_, k) => {
              const pg = Math.max(1, Math.min(page - 2, totalPages - 4)) + k;
              return pg <= totalPages ? (
                <button key={pg} onClick={() => setPage(pg)}
                  style={{ padding: '5px 10px', background: pg === page ? '#dc3545' : '#252535', color: pg === page ? '#fff' : '#aaa', border: `1px solid ${C.border}`, borderRadius: 4, cursor: 'pointer', fontWeight: pg === page ? 800 : 400, fontSize: 12 }}>{pg}</button>
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
