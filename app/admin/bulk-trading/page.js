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
const inp = { background: C.surface, border: `1px solid ${C.border}`, color: C.text, borderRadius: 4, padding: '7px 10px', fontSize: 12, outline: 'none', width: '100%' };
const arr = { position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none', fontSize: 9 };
const lblSt = { fontSize: 11, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' };
const thSt = { padding: '9px 10px', fontSize: 10, fontWeight: 800, color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.07em', background: C.th, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap', cursor: 'pointer' };
const tdSt = { padding: '8px 10px', fontSize: 12, color: C.text, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' };

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

const fmtDT = v => v ? new Date(v).toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—';

export default function BulkTradingPage() {
  /* dropdown data */
  const [scripts,  setScripts]  = useState([]);
  const [students, setStudents] = useState([]);
  const [masters,  setMasters]  = useState([]);
  const [brokers,  setBrokers]  = useState([]);

  /* filter state */
  const [noOfTrades,   setNoOfTrades]   = useState('');
  const [tradeAfter,   setTradeAfter]   = useState('');
  const [tradeBefore,  setTradeBefore]  = useState('');
  const [marketF,      setMarketF]      = useState('');
  const [scriptF,      setScriptF]      = useState('');
  const [brokerF,      setBrokerF]      = useState('');
  const [masterF,      setMasterF]      = useState('');
  const [clientF,      setClientF]      = useState('');

  /* table */
  const [tableRows,  setTableRows]  = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [search,     setSearch]     = useState('');
  const [perPage,    setPerPage]    = useState(10);
  const [page,       setPage]       = useState(1);

  /* Execute panel state */
  const [showExec,    setShowExec]    = useState(false);
  const [execScript,  setExecScript]  = useState('');
  const [tradeType,   setTradeType]   = useState('BUY');
  const [quantity,    setQuantity]    = useState('');
  const [execPrice,   setExecPrice]   = useState('');
  const [notes,       setNotes]       = useState('');
  const [selUsers,    setSelUsers]    = useState([]);
  const [userSearch,  setUserSearch]  = useState('');
  const [busy,        setBusy]        = useState(false);
  const [result,      setResult]      = useState(null);

  /* toast */
  const [toast, setToast] = useState(null);
  const showToast = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 4000); };

  const MARKETS = ['NSEFUT', 'NSEOPTION', 'MCXFUT', 'MCXOPTION', 'BSEFUT', 'BSEOPTION'];

  useEffect(() => {
    api.get('/scripts').then(r => setScripts(r.data.scripts || [])).catch(() => {});
    api.get('/admin/students', { params: { role: 'user' } }).then(r => setStudents(r.data.students || [])).catch(() => {});
    api.get('/admin/masters').then(r => setMasters(r.data.masters || [])).catch(() => {});
    api.get('/admin/brokers').then(r => setBrokers(r.data.brokers || [])).catch(() => {});
    loadTable();
  }, []);

  /* ── Load trade history table ── */
  const loadTable = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (scriptF)    params.script_id  = scriptF;
      if (marketF)    params.exchange   = marketF;
      if (brokerF)    params.broker_id  = brokerF;
      if (masterF)    params.master_id  = masterF;
      if (clientF)    params.user_id    = clientF;
      if (tradeAfter) params.start_date = tradeAfter;
      if (tradeBefore)params.end_date   = tradeBefore;
      // Fetch all trades grouped by script + date using existing trade-logs endpoint
      const { data } = await api.get('/admin/logs/trade-edit', { params });
      const rows = data.logs || [];
      // Group by script + day to get SCRIPT / NO OF TRADES / START TIME / END TIME
      const grouped = {};
      rows.forEach(t => {
        const key = `${t.script_name || t.script_id}__${new Date(t.created_at).toLocaleDateString('en-IN')}`;
        if (!grouped[key]) grouped[key] = { script: t.script_name || t.script_id, count: 0, start: t.created_at, end: t.created_at };
        grouped[key].count++;
        if (new Date(t.created_at) < new Date(grouped[key].start)) grouped[key].start = t.created_at;
        if (new Date(t.created_at) > new Date(grouped[key].end))   grouped[key].end   = t.created_at;
      });
      setTableRows(Object.values(grouped));
    } catch { setTableRows([]); } finally { setLoading(false); }
  }, [scriptF, marketF, brokerF, masterF, clientF, tradeAfter, tradeBefore]);

  const clearFilter = () => {
    setNoOfTrades(''); setTradeAfter(''); setTradeBefore(''); setMarketF('');
    setScriptF(''); setBrokerF(''); setMasterF(''); setClientF('');
    setTableRows([]);
  };

  /* filter + page */
  const filtered = tableRows.filter(r => !search || (r.script || '').toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.ceil(filtered.length / (perPage || filtered.length)) || 1;
  const paged = perPage === 0 ? filtered : filtered.slice((page - 1) * perPage, page * perPage);

  /* ── Execute bulk trade ── */
  const execScript_obj = scripts.find(s => String(s.id) === execScript);
  const filteredUsers = students.filter(s =>
    !userSearch || s.username.toLowerCase().includes(userSearch.toLowerCase()) || (s.full_name || '').toLowerCase().includes(userSearch.toLowerCase())
  );
  const toggleUser  = id => setSelUsers(prev => prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]);
  const toggleAll   = () => setSelUsers(selUsers.length === filteredUsers.length ? [] : filteredUsers.map(s => s.id));

  const executeNow = async () => {
    if (!execScript || !quantity || !tradeType) return showToast('Script, Trade Type, and Quantity are required', false);
    if (!selUsers.length) return showToast('Select at least one user', false);
    if (!window.confirm(`Execute ${tradeType} × ${quantity} lots for ${selUsers.length} user(s) on ${execScript_obj?.name}?`)) return;
    setBusy(true);
    try {
      const { data } = await api.post('/admin/bulk-trade', {
        script_id: Number(execScript), trade_type: tradeType,
        quantity: Number(quantity), price: Number(execPrice) || 0,
        user_ids: selUsers, notes,
      });
      setResult(data);
      showToast(`Bulk ${tradeType} executed: ${data.executed}/${data.total} successful`);
      loadTable();
    } catch (err) { showToast(err.response?.data?.error || 'Bulk trade failed', false); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ background: C.bg, minHeight: '100%', color: C.text, fontFamily: 'var(--font-sans, Inter, sans-serif)' }}>
      {/* Toast */}
      {toast && <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, padding: '12px 20px', borderRadius: 6, fontWeight: 700, fontSize: 13, background: toast.ok ? '#28a745' : '#dc3545', color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>{toast.ok ? '✅ ' : '❌ '}{toast.msg}</div>}

      {/* Header */}
      <div style={{ padding: '13px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontWeight: 800, fontSize: 18, color: '#fff' }}>Bulk Trading</div>
        <button onClick={() => { setShowExec(!showExec); setResult(null); }}
          style={{ padding: '8px 20px', background: showExec ? '#3a1a1a' : '#28a745', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
          {showExec ? '✕ Close' : '⚡ Execute Bulk Trade'}
        </button>
      </div>

      <div style={{ padding: '14px 20px' }}>

        {/* ══ EXECUTE PANEL ══ */}
        {showExec && (
          <div style={{ background: '#1a1a2e', border: '1px solid #28a74540', borderRadius: 8, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#28a745', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>⚡ Execute Bulk Trade</div>

            {/* Trade config */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 14 }}>
              <div>
                <span style={{ ...lblSt, display: 'block', marginBottom: 4 }}>Script *</span>
                <Sel value={execScript} onChange={setExecScript} placeholder="Select Script" minWidth={180}>
                  {scripts.map(s => <option key={s.id} value={String(s.id)}>{s.name} ({s.exchange})</option>)}
                </Sel>
              </div>
              <div>
                <span style={{ ...lblSt, display: 'block', marginBottom: 4 }}>Trade Type *</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['BUY', 'SELL'].map(t => (
                    <button key={t} type="button" onClick={() => setTradeType(t)}
                      style={{ flex: 1, padding: '7px 0', borderRadius: 4, border: `2px solid ${tradeType === t ? (t === 'BUY' ? '#28a745' : '#dc3545') : '#333'}`, background: tradeType === t ? (t === 'BUY' ? '#1a3a1a' : '#3a1a1a') : 'transparent', color: tradeType === t ? (t === 'BUY' ? '#28a745' : '#dc3545') : '#666', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span style={{ ...lblSt, display: 'block', marginBottom: 4 }}>Quantity (Lots) *</span>
                <input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} style={inp} placeholder="1" />
              </div>
              <div>
                <span style={{ ...lblSt, display: 'block', marginBottom: 4 }}>Price (0 = Market)</span>
                <input type="number" min="0" step="0.01" value={execPrice} onChange={e => setExecPrice(e.target.value)} style={inp} placeholder={execScript_obj?.current_price || 'Market'} />
              </div>
              <div>
                <span style={{ ...lblSt, display: 'block', marginBottom: 4 }}>Notes</span>
                <input value={notes} onChange={e => setNotes(e.target.value)} style={inp} placeholder="Admin bulk trade" />
              </div>
            </div>

            {execScript_obj && (
              <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#888', marginBottom: 14, background: '#12122a', padding: '8px 12px', borderRadius: 4 }}>
                <span>LTP: <strong style={{ color: '#ffc107' }}>₹{Number(execScript_obj.current_price || 0).toLocaleString('en-IN')}</strong></span>
                <span>Lot Size: <strong style={{ color: '#e0e0e0' }}>{execScript_obj.lot_size}</strong></span>
                <span>Exchange: <strong style={{ color: '#17a2b8' }}>{execScript_obj.exchange}</strong></span>
                {execScript_obj.is_banned && <span style={{ color: '#dc3545', fontWeight: 700 }}>⚠ SCRIPT BANNED</span>}
              </div>
            )}

            {/* User selection */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#6f42c1', textTransform: 'uppercase' }}>
                  Select Users <span style={{ color: '#888', fontWeight: 400 }}>({selUsers.length} of {filteredUsers.length} selected)</span>
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={userSearch} onChange={e => setUserSearch(e.target.value)} style={{ ...inp, width: 180 }} placeholder="Search users…" />
                  <button onClick={toggleAll} style={{ padding: '6px 14px', background: selUsers.length === filteredUsers.length ? '#3a1a1a' : '#1a3a1a', color: selUsers.length === filteredUsers.length ? '#dc3545' : '#28a745', border: 'none', borderRadius: 4, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                    {selUsers.length === filteredUsers.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 5, maxHeight: 220, overflowY: 'auto', padding: 4 }}>
                {filteredUsers.map(s => (
                  <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 4, cursor: 'pointer', background: selUsers.includes(s.id) ? '#1a2a3a' : '#141420', border: `1px solid ${selUsers.includes(s.id) ? '#6f42c1' : '#2a2a3a'}` }}>
                    <input type="checkbox" checked={selUsers.includes(s.id)} onChange={() => toggleUser(s.id)} style={{ accentColor: '#6f42c1' }} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#e0e0e0' }}>{s.username}</div>
                      <div style={{ fontSize: 10, color: '#888' }}>₹{Number(s.balance || 0).toLocaleString('en-IN')}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button onClick={executeNow} disabled={busy || !execScript || !quantity || !selUsers.length}
              style={{ padding: '10px 28px', background: busy ? '#555' : '#28a745', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 800, fontSize: 14, cursor: busy ? 'default' : 'pointer', opacity: (!execScript || !quantity || !selUsers.length) ? 0.5 : 1 }}>
              {busy ? '⏳ Executing…' : `⚡ EXECUTE BULK ${tradeType} FOR ${selUsers.length} USER${selUsers.length !== 1 ? 'S' : ''}`}
            </button>

            {/* Result */}
            {result && (
              <div style={{ marginTop: 14, background: '#12122a', border: '1px solid #333', borderRadius: 6, padding: 14 }}>
                <div style={{ display: 'flex', gap: 20, marginBottom: 10, flexWrap: 'wrap' }}>
                  <span style={{ color: '#28a745', fontWeight: 700 }}>✓ Executed: {result.executed}</span>
                  <span style={{ color: '#dc3545', fontWeight: 700 }}>✗ Failed: {result.total - result.executed}</span>
                  <span style={{ color: '#888' }}>Total: {result.total}</span>
                </div>
                <div style={{ border: `1px solid ${C.border}`, borderRadius: 4, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['User', 'Status', 'Price', 'Qty', 'Trade ID', 'Reason'].map(h => (
                          <th key={h} style={{ ...thSt, fontSize: 9 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(result.results || []).map((r, i) => (
                        <tr key={i}>
                          <td style={tdSt}>{r.username}</td>
                          <td style={tdSt}><span style={{ color: r.status === 'EXECUTED' ? '#28a745' : '#dc3545', fontWeight: 700, fontSize: 11 }}>{r.status}</span></td>
                          <td style={tdSt}>{r.price || '—'}</td>
                          <td style={tdSt}>{r.qty || '—'}</td>
                          <td style={{ ...tdSt, fontFamily: 'monospace', color: '#888' }}>{r.trade_id || '—'}</td>
                          <td style={{ ...tdSt, color: '#dc3545', fontSize: 11 }}>{r.reason || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ FILTER PANEL (AVADH11 exact) ══ */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: '14px 16px', marginBottom: 14 }}>

          {/* Row 1: NO OF TRADES / TRADE AFTER / TRADE BEFORE / MARKET / SCRIPT / BROKER */}
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto 1fr auto 1fr auto 1fr auto 1fr auto 1fr', alignItems: 'center', gap: '10px 8px', marginBottom: 12 }}>

            <span style={lblSt}>NO OF TRADES</span>
            <input type="number" min="1" value={noOfTrades} onChange={e => setNoOfTrades(e.target.value)}
              style={{ ...inp, minWidth: 100 }} placeholder="No of Trades" />

            <span style={lblSt}>TRADE AFTER</span>
            <input type="date" value={tradeAfter} onChange={e => setTradeAfter(e.target.value)} style={{ ...inp, minWidth: 140 }} />

            <span style={lblSt}>TRADE BEFORE</span>
            <input type="date" value={tradeBefore} onChange={e => setTradeBefore(e.target.value)} style={{ ...inp, minWidth: 140 }} />

            <span style={lblSt}>MARKET</span>
            <Sel value={marketF} onChange={setMarketF} placeholder="Select Mar..." minWidth={130}>
              {MARKETS.map(m => <option key={m}>{m}</option>)}
            </Sel>

            <span style={lblSt}>SCRIPT</span>
            <Sel value={scriptF} onChange={setScriptF} placeholder="Select Scri..." minWidth={140}>
              {scripts.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
            </Sel>

            <span style={lblSt}>BROKER</span>
            <Sel value={brokerF} onChange={setBrokerF} placeholder="Select Bro..." minWidth={140}>
              {brokers.map(b => <option key={b.id} value={String(b.id)}>{b.full_name || b.username} ({b.username})</option>)}
            </Sel>
          </div>

          {/* Row 2: MASTER / CLIENT / + SUBMIT */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
            <div>
              <span style={{ ...lblSt, display: 'block', marginBottom: 4 }}>MASTER</span>
              <Sel value={masterF} onChange={setMasterF} placeholder="Select Ma..." minWidth={160}>
                {masters.map(m => <option key={m.id} value={String(m.id)}>{m.full_name || m.username} ({m.username})</option>)}
              </Sel>
            </div>
            <div>
              <span style={{ ...lblSt, display: 'block', marginBottom: 4 }}>CLIENT</span>
              <Sel value={clientF} onChange={setClientF} placeholder="Select Clie..." minWidth={160}>
                {students.map(s => <option key={s.id} value={String(s.id)}>{s.full_name || s.username} ({s.username})</option>)}
              </Sel>
            </div>
            <button onClick={loadTable} disabled={loading}
              style={{ padding: '8px 24px', background: '#28a745', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 800, fontSize: 13, cursor: 'pointer', letterSpacing: '0.04em' }}>
              {loading ? 'LOADING…' : '+ SUBMIT'}
            </button>
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
              <option value={0}>All</option>
              {[10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
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
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr>
                  {['SCRIPT ↕', 'NO OF TRADES ↕', 'START TIME ↕', 'END TIME ↕'].map(h => (
                    <th key={h} style={{ ...thSt, textAlign: ['NO OF TRADES ↕'].includes(h) ? 'center' : 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} style={{ ...tdSt, textAlign: 'center', padding: 40, color: '#555' }}>Loading…</td></tr>
                ) : paged.length === 0 ? (
                  <tr><td colSpan={4} style={{ ...tdSt, textAlign: 'center', padding: 40, color: '#555' }}>No data available in table</td></tr>
                ) : paged.map((r, i) => (
                  <tr key={i}
                    onMouseEnter={e => e.currentTarget.style.background = C.trHover}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ ...tdSt, fontWeight: 700, color: '#17a2b8' }}>{r.script}</td>
                    <td style={{ ...tdSt, textAlign: 'center' }}>
                      <span style={{ background: '#28a74520', color: '#28a745', border: '1px solid #28a74540', borderRadius: 10, padding: '2px 10px', fontWeight: 800, fontSize: 12 }}>
                        {r.count}
                      </span>
                    </td>
                    <td style={{ ...tdSt, color: '#888', fontFamily: 'monospace', fontSize: 11 }}>{fmtDT(r.start)}</td>
                    <td style={{ ...tdSt, color: '#888', fontFamily: 'monospace', fontSize: 11 }}>{fmtDT(r.end)}</td>
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
              style={{ padding: '5px 14px', background: page === 1 ? '#1a1a2e' : '#252535', color: page === 1 ? '#555' : '#aaa', border: `1px solid ${C.border}`, borderRadius: 4, cursor: page === 1 ? 'default' : 'pointer', fontSize: 12 }}>
              Previous
            </button>
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
              style={{ padding: '5px 14px', background: page === totalPages ? '#1a1a2e' : '#252535', color: page === totalPages ? '#555' : '#aaa', border: `1px solid ${C.border}`, borderRadius: 4, cursor: page === totalPages ? 'default' : 'pointer', fontSize: 12 }}>
              Next
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
