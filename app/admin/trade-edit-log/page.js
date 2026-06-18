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

const fmtDT = v => v ? new Date(v).toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—';
const fmt2  = n => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const MARKETS = ['NSEFUT', 'NSEOPTION', 'MCXFUT', 'MCXOPTION', 'BSEFUT', 'BSEOPTION'];

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

export default function TradeEditLogPage() {
  /* filter checkboxes */
  const [showUpdate, setShowUpdate] = useState(true);
  const [showDelete, setShowDelete] = useState(true);
  const [showAdminOnly, setShowAdminOnly] = useState(false);

  /* filter dropdowns */
  const [segmentF,  setSegmentF]  = useState('');
  const [scriptF,   setScriptF]   = useState('');
  const [masterF,   setMasterF]   = useState('');
  const [clientF,   setClientF]   = useState('');
  const [fromDate,  setFromDate]  = useState('');
  const [toDate,    setToDate]    = useState('');

  /* dropdown data */
  const [scripts,  setScripts]  = useState([]);
  const [masters,  setMasters]  = useState([]);
  const [clients,  setClients]  = useState([]);

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
      if (clientF)  params.user_id    = clientF;
      if (masterF)  params.master_id  = masterF;
      if (scriptF)  params.script_id  = scriptF;
      if (segmentF) params.exchange   = segmentF;
      // filter by action type
      const actions = [];
      if (showUpdate) actions.push('EDIT', 'UPDATE');
      if (showDelete) actions.push('DELETE');
      if (actions.length < 3 && actions.length > 0) params.action = actions[0]; // API filter

      const { data } = await api.get('/admin/logs/trade-edit', { params });
      let list = data.logs || [];

      // client-side action filter
      list = list.filter(r => {
        const act = (r.action || '').toUpperCase();
        if (act.includes('DELETE')) return showDelete;
        return showUpdate; // EDIT/UPDATE/CREATE
      });

      // admin only filter
      if (showAdminOnly) list = list.filter(r => r.admin_name || r.by_admin);

      setRows(list);
      setPage(1);
    } catch { setRows([]); } finally { setLoading(false); }
  }, [fromDate, toDate, clientF, masterF, scriptF, segmentF, showUpdate, showDelete, showAdminOnly]);

  const clearFilter = () => {
    setSegmentF(''); setScriptF(''); setMasterF(''); setClientF('');
    setFromDate(''); setToDate('');
    setShowUpdate(true); setShowDelete(true); setShowAdminOnly(false);
    setRows([]);
  };

  /* filter by search */
  const filtered = rows.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (r.user_name || '').toLowerCase().includes(q)
      || (r.script || '').toLowerCase().includes(q)
      || (r.action || '').toLowerCase().includes(q);
  });

  const totalPages = Math.ceil(filtered.length / (perPage || filtered.length)) || 1;
  const paged = perPage === 0 ? filtered : filtered.slice((page - 1) * perPage, page * perPage);

  /* CSV export */
  const exportCSV = () => {
    const cols = ['Action', 'Client', 'Script', 'Type', 'Lot', 'Qty', 'Rate', 'User', 'Add Time'];
    const data = filtered.map(r => [r.action, r.user_name, r.script, r.trade_type, r.lot_size || '—', r.quantity, r.price, r.admin_name || r.user_name, r.logged_at ? new Date(r.logged_at).toLocaleString('en-IN') : '—']);
    const csv = [cols, ...data].map(row => row.join(',')).join('\n');
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: 'trade_edit_log.csv' });
    a.click();
  };

  const actionStyle = (v) => {
    const u = (v || '').toUpperCase();
    if (u.includes('DELETE')) return { color: '#dc3545', fontWeight: 800 };
    if (u.includes('EDIT') || u.includes('UPDATE')) return { color: '#ffc107', fontWeight: 800 };
    return { color: '#28a745', fontWeight: 800 };
  };

  return (
    <div style={{ background: C.bg, minHeight: '100%', color: C.text, fontFamily: 'var(--font-sans, Inter, sans-serif)' }}>
      {/* Header */}
      <div style={{ padding: '13px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontWeight: 800, fontSize: 18, color: '#fff' }}>Trade Edit/Delete Log</div>
        {rows.length > 0 && <span style={{ background: '#ffc10720', color: '#ffc107', border: '1px solid #ffc10735', borderRadius: 20, padding: '2px 12px', fontSize: 11, fontWeight: 700 }}>{rows.length} records</span>}
      </div>

      <div style={{ padding: '14px 20px' }}>

        {/* ══ FILTER PANEL ══ */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: '14px 16px', marginBottom: 14 }}>

          {/* Row 1: UPDATE/DELETE checkboxes + SEGMENT + SELECT SCRIPT + SELECT MASTER + SELECT CLIENT + FROM DATE */}
          <div style={{ display: 'grid', gridTemplateColumns: 'auto auto 1fr auto 1fr auto 1fr auto 1fr auto 1fr', alignItems: 'center', gap: '10px 10px', marginBottom: 12 }}>

            {/* UPDATE + DELETE checkboxes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: showUpdate ? '#ffc107' : '#888' }}>
                <input type="checkbox" checked={showUpdate} onChange={e => setShowUpdate(e.target.checked)}
                  style={{ width: 14, height: 14, accentColor: '#ffc107', cursor: 'pointer' }} />
                UPDATE
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: showDelete ? '#dc3545' : '#888' }}>
                <input type="checkbox" checked={showDelete} onChange={e => setShowDelete(e.target.checked)}
                  style={{ width: 14, height: 14, accentColor: '#dc3545', cursor: 'pointer' }} />
                DELETE
              </label>
            </div>

            {/* spacer */}
            <div />

            {/* SEGMENT */}
            <div>
              <div style={{ ...lblSt, marginBottom: 4 }}>SEGMENT</div>
              <Sel value={segmentF} onChange={setSegmentF} placeholder="Select Market" minWidth={140}>
                {MARKETS.map(m => <option key={m}>{m}</option>)}
              </Sel>
            </div>

            <div />

            {/* SELECT SCRIPT */}
            <div>
              <div style={{ ...lblSt, marginBottom: 4 }}>SELECT SCRIPT</div>
              <Sel value={scriptF} onChange={setScriptF} placeholder="Select Scri..." minWidth={150}>
                {scripts.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
              </Sel>
            </div>

            <div />

            {/* SELECT MASTER */}
            <div>
              <div style={{ ...lblSt, marginBottom: 4 }}>SELECT MASTER</div>
              <Sel value={masterF} onChange={setMasterF} placeholder="Select Ma..." minWidth={150}>
                {masters.map(m => <option key={m.id} value={String(m.id)}>{m.full_name || m.username} ({m.username})</option>)}
              </Sel>
            </div>

            <div />

            {/* SELECT CLIENT */}
            <div>
              <div style={{ ...lblSt, marginBottom: 4 }}>SELECT CLIENT</div>
              <Sel value={clientF} onChange={setClientF} placeholder="Select Clie..." minWidth={150}>
                {clients.map(c => <option key={c.id} value={String(c.id)}>{c.full_name || c.username} ({c.username})</option>)}
              </Sel>
            </div>

            <div />

            {/* FROM DATE */}
            <div>
              <div style={{ ...lblSt, marginBottom: 4 }}>FROM DATE</div>
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={{ ...inp, minWidth: 150 }} />
            </div>
          </div>

          {/* Row 2: TO DATE + SHOW ADMIN ONLY + FIND LOGS */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ ...lblSt, marginBottom: 4 }}>TO DATE</div>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={{ ...inp, width: 160 }} />
            </div>

            {/* SHOW ADMIN ONLY checkbox */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: showAdminOnly ? '#17a2b8' : '#888', paddingBottom: 4 }}>
              <div style={{ width: 18, height: 18, border: `2px solid ${showAdminOnly ? '#17a2b8' : '#555'}`, borderRadius: 3, background: showAdminOnly ? '#17a2b8' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                onClick={() => setShowAdminOnly(!showAdminOnly)}>
                {showAdminOnly && <span style={{ color: '#fff', fontSize: 11, lineHeight: 1 }}>✓</span>}
              </div>
              SHOW ADMIN ONLY
            </label>

            <button onClick={load} disabled={loading}
              style={{ padding: '8px 28px', background: '#1a1a1a', color: '#fff', border: '2px solid #444', borderRadius: 4, fontWeight: 800, fontSize: 13, cursor: 'pointer', letterSpacing: '0.05em', marginBottom: 1 }}>
              {loading ? 'LOADING…' : 'FIND LOGS'}
            </button>

            <button onClick={clearFilter}
              style={{ padding: '8px 18px', background: '#555', color: '#ddd', border: 'none', borderRadius: 4, fontWeight: 700, fontSize: 13, cursor: 'pointer', marginBottom: 1 }}>
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
            {filtered.length > 0 && (
              <button onClick={exportCSV}
                style={{ padding: '5px 14px', background: C.brand, color: '#000', border: 'none', borderRadius: 4, fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>
                CSV
              </button>
            )}
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
                    { label: 'ACTION ↕',   align: 'left' },
                    { label: 'CLIENT ↕',   align: 'left' },
                    { label: 'SCRIPT ↕',   align: 'left' },
                    { label: 'TYPE ↕',     align: 'center' },
                    { label: 'LOT',        align: 'right' },
                    { label: 'QTY ↕',     align: 'right' },
                    { label: 'RATE',       align: 'right' },
                    { label: 'USER',       align: 'left' },
                    { label: 'ADD TIME ↕', align: 'left' },
                  ].map(h => (
                    <th key={h.label} style={{ ...thSt, textAlign: h.align }}>{h.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} style={{ ...tdSt, textAlign: 'center', padding: 40, color: '#555' }}>Loading logs…</td></tr>
                ) : paged.length === 0 ? (
                  <tr><td colSpan={9} style={{ ...tdSt, textAlign: 'center', padding: 40, color: '#555' }}>No data available in table</td></tr>
                ) : paged.map((r, i) => {
                  const act = (r.action || '').toUpperCase();
                  return (
                    <tr key={i}
                      onMouseEnter={e => e.currentTarget.style.background = C.trHover}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                      {/* ACTION */}
                      <td style={tdSt}>
                        <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 3, fontSize: 11, fontWeight: 800, ...actionStyle(r.action),
                          background: act.includes('DELETE') ? '#3a1a1a' : act.includes('EDIT') || act.includes('UPDATE') ? '#2a2a0a' : '#1a2a1a',
                          border: `1px solid ${act.includes('DELETE') ? '#dc354540' : act.includes('EDIT') || act.includes('UPDATE') ? '#ffc10740' : '#28a74540'}`,
                        }}>
                          {r.action || '—'}
                        </span>
                      </td>

                      {/* CLIENT */}
                      <td style={tdSt}>
                        <div style={{ fontWeight: 700, color: '#fff' }}>{r.user_name || r.username || '—'}</div>
                      </td>

                      {/* SCRIPT */}
                      <td style={{ ...tdSt, color: '#17a2b8', fontWeight: 600 }}>
                        {r.script || r.script_name || '—'}
                      </td>

                      {/* TYPE */}
                      <td style={{ ...tdSt, textAlign: 'center' }}>
                        <span style={{ fontWeight: 800, fontSize: 11, color: (r.trade_type || '').toUpperCase() === 'BUY' ? '#28a745' : (r.trade_type || '').toUpperCase() === 'SELL' ? '#dc3545' : '#888' }}>
                          {r.trade_type || '—'}
                        </span>
                      </td>

                      {/* LOT */}
                      <td style={{ ...tdSt, textAlign: 'right', color: C.brand, fontFamily: 'var(--font-mono)' }}>
                        {r.lot_size || r.lots || '—'}
                      </td>

                      {/* QTY */}
                      <td style={{ ...tdSt, textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        {r.quantity || r.qty || '—'}
                      </td>

                      {/* RATE */}
                      <td style={{ ...tdSt, textAlign: 'right', fontFamily: 'var(--font-mono)', color: '#aaa' }}>
                        {r.price ? `₹${fmt2(r.price)}` : r.rate ? `₹${fmt2(r.rate)}` : '—'}
                      </td>

                      {/* USER (admin who did it) */}
                      <td style={{ ...tdSt, color: '#6f42c1', fontSize: 11, fontWeight: 700 }}>
                        {r.admin_name || r.by_admin || r.user_name || '—'}
                      </td>

                      {/* ADD TIME */}
                      <td style={{ ...tdSt, color: '#888', fontFamily: 'monospace', fontSize: 11 }}>
                        {fmtDT(r.logged_at || r.created_at)}
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
                  style={{ padding: '5px 10px', background: pg === page ? '#ffc107' : '#252535', color: pg === page ? '#000' : '#aaa', border: `1px solid ${C.border}`, borderRadius: 4, cursor: 'pointer', fontWeight: pg === page ? 800 : 400, fontSize: 12 }}>
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
    </div>
  );
}
