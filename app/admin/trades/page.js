'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';

/* ─── AVADH11 Tokens ───────────────────────────────────────────────────── */
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
const thSt = { padding: '9px 10px', fontSize: 10, fontWeight: 800, color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.07em', background: C.th, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap', cursor: 'pointer' };
const tdSt = { padding: '8px 10px', fontSize: 12, color: C.text, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' };
const lbl  = { fontSize: 10, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5, display: 'block' };

const fmt2 = n => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDT = d => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : '—';

const MARKETS = ['NSEFUT', 'NSEOPTION', 'MCXFUT', 'MCXOPTION', 'BSEFUT', 'BSEOPTION'];
const ORDER_TYPES = ['BUY', 'SELL', 'LIMIT BUY', 'LIMIT SELL', 'STOPLOSS BUY', 'STOPLOSS SELL'];

function Sel({ value, onChange, placeholder, children }) {
  return (
    <div style={{ position: 'relative' }}>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ ...inp, paddingRight: 28, appearance: 'none', cursor: 'pointer' }}>
        {placeholder && <option value="">{placeholder}</option>}
        {children}
      </select>
      <span style={arr}>▼</span>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    EXECUTED:  ['#28a74520', '#28a745', '#28a74540'],
    PENDING:   ['#ffc10720', '#ffc107', '#ffc10740'],
    REJECTED:  ['#dc354520', '#dc3545', '#dc354540'],
    CANCELLED: ['#6c757d20', '#6c757d', '#6c757d40'],
  };
  const [bg, color, border] = map[status] || ['#6c757d20', '#6c757d', '#6c757d40'];
  return (
    <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: 10, fontWeight: 800, background: bg, color, border: `1px solid ${border}` }}>
      {status}
    </span>
  );
}

export default function AdminTradesPage() {
  /* dropdown data */
  const [masters,  setMasters]  = useState([]);
  const [clients,  setClients]  = useState([]);
  const [brokers,  setBrokers]  = useState([]);
  const [scripts,  setScripts]  = useState([]);

  /* filters */
  const [fStatus,     setFStatus]     = useState('');  // '' | 'PENDING' | 'EXECUTED' | 'SHOW_ALL'
  const [fAfter,      setFAfter]      = useState('');
  const [fBefore,     setFBefore]     = useState('');
  const [fMarket,     setFMarket]     = useState('');
  const [fScript,     setFScript]     = useState('');
  const [fBroker,     setFBroker]     = useState('');
  const [fMaster,     setFMaster]     = useState('');
  const [fClient,     setFClient]     = useState('');
  const [fOrderType,  setFOrderType]  = useState('');

  /* table */
  const [trades,    setTrades]    = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [selected,  setSelected]  = useState(new Set());
  const [search,    setSearch]    = useState('');
  const [perPage,   setPerPage]   = useState(10);
  const [page,      setPage]      = useState(1);
  const [toast,     setToast]     = useState(null);

  const showToast = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3200); };

  /* Load dropdowns on mount */
  useEffect(() => {
    api.get('/admin/masters').then(r => setMasters(r.data.masters || [])).catch(() => {});
    api.get('/admin/students', { params: { role: 'user' } }).then(r => setClients(r.data.students || [])).catch(() => {});
    api.get('/admin/brokers').then(r => setBrokers(r.data.brokers || [])).catch(() => {});
    api.get('/scripts').then(r => setScripts(r.data.scripts || [])).catch(() => {});
    loadTrades({});
  }, []);

  /* Update clients when master changes */
  useEffect(() => {
    if (fMaster) {
      api.get('/admin/students', { params: { master_id: fMaster, role: 'user' } })
        .then(r => setClients(r.data.students || [])).catch(() => {});
    } else {
      api.get('/admin/students', { params: { role: 'user' } })
        .then(r => setClients(r.data.students || [])).catch(() => {});
    }
    setFClient('');
  }, [fMaster]);

  const loadTrades = useCallback(async (params) => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/all-trades', { params });
      setTrades(data.trades || []);
      setPage(1);
      setSelected(new Set());
    } catch { showToast('Failed to load trades', false); }
    finally { setLoading(false); }
  }, []);

  const findOrders = () => {
    const params = {};
    if (fStatus === 'PENDING')   params.status = 'PENDING';
    if (fStatus === 'EXECUTED')  params.status = 'EXECUTED';
    if (fAfter)     params.trade_after  = fAfter;
    if (fBefore)    params.trade_before = fBefore;
    if (fMarket)    params.exchange = fMarket.replace('FUT','').replace('OPTION','').replace('OPT','');
    if (fScript)    params.script = fScript;
    if (fBroker)    params.broker_id = fBroker;
    if (fMaster)    params.master_id = fMaster;
    if (fClient)    params.user_id = fClient;
    if (fOrderType) params.order_type = fOrderType;
    loadTrades(params);
  };

  const clearFilter = () => {
    setFStatus(''); setFAfter(''); setFBefore('');
    setFMarket(''); setFScript(''); setFBroker('');
    setFMaster(''); setFClient(''); setFOrderType('');
    loadTrades({});
  };

  const cancelTrade = async () => {
    const ids = [...selected];
    if (!ids.length) return showToast('Select at least one PENDING trade', false);
    if (!confirm(`Cancel ${ids.length} trade(s)?`)) return;
    let ok = 0;
    for (const id of ids) {
      try { await api.patch(`/admin/trades/${id}/cancel`); ok++; } catch {}
    }
    showToast(`${ok} trade(s) cancelled`);
    findOrders();
  };

  const exportCSV = () => {
    if (!trades.length) return showToast('No data to export', false);
    const header = ['#', 'Time', 'Client', 'Market', 'Script', 'B/S', 'Order Type', 'Lots', 'Qty', 'Price', 'Value', 'Status', 'Master'];
    const rows = trades.map((t, i) => [
      i + 1,
      fmtDT(t.created_at),
      t.full_name || t.username,
      t.exchange,
      t.script,
      t.trade_type,
      t.order_type || '—',
      t.lots || '—',
      t.quantity,
      fmt2(t.price),
      fmt2(t.total_value),
      t.status,
      t.master_name || t.master_username || '—',
    ]);
    const csv = [header, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `trades_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  /* Search + paginate */
  const filtered = trades.filter(t => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (t.full_name || '').toLowerCase().includes(q)
      || (t.username || '').toLowerCase().includes(q)
      || (t.script || '').toLowerCase().includes(q)
      || (t.status || '').toLowerCase().includes(q);
  });
  const totalPages = Math.ceil(filtered.length / perPage) || 1;
  const paged = perPage === 0 ? filtered : filtered.slice((page - 1) * perPage, page * perPage);

  const allChecked = paged.length > 0 && paged.every(t => selected.has(t.id));
  const toggleAll = () => {
    if (allChecked) {
      const s = new Set(selected);
      paged.forEach(t => s.delete(t.id));
      setSelected(s);
    } else {
      const s = new Set(selected);
      paged.forEach(t => s.add(t.id));
      setSelected(s);
    }
  };
  const toggleRow = (id) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };

  const chkSt = {
    width: 14, height: 14, accentColor: '#6f42c1', cursor: 'pointer',
  };

  return (
    <div style={{ background: C.bg, minHeight: '100%', color: C.text, fontFamily: 'var(--font-sans, Inter, sans-serif)' }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, padding: '12px 20px', borderRadius: 6, fontWeight: 700, fontSize: 13, background: toast.ok ? '#28a745' : '#dc3545', color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
          {toast.ok ? '✅ ' : '❌ '}{toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '13px 20px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontWeight: 800, fontSize: 18, color: '#fff' }}>Trades</div>
      </div>

      <div style={{ padding: '16px 20px' }}>

        {/* ══ FILTER BLOCK ══ */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: '16px 20px', marginBottom: 20 }}>

          {/* Row 1: Checkboxes + date/market/script/broker */}
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 14 }}>

            {/* Status checkboxes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 130 }}>
              {[
                { val: 'PENDING',  label: 'PENDING ORDERS' },
                { val: 'EXECUTED', label: 'EXECUTED ORDERS' },
                { val: 'SHOW_ALL', label: 'SHOW ALL' },
              ].map(o => (
                <label key={o.val} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: fStatus === o.val ? '#fff' : C.muted }}>
                  <input type="checkbox" checked={fStatus === o.val} onChange={() => setFStatus(fStatus === o.val ? '' : o.val)} style={chkSt} />
                  {o.label}
                </label>
              ))}
            </div>

            {/* TRADE AFTER */}
            <div style={{ minWidth: 150 }}>
              <span style={lbl}>TRADE AFTER</span>
              <input type="date" value={fAfter} onChange={e => setFAfter(e.target.value)} style={{ ...inp, colorScheme: 'dark' }} />
            </div>

            {/* TRADE BEFORE */}
            <div style={{ minWidth: 150 }}>
              <span style={lbl}>TRADE BEFORE</span>
              <input type="date" value={fBefore} onChange={e => setFBefore(e.target.value)} style={{ ...inp, colorScheme: 'dark' }} />
            </div>

            {/* MARKET */}
            <div style={{ minWidth: 140 }}>
              <span style={lbl}>MARKET</span>
              <Sel value={fMarket} onChange={setFMarket} placeholder="Select Mar...">
                {MARKETS.map(m => <option key={m} value={m}>{m}</option>)}
              </Sel>
            </div>

            {/* SCRIPT */}
            <div style={{ minWidth: 150 }}>
              <span style={lbl}>SCRIPT</span>
              <Sel value={fScript} onChange={setFScript} placeholder="Select Scri...">
                {[...new Set(scripts.map(s => s.name))].map(n => <option key={n} value={n}>{n}</option>)}
              </Sel>
            </div>

            {/* BROKER */}
            <div style={{ minWidth: 140 }}>
              <span style={lbl}>BROKER</span>
              <Sel value={fBroker} onChange={setFBroker} placeholder="Select Bro...">
                {brokers.map(b => <option key={b.id} value={String(b.id)}>{b.full_name || b.username}</option>)}
              </Sel>
            </div>
          </div>

          {/* Row 2: MASTER + CLIENT + ORDER TYPE + action buttons */}
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap' }}>

            {/* MASTER */}
            <div style={{ minWidth: 150 }}>
              <span style={lbl}>MASTER</span>
              <Sel value={fMaster} onChange={setFMaster} placeholder="Select Ma...">
                {masters.map(m => <option key={m.id} value={String(m.id)}>{m.full_name || m.username}</option>)}
              </Sel>
            </div>

            {/* CLIENT */}
            <div style={{ minWidth: 150 }}>
              <span style={lbl}>CLIENT</span>
              <Sel value={fClient} onChange={setFClient} placeholder="Select Clie...">
                {clients.map(c => <option key={c.id} value={String(c.id)}>{c.full_name || c.username}</option>)}
              </Sel>
            </div>

            {/* ORDER TYPE */}
            <div style={{ minWidth: 160 }}>
              <span style={lbl}>ORDER TYPE</span>
              <Sel value={fOrderType} onChange={setFOrderType} placeholder="Select Order Typ...">
                {ORDER_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
              </Sel>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <button onClick={findOrders} disabled={loading}
                style={{ padding: '8px 20px', background: '#1a1a3e', color: '#fff', border: '1px solid #4040a0', borderRadius: 4, fontWeight: 800, fontSize: 12, cursor: 'pointer', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                {loading ? '⏳' : '🔍'} FIND ORDERS
              </button>
              <button onClick={clearFilter}
                style={{ padding: '8px 20px', background: '#3a3a4a', color: '#aaa', border: '1px solid #555', borderRadius: 4, fontWeight: 800, fontSize: 12, cursor: 'pointer', letterSpacing: '0.04em' }}>
                CLEAR FILTER
              </button>
              <button onClick={cancelTrade}
                style={{ padding: '8px 20px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 800, fontSize: 12, cursor: 'pointer', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                CANCEL TRADE
              </button>
            </div>
          </div>
        </div>

        {/* TRADE EXPORT */}
        <div style={{ marginBottom: 16 }}>
          <button onClick={exportCSV}
            style={{ padding: '8px 22px', background: '#6f42c1', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 800, fontSize: 12, cursor: 'pointer', letterSpacing: '0.04em' }}>
            📤 TRADE EXPORT
          </button>
          {selected.size > 0 && (
            <span style={{ marginLeft: 14, fontSize: 12, color: '#ffc107', fontWeight: 700 }}>
              {selected.size} row{selected.size !== 1 ? 's' : ''} selected
            </span>
          )}
        </div>

        {/* ══ TOOLBAR ══ */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
                  <th style={{ ...thSt, textAlign: 'center', width: 36 }}>
                    <input type="checkbox" checked={allChecked} onChange={toggleAll} style={chkSt} />
                  </th>
                  {[
                    { h: 'D',           a: 'center', w: 30  },
                    { h: 'TIME',        a: 'left',   w: 120 },
                    { h: 'CLIENT',      a: 'left'          },
                    { h: 'MARKET',      a: 'left',   w: 90  },
                    { h: 'SCRIPT',      a: 'left'          },
                    { h: 'B/S',         a: 'center', w: 50  },
                    { h: 'ORDER TYPE',  a: 'left',   w: 100 },
                    { h: 'LOT',         a: 'right',  w: 55  },
                    { h: 'QTY',         a: 'right',  w: 60  },
                    { h: 'ORDER PRICE', a: 'right',  w: 100 },
                    { h: 'STATUS',      a: 'center', w: 100 },
                    { h: 'USER',        a: 'left'          },
                  ].map(c => (
                    <th key={c.h} style={{ ...thSt, textAlign: c.a, width: c.w }}>{c.h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={13} style={{ ...tdSt, textAlign: 'center', padding: 40, color: '#555' }}>⏳ Loading…</td></tr>
                ) : paged.length === 0 ? (
                  <tr><td colSpan={13} style={{ ...tdSt, textAlign: 'center', padding: 40, color: '#555' }}>No data available in table</td></tr>
                ) : paged.map((t, i) => {
                  const isBuy  = t.trade_type === 'BUY' || t.trade_type === 'LIMIT BUY' || t.trade_type === 'STOPLOSS BUY';
                  const rowNum = (page - 1) * (perPage || 0) + i + 1;
                  return (
                    <tr key={t.id}
                      onMouseEnter={e => e.currentTarget.style.background = C.trHover}
                      onMouseLeave={e => e.currentTarget.style.background = selected.has(t.id) ? '#1e1e40' : 'transparent'}
                      style={{ background: selected.has(t.id) ? '#1e1e40' : 'transparent' }}>

                      {/* Checkbox */}
                      <td style={{ ...tdSt, textAlign: 'center' }}>
                        <input type="checkbox" checked={selected.has(t.id)} onChange={() => toggleRow(t.id)} style={chkSt} />
                      </td>
                      {/* D (row number) */}
                      <td style={{ ...tdSt, textAlign: 'center', color: C.muted, fontSize: 10 }}>{rowNum}</td>
                      {/* TIME */}
                      <td style={{ ...tdSt, fontSize: 11, color: '#aaa', fontFamily: 'monospace' }}>{fmtDT(t.created_at)}</td>
                      {/* CLIENT */}
                      <td style={{ ...tdSt, fontWeight: 700, color: '#fff' }}>{t.full_name || t.username || '—'}</td>
                      {/* MARKET */}
                      <td style={{ ...tdSt }}>
                        <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 3, background: '#17a2b820', color: '#17a2b8', border: '1px solid #17a2b840' }}>
                          {t.exchange || '—'}
                        </span>
                      </td>
                      {/* SCRIPT */}
                      <td style={{ ...tdSt, color: '#17a2b8', fontWeight: 600 }}>{t.script || '—'}</td>
                      {/* B/S */}
                      <td style={{ ...tdSt, textAlign: 'center', fontWeight: 800 }}>
                        <span style={{ color: isBuy ? '#28a745' : '#dc3545', fontSize: 13 }}>
                          {isBuy ? 'B' : 'S'}
                        </span>
                      </td>
                      {/* ORDER TYPE */}
                      <td style={{ ...tdSt, fontSize: 11, color: '#aaa' }}>{t.trade_type || t.order_type || '—'}</td>
                      {/* LOT */}
                      <td style={{ ...tdSt, textAlign: 'right', fontFamily: 'monospace', color: C.brand }}>{t.lots || '—'}</td>
                      {/* QTY */}
                      <td style={{ ...tdSt, textAlign: 'right', fontFamily: 'monospace' }}>{t.quantity || '—'}</td>
                      {/* ORDER PRICE */}
                      <td style={{ ...tdSt, textAlign: 'right', fontFamily: 'monospace', color: '#fff', fontWeight: 700 }}>{fmt2(t.price)}</td>
                      {/* STATUS */}
                      <td style={{ ...tdSt, textAlign: 'center' }}><StatusBadge status={t.status} /></td>
                      {/* USER */}
                      <td style={{ ...tdSt, fontSize: 11, color: C.muted }}>{t.master_name || t.master_username || t.username || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, flexWrap: 'wrap', gap: 8 }}>
          <span style={{ color: C.muted, fontSize: 12 }}>
            Showing {paged.length === 0 ? 0 : (page - 1) * (perPage || paged.length) + 1}–{Math.min(page * (perPage || filtered.length), filtered.length)} of {filtered.length} entries
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: '5px 14px', background: page === 1 ? '#1a1a2e' : '#252535', color: page === 1 ? '#555' : '#aaa', border: `1px solid ${C.border}`, borderRadius: 4, cursor: page === 1 ? 'default' : 'pointer', fontSize: 12 }}>Previous</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, k) => {
              const pg = Math.max(1, Math.min(page - 2, totalPages - 4)) + k;
              return pg <= totalPages ? (
                <button key={pg} onClick={() => setPage(pg)}
                  style={{ padding: '5px 10px', background: pg === page ? '#6f42c1' : '#252535', color: pg === page ? '#fff' : '#aaa', border: `1px solid ${C.border}`, borderRadius: 4, cursor: 'pointer', fontWeight: pg === page ? 800 : 400, fontSize: 12 }}>
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
