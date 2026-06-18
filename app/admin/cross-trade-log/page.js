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
const thSt  = { padding: '9px 10px', fontSize: 10, fontWeight: 800, color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.07em', background: C.th, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' };
const tdSt  = { padding: '8px 10px', fontSize: 12, color: C.text, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' };

const fmt2  = n => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDT = v => v ? new Date(v).toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(/\//g, '-') : '—';

const MARKETS = ['NSEFUT', 'NSEOPTION', 'MCXFUT', 'MCXOPTION', 'BSEFUT', 'BSEOPTION'];
const VALANS  = ['VALAN 1', 'VALAN 2', 'VALAN 3', 'WEEKLY', 'MONTHLY'];

function Sel({ value, onChange, placeholder, children, minWidth = 130 }) {
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

export default function CrossTradeLogPage() {
  /* filters */
  const [marketF,  setMarketF]  = useState('');
  const [scriptF,  setScriptF]  = useState('');
  const [valanF,   setValanF]   = useState('');
  const [masterF,  setMasterF]  = useState('');
  const [brokerF,  setBrokerF]  = useState('');
  const [clientF,  setClientF]  = useState('');
  const [startDate,setStartDate]= useState('');
  const [endDate,  setEndDate]  = useState('');

  /* dropdown data */
  const [scripts, setScripts] = useState([]);
  const [masters, setMasters] = useState([]);
  const [brokers, setBrokers] = useState([]);
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
    api.get('/admin/brokers').then(r => setBrokers(r.data.brokers || [])).catch(() => {});
    api.get('/admin/students', { params: { role: 'user' } }).then(r => setClients(r.data.students || [])).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate)   params.end_date   = endDate;
      if (scriptF)   params.script_id  = scriptF;
      if (marketF)   params.exchange   = marketF;
      if (masterF)   params.master_id  = masterF;
      if (brokerF)   params.broker_id  = brokerF;
      if (clientF)   params.user_id    = clientF;
      const { data } = await api.get('/admin/logs/cross-trades', { params });
      setRows(data.logs || []);
      setPage(1);
    } catch { setRows([]); } finally { setLoading(false); }
  }, [startDate, endDate, scriptF, marketF, masterF, brokerF, clientF]);

  const clearFilter = () => {
    setMarketF(''); setScriptF(''); setValanF(''); setMasterF('');
    setBrokerF(''); setClientF(''); setStartDate(''); setEndDate('');
    setRows([]);
  };

  /* CSV export (GET CSV button) */
  const exportCSV = () => {
    const cols = ['SR NO', 'USER CODE', 'MASTER', 'SCRIPT', 'TRADE TYPE', 'TRADE RATE', 'TRADE LOT', 'TRADE QTY', 'TRADE AMOUNT', 'TRADE TIME'];
    const data = filtered.map((r, i) => [
      i + 1,
      r.username || r.user_code || '—',
      r.master_name || '—',
      r.script || r.script_name || '—',
      r.trade_type || '—',
      Number(r.price || r.rate || 0).toFixed(2),
      r.lot_size || '—',
      r.quantity || r.qty || '—',
      Number(r.total_value || (r.quantity * r.price) || 0).toFixed(2),
      r.created_at ? new Date(r.created_at).toLocaleString('en-IN') : '—',
    ]);
    const csv = [cols, ...data].map(row => row.join(',')).join('\n');
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: 'cross_trade_log.csv' });
    a.click();
  };

  /* search */
  const filtered = rows.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (r.username || r.user_code || '').toLowerCase().includes(q)
      || (r.script || r.script_name || '').toLowerCase().includes(q)
      || (r.master_name || '').toLowerCase().includes(q);
  });

  const totalPages = Math.ceil(filtered.length / (perPage || filtered.length)) || 1;
  const paged = perPage === 0 ? filtered : filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div style={{ background: C.bg, minHeight: '100%', color: C.text, fontFamily: 'var(--font-sans, Inter, sans-serif)' }}>
      {/* Header */}
      <div style={{ padding: '13px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontWeight: 800, fontSize: 18, color: '#fff' }}>Cross Trades</div>
        {rows.length > 0 && <span style={{ background: '#17a2b820', color: '#17a2b8', border: '1px solid #17a2b835', borderRadius: 20, padding: '2px 12px', fontSize: 11, fontWeight: 700 }}>{rows.length} trades</span>}
      </div>

      <div style={{ padding: '14px 20px' }}>

        {/* ══ FILTER ROW 1: SELECT MARKET / SCRIPT / VALAN / MASTER / BROKER / CLIENT ══ */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: '14px 16px', marginBottom: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 12 }}>
            <div>
              <div style={{ ...lblSt, marginBottom: 4 }}>SELECT MARKET</div>
              <Sel value={marketF} onChange={setMarketF} placeholder="Select..." minWidth={120}>
                {MARKETS.map(m => <option key={m}>{m}</option>)}
              </Sel>
            </div>
            <div>
              <div style={{ ...lblSt, marginBottom: 4 }}>SELECT SCRIPT</div>
              <Sel value={scriptF} onChange={setScriptF} placeholder="Select..." minWidth={120}>
                {scripts.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
              </Sel>
            </div>
            <div>
              <div style={{ ...lblSt, marginBottom: 4 }}>SELECT VALAN</div>
              <Sel value={valanF} onChange={setValanF} placeholder="Select..." minWidth={120}>
                {VALANS.map(v => <option key={v}>{v}</option>)}
              </Sel>
            </div>
            <div>
              <div style={{ ...lblSt, marginBottom: 4 }}>SELECT MASTER</div>
              <Sel value={masterF} onChange={setMasterF} placeholder="Select..." minWidth={120}>
                {masters.map(m => <option key={m.id} value={String(m.id)}>{m.full_name || m.username} ({m.username})</option>)}
              </Sel>
            </div>
            <div>
              <div style={{ ...lblSt, marginBottom: 4 }}>SELECT BROKER</div>
              <Sel value={brokerF} onChange={setBrokerF} placeholder="Select..." minWidth={120}>
                {brokers.map(b => <option key={b.id} value={String(b.id)}>{b.full_name || b.username} ({b.username})</option>)}
              </Sel>
            </div>
            <div>
              <div style={{ ...lblSt, marginBottom: 4 }}>SELECT CLIENT</div>
              <Sel value={clientF} onChange={setClientF} placeholder="" minWidth={120}>
                {clients.map(c => <option key={c.id} value={String(c.id)}>{c.full_name || c.username} ({c.username})</option>)}
              </Sel>
            </div>
          </div>

          {/* Row 2: START DATE / END DATE / GET DATA / GET CSV / CLEAR FILTER */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
            <div>
              <div style={{ ...lblSt, marginBottom: 4 }}>START DATE</div>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ ...inp, width: 160 }} />
            </div>
            <div>
              <div style={{ ...lblSt, marginBottom: 4 }}>END DATE</div>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ ...inp, width: 160 }} />
            </div>
            <button onClick={load} disabled={loading}
              style={{ padding: '8px 22px', background: '#1a1a1a', color: '#fff', border: '2px solid #444', borderRadius: 4, fontWeight: 800, fontSize: 13, cursor: 'pointer', letterSpacing: '0.04em', marginBottom: 1 }}>
              {loading ? 'LOADING…' : 'GET DATA'}
            </button>
            <button onClick={exportCSV} disabled={filtered.length === 0}
              style={{ padding: '8px 22px', background: '#333', color: filtered.length > 0 ? '#fff' : '#666', border: '2px solid #444', borderRadius: 4, fontWeight: 800, fontSize: 13, cursor: filtered.length > 0 ? 'pointer' : 'default', letterSpacing: '0.04em', marginBottom: 1 }}>
              GET CSV
            </button>
            <button onClick={clearFilter}
              style={{ padding: '8px 18px', background: '#555', color: '#ddd', border: 'none', borderRadius: 4, fontWeight: 700, fontSize: 13, cursor: 'pointer', marginBottom: 1 }}>
              CLEAR FILTER
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
            <span style={{ color: C.muted, fontSize: 12, fontWeight: 700 }}>SEARCH:</span>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ ...inp, width: 200, border: '1px solid #555' }} />
          </div>
        </div>

        {/* ══ TABLE ══ */}
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
              <thead>
                <tr>
                  {['SR NO', 'USER CODE', 'MASTER', 'SCRIPT', 'TRADE TYPE', 'TRADE RATE', 'TRADE LOT', 'TRADE QTY', 'TRADE AMOUNT', 'TRADE TIME'].map(h => (
                    <th key={h} style={{ ...thSt, textAlign: ['TRADE RATE', 'TRADE LOT', 'TRADE QTY', 'TRADE AMOUNT'].includes(h) ? 'right' : 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={10} style={{ ...tdSt, textAlign: 'center', padding: 40, color: '#555' }}>Loading…</td></tr>
                ) : paged.length === 0 ? (
                  <tr><td colSpan={10} style={{ ...tdSt, textAlign: 'center', padding: 40, color: '#555' }}>No data available in table</td></tr>
                ) : paged.map((r, i) => (
                  <tr key={i}
                    onMouseEnter={e => e.currentTarget.style.background = C.trHover}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ ...tdSt, color: '#555', fontSize: 11 }}>{(page - 1) * (perPage || filtered.length) + i + 1}</td>
                    <td style={{ ...tdSt, fontWeight: 700, color: C.brand, fontFamily: 'monospace' }}>{r.username || r.user_code || '—'}</td>
                    <td style={{ ...tdSt, color: '#aaa' }}>{r.master_name || '—'}</td>
                    <td style={{ ...tdSt, color: '#17a2b8', fontWeight: 600 }}>{r.script || r.script_name || '—'}</td>
                    <td style={{ ...tdSt, fontWeight: 800, color: (r.trade_type || '').toUpperCase() === 'BUY' ? '#28a745' : (r.trade_type || '').toUpperCase() === 'SELL' ? '#dc3545' : '#888' }}>
                      {r.trade_type || '—'}
                    </td>
                    <td style={{ ...tdSt, textAlign: 'right', fontFamily: 'monospace', color: '#aaa' }}>
                      {r.price || r.rate ? `₹${fmt2(r.price || r.rate)}` : '—'}
                    </td>
                    <td style={{ ...tdSt, textAlign: 'right', fontFamily: 'monospace' }}>{r.lot_size || r.lots || '—'}</td>
                    <td style={{ ...tdSt, textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{r.quantity || r.qty || '—'}</td>
                    <td style={{ ...tdSt, textAlign: 'right', fontFamily: 'monospace', color: C.brand, fontWeight: 700 }}>
                      {r.total_value ? `₹${fmt2(r.total_value)}` : r.quantity && r.price ? `₹${fmt2(Number(r.quantity) * Number(r.price))}` : '—'}
                    </td>
                    <td style={{ ...tdSt, color: '#888', fontFamily: 'monospace', fontSize: 11 }}>{fmtDT(r.created_at || r.trade_time)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
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
                  style={{ padding: '5px 10px', background: pg === page ? '#17a2b8' : '#252535', color: pg === page ? '#fff' : '#aaa', border: `1px solid ${C.border}`, borderRadius: 4, cursor: 'pointer', fontWeight: pg === page ? 800 : 400, fontSize: 12 }}>{pg}</button>
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
