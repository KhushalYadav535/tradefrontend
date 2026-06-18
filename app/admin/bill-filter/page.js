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
const thSt  = { padding: '9px 12px', fontSize: 10, fontWeight: 800, color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.07em', background: C.th, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap', cursor: 'pointer' };
const tdSt  = { padding: '9px 12px', fontSize: 12, color: C.text, borderBottom: `1px solid ${C.border}` };

const fmt2   = n => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const today  = () => new Date().toISOString().split('T')[0];
const MARKETS = ['NSEFUT', 'NSEOPTION', 'MCXFUT', 'MCXOPTION', 'BSEFUT', 'BSEOPTION'];
const VALANS  = ['VALAN 1', 'VALAN 2', 'VALAN 3', 'WEEKLY', 'MONTHLY', 'QUARTERLY'];

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

export default function BillFilterPage() {
  /* dropdown data */
  const [clients,  setClients]  = useState([]);
  const [masters,  setMasters]  = useState([]);
  const [brokers,  setBrokers]  = useState([]);

  /* filter state */
  const [valanF,    setValanF]    = useState('');
  const [billGT,    setBillGT]    = useState('');   // bill greater than
  const [marketF,   setMarketF]   = useState('');
  const [masterF,   setMasterF]   = useState('');
  const [clientF,   setClientF]   = useState('');
  const [brokerF,   setBrokerF]   = useState('');
  const [billAfter, setBillAfter] = useState('');
  const [billBefore,setBillBefore]= useState('');

  /* results */
  const [bills,    setBills]    = useState([]);
  const [loading,  setLoading]  = useState(false);

  /* table */
  const [search,  setSearch]  = useState('');
  const [perPage, setPerPage] = useState(10);
  const [page,    setPage]    = useState(1);

  /* expanded bill rows */
  const [expanded, setExpanded] = useState({});

  const [toast, setToast] = useState(null);
  const showToast = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500); };

  useEffect(() => {
    api.get('/admin/students', { params: { role: 'user' } }).then(r => setClients(r.data.students || [])).catch(() => {});
    api.get('/admin/masters').then(r => setMasters(r.data.masters || [])).catch(() => {});
    api.get('/admin/brokers').then(r => setBrokers(r.data.brokers || [])).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (billAfter)  params.start_date = billAfter;
      if (billBefore) params.end_date   = billBefore;
      if (clientF)    params.user_id    = clientF;
      if (marketF)    params.exchange   = marketF;
      if (masterF)    params.master_id  = masterF;
      if (brokerF)    params.broker_id  = brokerF;
      const { data } = await api.get('/admin/bill-filter', { params });
      let rows = data.bills || [];
      if (billGT) rows = rows.filter(b => Number(b.total_brokerage || 0) > Number(billGT));
      setBills(rows);
      setPage(1);
      setExpanded({});
    } catch { setBills([]); } finally { setLoading(false); }
  }, [billAfter, billBefore, clientF, marketF, masterF, brokerF, billGT]);

  const clearFilter = () => {
    setValanF(''); setBillGT(''); setMarketF(''); setMasterF('');
    setClientF(''); setBrokerF(''); setBillAfter(''); setBillBefore('');
    setBills([]); setExpanded({});
  };

  /* print individual bill */
  const printBill = (bill) => {
    const w = window.open('', '_blank');
    const rows = (bill.trades || []).map(t => `<tr>
      <td>${t.script}</td><td>${t.exchange}</td><td>${t.trade_type}</td>
      <td align="right">${t.total_qty}</td>
      <td align="right">${Number(t.avg_price).toFixed(2)}</td>
      <td align="right">${Number(t.total_value).toLocaleString('en-IN')}</td>
      <td align="right">${Number(t.brokerage_amount).toFixed(2)}</td>
    </tr>`).join('');
    w.document.write(`<html><head><title>Bill — ${bill.username}</title>
    <style>body{font-family:Arial;font-size:12px;padding:20px}table{width:100%;border-collapse:collapse}
    th{background:#1a1a2e;color:#fff;padding:8px;text-align:left}td{padding:7px 8px;border-bottom:1px solid #eee}
    .hdr{display:flex;justify-content:space-between;margin-bottom:16px}h2{margin:0}</style></head>
    <body><div class="hdr"><h2>Trade Bill — ${bill.full_name || bill.username} (${bill.username})</h2><div>${billAfter || '—'} to ${billBefore || '—'}</div></div>
    <table><thead><tr><th>Script</th><th>Exchange</th><th>Type</th><th>Qty</th><th>Avg Price</th><th>Value</th><th>Brokerage</th></tr></thead>
    <tbody>${rows}</tbody></table>
    <p style="margin-top:16px;font-weight:bold">Net P&L: ₹${Number(bill.net_pnl||0).toLocaleString('en-IN',{minimumFractionDigits:2})} &nbsp;|&nbsp; Total Brokerage: ₹${Number(bill.total_brokerage||0).toFixed(2)}</p>
    </body></html>`);
    w.document.close(); w.focus(); setTimeout(() => { w.print(); w.close(); }, 300);
  };

  /* filter + page */
  const filtered = bills.filter(b => !search || (b.full_name || b.username || '').toLowerCase().includes(search.toLowerCase()) || (b.username || '').toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.ceil(filtered.length / (perPage || filtered.length)) || 1;
  const paged = perPage === 0 ? filtered : filtered.slice((page - 1) * perPage, page * perPage);

  /* totals */
  const totals = filtered.reduce((a, b) => ({
    amount:     a.amount     + Number(b.total_value     || 0),
    brokerage:  a.brokerage  + Number(b.total_brokerage || 0),
    pnl:        a.pnl        + Number(b.net_pnl         || 0),
  }), { amount: 0, brokerage: 0, pnl: 0 });

  return (
    <div style={{ background: C.bg, minHeight: '100%', color: C.text, fontFamily: 'var(--font-sans, Inter, sans-serif)' }}>
      {/* Toast */}
      {toast && <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, padding: '12px 20px', borderRadius: 6, fontWeight: 700, fontSize: 13, background: toast.ok ? '#28a745' : '#dc3545', color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>{toast.ok ? '✅ ' : '❌ '}{toast.msg}</div>}

      {/* Header */}
      <div style={{ padding: '13px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontWeight: 800, fontSize: 18, color: '#fff' }}>Bill Filter</div>
        {bills.length > 0 && <span style={{ background: '#28a74520', color: '#28a745', border: '1px solid #28a74535', borderRadius: 20, padding: '2px 12px', fontSize: 11, fontWeight: 700 }}>{bills.length} bills</span>}
      </div>

      <div style={{ padding: '14px 20px' }}>

        {/* ══ FILTER PANEL ══ */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: '14px 16px', marginBottom: 16 }}>

          {/* Row 1: SELECT VALAN / BILL GREATER THAN / SELECT MARKET / SELECT MASTER / SELECT CLIENT / SELECT BROKER */}
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto 1fr auto 1fr auto 1fr auto 1fr auto 1fr', alignItems: 'center', gap: '10px 8px', marginBottom: 12 }}>

            <span style={lblSt}>SELECT VALAN</span>
            <Sel value={valanF} onChange={setValanF} placeholder="Select Val..." minWidth={130}>
              {VALANS.map(v => <option key={v}>{v}</option>)}
            </Sel>

            <span style={lblSt}>BILL GREATER THAN</span>
            <input type="number" min="0" value={billGT} onChange={e => setBillGT(e.target.value)}
              style={{ ...inp, minWidth: 140 }} placeholder="" />

            <span style={lblSt}>SELECT MARKET</span>
            <Sel value={marketF} onChange={setMarketF} placeholder="Select Mar..." minWidth={130}>
              {MARKETS.map(m => <option key={m}>{m}</option>)}
            </Sel>

            <span style={lblSt}>SELECT MASTER</span>
            <Sel value={masterF} onChange={setMasterF} placeholder="Select Ma..." minWidth={140}>
              {masters.map(m => <option key={m.id} value={String(m.id)}>{m.full_name || m.username} ({m.username})</option>)}
            </Sel>

            <span style={lblSt}>SELECT CLIENT</span>
            <Sel value={clientF} onChange={setClientF} placeholder="Select Clie..." minWidth={140}>
              {clients.map(c => <option key={c.id} value={String(c.id)}>{c.full_name || c.username} ({c.username})</option>)}
            </Sel>

            <span style={lblSt}>SELECT BROKER</span>
            <Sel value={brokerF} onChange={setBrokerF} placeholder="Select Bro..." minWidth={140}>
              {brokers.map(b => <option key={b.id} value={String(b.id)}>{b.full_name || b.username} ({b.username})</option>)}
            </Sel>
          </div>

          {/* Row 2: BILL AFTER / BILL BEFORE / SUBMIT / CLEAR FILTER */}
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto 1fr auto auto', alignItems: 'center', gap: '10px 8px' }}>
            <span style={lblSt}>BILL AFTER</span>
            <input type="date" value={billAfter} onChange={e => setBillAfter(e.target.value)} style={{ ...inp, minWidth: 150 }} />

            <span style={lblSt}>BILL BEFORE</span>
            <input type="date" value={billBefore} onChange={e => setBillBefore(e.target.value)} style={{ ...inp, minWidth: 150 }} />

            <button onClick={load} disabled={loading}
              style={{ padding: '8px 28px', background: '#1a1a1a', color: '#fff', border: '2px solid #444', borderRadius: 4, fontWeight: 800, fontSize: 13, cursor: 'pointer', letterSpacing: '0.05em' }}>
              {loading ? 'LOADING…' : 'SUBMIT'}
            </button>

            <button onClick={clearFilter}
              style={{ padding: '8px 20px', background: '#555', color: '#ddd', border: 'none', borderRadius: 4, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              CLEAR FILTER
            </button>
          </div>
        </div>

        {/* ══ SUMMARY CARDS (shown after load) ══ */}
        {bills.length > 0 && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            {[
              { label: 'Total Bills',      val: bills.length,     fmt: v => v,                    color: '#28a745' },
              { label: 'Total Amount',     val: totals.amount,    fmt: v => `₹${fmt2(v)}`,        color: C.brand },
              { label: 'Total Brokerage',  val: totals.brokerage, fmt: v => `₹${fmt2(v)}`,        color: '#ffc107' },
              { label: 'Net P&L',          val: totals.pnl,       fmt: v => `₹${fmt2(Math.abs(v))}`, color: totals.pnl >= 0 ? '#28a745' : '#dc3545' },
            ].map(c => (
              <div key={c.label} style={{ background: C.surface, border: `1px solid ${c.color}25`, borderRadius: 6, padding: '10px 18px', flex: 1, minWidth: 130 }}>
                <div style={{ fontSize: 9, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>{c.label}</div>
                <div style={{ fontWeight: 800, color: c.color, fontFamily: 'var(--font-mono)', fontSize: 14 }}>
                  {c.label === 'Net P&L' && (totals.pnl < 0 ? '▼ ' : '▲ ')}{c.fmt(c.val)}
                </div>
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

        {/* ══ MAIN TABLE ══ */}
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr>
                  <th style={thSt}>SR NO.</th>
                  <th style={thSt}>NAME</th>
                  <th style={{ ...thSt, textAlign: 'right' }}>AMOUNT</th>
                  <th style={{ ...thSt, textAlign: 'right' }}>BILL</th>
                  <th style={{ ...thSt, textAlign: 'right' }}>NET P&L</th>
                  <th style={{ ...thSt, textAlign: 'right' }}>TRADES</th>
                  <th style={{ ...thSt, textAlign: 'center' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ ...tdSt, textAlign: 'center', padding: 40, color: '#555' }}>Generating bills…</td></tr>
                ) : paged.length === 0 ? (
                  <tr><td colSpan={7} style={{ ...tdSt, textAlign: 'center', padding: 40, color: '#555' }}>
                    {bills.length === 0 ? 'Select filters and click SUBMIT to generate bills.' : 'No data available in table'}
                  </td></tr>
                ) : paged.map((bill, i) => {
                  const srNo = (page - 1) * (perPage || filtered.length) + i + 1;
                  const isOpen = expanded[bill.user_id];
                  return [
                    /* Main row */
                    <tr key={`row-${bill.user_id}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setExpanded(prev => ({ ...prev, [bill.user_id]: !prev[bill.user_id] }))}
                      onMouseEnter={e => e.currentTarget.style.background = C.trHover}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                      {/* SR NO. */}
                      <td style={{ ...tdSt, color: '#555', fontSize: 11, fontWeight: 700 }}>{srNo}</td>

                      {/* NAME */}
                      <td style={tdSt}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 10, color: isOpen ? '#ffc107' : '#555' }}>{isOpen ? '▼' : '▶'}</span>
                          <div>
                            <div style={{ fontWeight: 700, color: '#fff' }}>{bill.full_name || bill.username}</div>
                            <div style={{ fontSize: 10, color: '#888' }}>{bill.username}</div>
                          </div>
                        </div>
                      </td>

                      {/* AMOUNT */}
                      <td style={{ ...tdSt, textAlign: 'right', fontFamily: 'var(--font-mono)', color: C.brand, fontWeight: 700 }}>
                        ₹{fmt2(bill.total_value)}
                      </td>

                      {/* BILL (brokerage) */}
                      <td style={{ ...tdSt, textAlign: 'right', fontFamily: 'var(--font-mono)', color: '#ffc107', fontWeight: 700 }}>
                        ₹{fmt2(bill.total_brokerage)}
                      </td>

                      {/* NET P&L */}
                      <td style={{ ...tdSt, textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 800, color: Number(bill.net_pnl) >= 0 ? '#28a745' : '#dc3545' }}>
                        {Number(bill.net_pnl) >= 0 ? '▲' : '▼'} ₹{fmt2(Math.abs(bill.net_pnl))}
                      </td>

                      {/* TRADES count */}
                      <td style={{ ...tdSt, textAlign: 'right', color: '#888' }}>
                        {(bill.trades || []).length}
                      </td>

                      {/* ACTION */}
                      <td style={{ ...tdSt, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => printBill(bill)}
                          style={{ padding: '4px 12px', background: '#7b5e3b', color: '#fff', border: 'none', borderRadius: 3, fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
                          🖨 Print
                        </button>
                      </td>
                    </tr>,

                    /* Expanded trade detail */
                    isOpen && (
                      <tr key={`detail-${bill.user_id}`}>
                        <td colSpan={7} style={{ padding: 0, borderBottom: `1px solid ${C.border}` }}>
                          <div style={{ background: '#111120', padding: '0 12px 12px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr>
                                  {['Script', 'Exchange', 'Expiry', 'Type', 'Trades', 'Qty', 'Avg Price', 'Total Value', 'Brokerage'].map(h => (
                                    <th key={h} style={{ ...thSt, fontSize: 9, background: '#0d0d1f', textAlign: ['Avg Price', 'Total Value', 'Brokerage', 'Qty', 'Trades'].includes(h) ? 'right' : 'left' }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {(bill.trades || []).map((t, ti) => (
                                  <tr key={ti}
                                    onMouseEnter={e => e.currentTarget.style.background = '#1a1a2e'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    <td style={{ ...tdSt, fontSize: 11, fontWeight: 600 }}>{t.script}</td>
                                    <td style={{ ...tdSt, fontSize: 11, color: '#17a2b8' }}>{t.exchange}</td>
                                    <td style={{ ...tdSt, fontSize: 10, color: '#888' }}>{t.expiry ? new Date(t.expiry).toLocaleDateString('en-IN') : '—'}</td>
                                    <td style={{ ...tdSt, fontSize: 11, textAlign: 'right', color: t.trade_type === 'BUY' ? '#28a745' : '#dc3545', fontWeight: 700 }}>{t.trade_type}</td>
                                    <td style={{ ...tdSt, fontSize: 11, textAlign: 'right' }}>{t.trade_count}</td>
                                    <td style={{ ...tdSt, fontSize: 11, textAlign: 'right' }}>{t.total_qty}</td>
                                    <td style={{ ...tdSt, fontSize: 11, textAlign: 'right' }}>₹{Number(t.avg_price).toFixed(2)}</td>
                                    <td style={{ ...tdSt, fontSize: 11, textAlign: 'right', fontWeight: 600 }}>₹{Number(t.total_value).toLocaleString('en-IN')}</td>
                                    <td style={{ ...tdSt, fontSize: 11, textAlign: 'right', color: '#ffc107' }}>₹{Number(t.brokerage_amount).toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )
                  ];
                })}

                {/* Totals row */}
                {paged.length > 0 && (
                  <tr style={{ background: '#12122a', borderTop: '2px solid #333' }}>
                    <td colSpan={2} style={{ ...tdSt, fontWeight: 800, color: '#fff', fontSize: 11 }}>
                      TOTALS ({filtered.length} bills)
                    </td>
                    <td style={{ ...tdSt, textAlign: 'right', fontWeight: 800, color: C.brand, fontFamily: 'var(--font-mono)', fontSize: 12 }}>₹{fmt2(totals.amount)}</td>
                    <td style={{ ...tdSt, textAlign: 'right', fontWeight: 800, color: '#ffc107', fontFamily: 'var(--font-mono)', fontSize: 12 }}>₹{fmt2(totals.brokerage)}</td>
                    <td style={{ ...tdSt, textAlign: 'right', fontWeight: 800, fontFamily: 'var(--font-mono)', fontSize: 12, color: totals.pnl >= 0 ? '#28a745' : '#dc3545' }}>
                      {totals.pnl >= 0 ? '▲' : '▼'} ₹{fmt2(Math.abs(totals.pnl))}
                    </td>
                    <td colSpan={2} style={tdSt} />
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
