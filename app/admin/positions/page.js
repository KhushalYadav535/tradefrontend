'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/axios';
import useVedpragyaExpiries from '@/hooks/useVedpragyaExpiries';

/* ── Styles ─────────────────────────────────────────── */
const S = {
  label: { fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, display: 'block' },
  select: {
    background: '#2a2a3d', border: '1px solid #444', color: '#fff', borderRadius: 4,
    padding: '7px 10px', fontSize: 13, width: '100%', outline: 'none',
    appearance: 'none', cursor: 'pointer',
  },
  input: {
    background: '#2a2a3d', border: '1px solid #444', color: '#aaa', borderRadius: 4,
    padding: '7px 10px', fontSize: 13, width: '100%', outline: 'none',
  },
  btn: (color) => ({
    padding: '8px 16px', borderRadius: 4, border: 'none', cursor: 'pointer',
    fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
    color: '#fff', background: color,
  }),
  th: { padding: '8px 10px', fontSize: 11, fontWeight: 700, color: '#ccc', textTransform: 'uppercase', letterSpacing: '0.07em', background: '#1a1a2e', borderBottom: '1px solid #333', whiteSpace: 'nowrap', textAlign: 'left' },
  td: { padding: '7px 10px', fontSize: 12, color: '#e0e0e0', borderBottom: '1px solid #2a2a3d', whiteSpace: 'nowrap' },
};

const fmt = (n, d = 2) => Number(n || 0).toFixed(d);

export default function PortfolioPage() {
  const [viewType, setViewType] = useState('ALL');       // ALL | OUTSTANDING
  const [groupBy, setGroupBy]   = useState('NONE');      // NONE | CLIENT | SCRIPT
  const [market, setMarket]     = useState('');
  const [script, setScript]     = useState('');
  const [broker, setBroker]     = useState('');
  const [expiry, setExpiry]     = useState('');
  const [master, setMaster]     = useState('');
  const [client, setClient]     = useState('');
  const [positions, setPositions] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [scripts, setScripts]   = useState([]);
  const [masters, setMasters]   = useState([]);
  const [students, setStudents] = useState([]);
  const [brokers, setBrokers]   = useState([]);

  /* ── Vedpragya expiries — fetched when script changes ── */
  const { expiries: vpExpiries, loading: expiriesLoading } = useVedpragyaExpiries(script, market);

  /* Auto-select first expiry when list loads */
  useEffect(() => {
    if (vpExpiries.length > 0) setExpiry(prev => prev || vpExpiries[0]);
  }, [vpExpiries]);

  /* Reset expiry when script changes */
  useEffect(() => { setExpiry(''); }, [script]);

  useEffect(() => {
    api.get('/scripts').then(r => setScripts(r.data.scripts || [])).catch(() => {});
    api.get('/admin/students').then(r => setStudents(r.data.students || [])).catch(() => {});
    api.get('/admin/masters').then(r => setMasters(r.data.masters || [])).catch(() => {});
    api.get('/admin/brokers').then(r => setBrokers(r.data.brokers || [])).catch(() => {});
  }, []);

  const getPosition = useCallback(() => {
    setLoading(true);
    api.get('/admin/positions')
      .then(r => setPositions(r.data.positions || []))
      .catch(() => setPositions([]))
      .finally(() => setLoading(false));
  }, []);

  /* Filter + compute M2M */
  const [closing, setClosing] = useState(false);

  const closeAllPositions = async () => {
    if (!window.confirm(`Close ALL ${positions.length} open positions at current market price? This cannot be undone.`)) return;
    setClosing(true);
    try {
      const r = await api.post('/admin/positions/close-all');
      alert(`✅ ${r.data.closed} positions closed successfully.`);
      getPosition();
    } catch {
      alert('❌ Failed to close positions. Try again.');
    } finally {
      setClosing(false);
    }
  };


  const rows = positions.map(p => {
    const netQty = (p.buy_qty || 0) - (p.sell_qty || 0);
    const isLong = netQty > 0;
    const avgBuy  = Number(p.avg_buy_price || 0);
    const avgSell = Number(p.avg_sell_price || 0);
    const ltp = Number(p.current_price || (isLong ? avgBuy : avgSell));
    const mtm = isLong
      ? (ltp - avgBuy) * netQty
      : netQty < 0 ? (avgSell - ltp) * Math.abs(netQty) : 0;
    const abp = netQty !== 0 ? (isLong ? avgBuy : avgSell) : 0;
    return { ...p, netQty, isLong, avgBuy, avgSell, ltp, mtm, abp };
  }).filter(p => {
    if (viewType === 'OUTSTANDING' && p.netQty === 0) return false;
    if (market && p.exchange !== market) return false;
    if (script && p.script !== script) return false;
    return true;
  });


  /* Aggregates */
  const totalMTM  = rows.reduce((s, r) => s + r.mtm, 0);
  const totalQty  = rows.reduce((s, r) => s + Math.abs(r.netQty), 0);

  const markets = [...new Set(scripts.map(s => s.exchange).filter(Boolean))];
  const scriptNames = [...new Set(scripts.map(s => s.name).filter(Boolean))];

  /* CSV Export */
  const exportCSV = () => {
    const cols = ['Client','Script','Market','Buy Qty','Buy Avg','Sell Qty','Sell Avg','Net Qty','Avg Price','MTM'];
    const data = rows.map(r => [r.username, r.script, r.exchange, r.buy_qty, fmt(r.avgBuy), r.sell_qty, fmt(r.avgSell), r.netQty, fmt(r.abp), fmt(r.mtm)]);
    const csv  = [cols, ...data].map(row => row.join(',')).join('\n');
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: 'portfolio.csv' });
    a.click();
  };

  return (
    <div style={{ background: '#13131f', minHeight: '100%', color: '#e0e0e0', fontSize: 13 }}>
      {/* ── Page title ── */}
      <div style={{ padding: '14px 20px 0', fontWeight: 700, fontSize: 18, color: '#fff', fontFamily: 'var(--font-heading)', letterSpacing: '-0.01em' }}>
        Portfolio / Position
      </div>

      {/* ── Filter panel ── */}
      <div style={{ padding: '14px 20px', background: '#1a1a2e', borderBottom: '1px solid #2a2a3d', marginTop: 10 }}>
        {/* Row 1: Radio + Market/Script/Master/Client */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap', marginBottom: 14 }}>
          {/* Radios left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {['ALL', 'OUTSTANDING'].map(v => (
              <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                <input type="radio" name="viewType" checked={viewType === v} onChange={() => setViewType(v)}
                  style={{ accentColor: '#17a2b8', width: 14, height: 14 }} />
                <span style={{ color: viewType === v ? '#17a2b8' : '#ccc', fontWeight: viewType === v ? 700 : 400 }}>{v}</span>
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {['CLIENT WISE', 'SCRIPT WISE'].map(v => (
              <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                <input type="radio" name="groupBy" checked={groupBy === v} onChange={() => setGroupBy(v)}
                  style={{ accentColor: '#17a2b8', width: 14, height: 14 }} />
                <span style={{ color: groupBy === v ? '#17a2b8' : '#ccc', fontWeight: groupBy === v ? 700 : 400 }}>{v}</span>
              </label>
            ))}
          </div>

          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            <div>
              <span style={S.label}>Market</span>
              <div style={{ position: 'relative' }}>
                <select value={market} onChange={e => setMarket(e.target.value)} style={S.select}>
                  <option value="">Select Mar...</option>
                  {markets.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#888', pointerEvents: 'none' }}>▼</span>
              </div>
            </div>
            <div>
              <span style={S.label}>Script</span>
              <div style={{ position: 'relative' }}>
                <select value={script} onChange={e => setScript(e.target.value)} style={S.select}>
                  <option value="">Select Script</option>
                  {scriptNames.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#888', pointerEvents: 'none' }}>▼</span>
              </div>
            </div>
            <div>
              <span style={S.label}>Master</span>
              <div style={{ position: 'relative' }}>
                <select value={master} onChange={e => setMaster(e.target.value)} style={S.select}>
                  <option value="">Select Master</option>
                  {masters.map(m => <option key={m.id} value={String(m.id)}>{m.full_name || m.username}</option>)}
                </select>
                <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#888', pointerEvents: 'none' }}>▼</span>
              </div>
            </div>
            <div>
              <span style={S.label}>Client</span>
              <div style={{ position: 'relative' }}>
                <select value={client} onChange={e => setClient(e.target.value)} style={S.select}>
                  <option value="">Select Client</option>
                  {students.map(s => <option key={s.id} value={String(s.id)}>{s.full_name || s.username}</option>)}
                </select>
                <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#888', pointerEvents: 'none' }}>▼</span>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Broker + Expiry */}
        <div style={{ display: 'grid', gridTemplateColumns: '200px 200px', gap: 12, marginBottom: 16 }}>
          <div>
            <span style={S.label}>Broker</span>
            <div style={{ position: 'relative' }}>
              <select value={broker} onChange={e => setBroker(e.target.value)} style={S.select}>
                <option value="">Select Broker</option>
                {brokers.map(b => <option key={b.id} value={String(b.id)}>{b.full_name || b.username}</option>)}
              </select>
              <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#888', pointerEvents: 'none' }}>▼</span>
            </div>
          </div>
          <div>
            <span style={S.label}>
              Expiry Date
              {expiriesLoading && script && (
                <span style={{ color: '#ffc107', fontSize: 9, marginLeft: 6, fontWeight: 700 }}>⏳ loading…</span>
              )}
              {!expiriesLoading && script && vpExpiries.length === 0 && (
                <span style={{ color: '#888', fontSize: 9, marginLeft: 6 }}>no expiries</span>
              )}
            </span>
            <div style={{ position: 'relative' }}>
              <select value={expiry} onChange={e => setExpiry(e.target.value)} style={S.select}>
                <option value="">{expiriesLoading ? 'Loading…' : 'dd-mm-yyyy'}</option>
                {vpExpiries.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
              <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#888', pointerEvents: 'none' }}>▼</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button style={S.btn('#17a2b8')} onClick={getPosition}>
            {loading ? 'Loading…' : 'Get Position'}
          </button>
          <button style={S.btn('#28a745')} onClick={() => alert('Roll Over — coming soon')}>Roll Over All</button>
          <button style={{ ...S.btn('#dc3545'), opacity: closing ? 0.6 : 1 }} onClick={closeAllPositions} disabled={closing}>
            {closing ? 'Closing…' : 'Close Position'}
          </button>
          <button style={S.btn('#6f42c1')} onClick={() => { setMarket(''); setScript(''); setBroker(''); setExpiry(''); setViewType('ALL'); setGroupBy('NONE'); setPositions([]); }}>
            Clear Filter
          </button>
        </div>

      </div>

      {/* ── MTM Summary bar ── */}
      <div style={{ display: 'flex', gap: 0, background: '#1e1e30', borderBottom: '1px solid #2a2a3d' }}>
        {[
          { label: 'Total MTM', val: fmt(totalMTM), color: totalMTM >= 0 ? '#28a745' : '#dc3545' },
          { label: 'Self MTM', val: '0.00', color: '#aaa' },
          { label: 'Downline MTM', val: '0.00', color: '#aaa' },
          { label: 'Upline MTM', val: '0.00', color: '#aaa' },
          { label: 'Total Qty', val: String(totalQty), color: '#fff' },
        ].map((item, i) => (
          <div key={item.label} style={{ padding: '10px 20px', borderRight: i < 4 ? '1px solid #2a2a3d' : 'none', minWidth: 120 }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#888', fontWeight: 700 }}>{item.label}</div>
            <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-mono)', color: item.color, marginTop: 2 }}>{item.val}</div>
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={exportCSV} style={{ ...S.btn('#7b5e3b'), fontSize: 11, padding: '5px 12px' }}>CSV</button>
          <button style={{ ...S.btn('#7b5e3b'), fontSize: 11, padding: '5px 12px' }}>PDF</button>
        </div>
      </div>

      {/* ── Main table ── */}
      <div style={{ overflowX: 'auto', padding: '0 0 20px' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Loading positions…</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                <th style={S.th}><input type="checkbox" /></th>
                {['Market', 'Client', 'Script', 'T. Buy Q.', 'Buy A.P.', 'T. Sell Q.', 'Sell A.P.', 'Net Q.', 'A/B P.', 'MTM', 'Auto Close', 'Close'].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={13} style={{ ...S.td, textAlign: 'center', padding: 40, color: '#666' }}>
                  No positions found. Click <strong style={{ color: '#17a2b8' }}>Get Position</strong> to load data.
                </td></tr>
              ) : rows.map((r, i) => (
                <tr key={i}
                  onMouseEnter={e => e.currentTarget.style.background = '#1e1e30'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={S.td}><input type="checkbox" /></td>
                  <td style={S.td}>{r.exchange || '—'}</td>
                  <td style={{ ...S.td, fontWeight: 600 }}>{r.username || '—'}</td>
                  <td style={{ ...S.td, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{r.script || '—'}</td>
                  <td style={{ ...S.td, textAlign: 'right', color: '#17a2b8' }}>{r.buy_qty || 0}</td>
                  <td style={{ ...S.td, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmt(r.avgBuy)}</td>
                  <td style={{ ...S.td, textAlign: 'right', color: '#e87722' }}>{r.sell_qty || 0}</td>
                  <td style={{ ...S.td, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmt(r.avgSell)}</td>
                  <td style={{ ...S.td, textAlign: 'right', fontWeight: 700, color: r.netQty >= 0 ? '#17a2b8' : '#e87722' }}>{r.netQty}</td>
                  <td style={{ ...S.td, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmt(r.abp)}</td>
                  <td style={{ ...S.td, textAlign: 'right', fontWeight: 700, fontFamily: 'var(--font-mono)', color: r.mtm >= 0 ? '#28a745' : '#dc3545' }}>
                    {r.mtm >= 0 ? '+' : ''}{fmt(r.mtm)}
                  </td>
                  <td style={{ ...S.td, textAlign: 'center' }}>
                    <button style={{ ...S.btn('#dc3545'), padding: '3px 10px', fontSize: 10 }}>Auto</button>
                  </td>
                  <td style={{ ...S.td, textAlign: 'center' }}>
                    <button style={{ ...S.btn('#dc3545'), padding: '3px 10px', fontSize: 10 }}>Close</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
