'use client';

import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/axios';
import useVedpragyaStream from '@/hooks/useVedpragyaStream';

function fmt(n, d = 2) {
  return Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
}

export default function PortfolioPage() {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter/view state (Avadh11 style)
  const [view, setView] = useState('ALL');           // ALL | OUTSTANDING
  const [groupBy, setGroupBy] = useState('CLIENT');  // CLIENT | SCRIPT
  const [marketFilter, setMarketFilter] = useState('');
  const [scriptFilter, setScriptFilter] = useState('');
  const [expiryFilter, setExpiryFilter] = useState('');
  const [selected, setSelected] = useState(new Set());

  const load = () => {
    setLoading(true);
    api.get('/positions')
      .then(r => setPositions(r.data.positions || []))
      .catch(() => setPositions([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t); }, []);

  const symbols = useMemo(() => [...new Set(positions.map(p => p.script).filter(Boolean))], [positions]);
  const markets = useMemo(() => [...new Set(positions.map(p => p.exchange).filter(Boolean))], [positions]);

  const { ticks } = useVedpragyaStream(symbols);

  const rows = useMemo(() => positions.map(p => {
    const tick = ticks[p.script] || {};
    const ltp = tick.ltp || p.ltp || 0;
    const netQty = (p.buy_qty || 0) - (p.sell_qty || 0);
    const avgBuyPrice = Number(p.avg_buy_price || 0);
    const avgSellPrice = Number(p.avg_sell_price || 0);
    const mtm = netQty >= 0
      ? (ltp - avgBuyPrice) * netQty
      : (avgSellPrice - ltp) * Math.abs(netQty);
    const abp = netQty !== 0 ? (netQty > 0 ? avgBuyPrice : avgSellPrice) : 0;
    return { ...p, ltp, netQty, mtm, abp };
  }), [positions, ticks]);

  const filtered = useMemo(() => rows.filter(r => {
    if (view === 'OUTSTANDING' && r.netQty === 0) return false;
    if (marketFilter && r.exchange !== marketFilter) return false;
    if (scriptFilter && r.script !== scriptFilter) return false;
    if (expiryFilter && r.expiry !== expiryFilter) return false;
    return true;
  }), [rows, view, marketFilter, scriptFilter, expiryFilter]);

  const totalMtm = filtered.reduce((s, r) => s + r.mtm, 0);
  const totalQty = filtered.reduce((s, r) => s + Math.abs(r.netQty), 0);

  const liveSymbols = symbols.slice(0, 20);

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(r => r.id)));
  };

  return (
    <div>
      <h2 className="text-xl font-bold heading mb-4 text-fg">Portfolio / Position</h2>

      {/* Filter Bar */}
      <div className="card p-4 mb-4">
        <div className="flex flex-wrap gap-6 items-end">
          {/* ALL / OUTSTANDING */}
          <div className="flex flex-col gap-1.5">
            {['ALL', 'OUTSTANDING'].map(v => (
              <label key={v} className="flex items-center gap-2 cursor-pointer select-none">
                <span onClick={() => setView(v)}
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${view === v ? 'border-brand' : 'border-border'}`}>
                  {view === v && <span className="w-2 h-2 rounded-full bg-brand block" />}
                </span>
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">{v}</span>
              </label>
            ))}
          </div>
          {/* CLIENT / SCRIPT WISE */}
          <div className="flex flex-col gap-1.5">
            {['CLIENT WISE', 'SCRIPT WISE'].map(g => (
              <label key={g} className="flex items-center gap-2 cursor-pointer select-none">
                <span onClick={() => setGroupBy(g.split(' ')[0])}
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${groupBy === g.split(' ')[0] ? 'border-brand' : 'border-border'}`}>
                  {groupBy === g.split(' ')[0] && <span className="w-2 h-2 rounded-full bg-brand block" />}
                </span>
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">{g}</span>
              </label>
            ))}
          </div>
          {/* MARKET */}
          <div>
            <label className="block text-[10px] text-muted font-bold uppercase tracking-wider mb-1">Market</label>
            <select value={marketFilter} onChange={e => setMarketFilter(e.target.value)} className="select h-[38px] min-w-[140px]">
              <option value="">Select Mar...</option>
              {markets.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          {/* SCRIPT */}
          <div>
            <label className="block text-[10px] text-muted font-bold uppercase tracking-wider mb-1">Script</label>
            <select value={scriptFilter} onChange={e => setScriptFilter(e.target.value)} className="select h-[38px] min-w-[140px]">
              <option value="">Select Script</option>
              {symbols.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {/* EXPIRY DATE */}
          <div>
            <label className="block text-[10px] text-muted font-bold uppercase tracking-wider mb-1">Expiry Date</label>
            <input type="date" value={expiryFilter} onChange={e => setExpiryFilter(e.target.value)} className="input h-[38px] min-w-[140px]" />
          </div>
        </div>
        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 mt-4">
          <button onClick={load} className="px-5 py-2 rounded font-bold text-sm text-white" style={{ background: 'rgb(34 197 94)' }}>GET POSITION</button>
          <button className="px-5 py-2 rounded font-bold text-sm text-white" style={{ background: 'rgb(34 197 94)' }}>ROLL OVER ALL</button>
          <button className="px-5 py-2 rounded font-bold text-sm text-white" style={{ background: 'rgb(220 38 38)' }}>CLOSE POSITION</button>
          <button onClick={() => { setMarketFilter(''); setScriptFilter(''); setExpiryFilter(''); setView('ALL'); }} className="px-5 py-2 rounded font-bold text-sm text-white" style={{ background: 'rgb(99 102 241)' }}>CLEAR FILTER</button>
        </div>
      </div>

      {/* MTM Summary */}
      <div className="flex items-center gap-6 mb-3 px-1">
        <div>
          <div className="text-[10px] text-muted uppercase font-bold tracking-wider">TOTAL MTM</div>
          <div className={`price font-bold text-xl ${totalMtm >= 0 ? 'text-accent' : 'text-red'}`}>
            {totalMtm >= 0 ? '+' : ''}₹{fmt(Math.abs(totalMtm))}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-muted uppercase font-bold tracking-wider">TOTAL QTY</div>
          <div className="price font-bold text-xl text-fg">{totalQty}</div>
        </div>
        <div className="flex items-center gap-1.5 ml-2">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-xs font-semibold text-accent uppercase tracking-wider">LIVE</span>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-muted text-sm py-8 text-center">Loading…</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="qtable">
              <thead>
                <tr>
                  <th className="w-10"><input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} className="accent-brand" /></th>
                  <th>MARKET</th><th>SCRIPT</th><th>T. BUY Q.</th><th>BUY A. P.</th>
                  <th>T. SELL Q.</th><th>SELL A. P.</th><th>NET Q.</th><th>A/B P.</th>
                  <th>MTM</th><th>AUTO CLOSE</th><th>CLOSE</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={12} className="py-10 text-center text-muted text-sm">No positions found</td></tr>
                ) : filtered.map(r => (
                  <tr key={r.id}>
                    <td><input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)} className="accent-brand" /></td>
                    <td className="text-xs">{r.exchange}</td>
                    <td className="sym flex items-center gap-1">
                      {r.script}
                      <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse inline-block ml-1" />
                    </td>
                    <td className={`price ${r.buy_qty > 0 ? 'text-accent' : 'text-muted'}`}>{r.buy_qty}</td>
                    <td className="price">{fmt(r.avg_buy_price)}</td>
                    <td className={`price ${r.sell_qty > 0 ? 'text-red' : 'text-muted'}`}>{r.sell_qty}</td>
                    <td className="price">{fmt(r.avg_sell_price)}</td>
                    <td className={`price font-semibold ${r.netQty > 0 ? 'text-accent' : r.netQty < 0 ? 'text-red' : 'text-muted'}`}>{r.netQty}</td>
                    <td className="price">{fmt(r.abp)}</td>
                    <td className={`price font-semibold ${r.mtm >= 0 ? 'text-accent' : 'text-red'}`}>
                      {r.mtm >= 0 ? '+' : ''}₹{fmt(Math.abs(r.mtm))}
                    </td>
                    <td className="text-muted text-xs">—</td>
                    <td>
                      <button className="px-3 py-1 rounded text-xs font-bold text-white" style={{ background: 'rgb(220 38 38)' }}>Close</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile */}
          <div className="flex flex-col md:hidden divide-y divide-border/50">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-muted text-sm">No positions found</div>
            ) : filtered.map(r => (
              <div key={r.id} className="p-4 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold text-fg">{r.script}</span>
                    <span className="text-[10px] text-muted ml-2">{r.exchange}</span>
                  </div>
                  <span className={`price font-bold ${r.mtm >= 0 ? 'text-accent' : 'text-red'}`}>{r.mtm >= 0 ? '+' : ''}₹{fmt(Math.abs(r.mtm))}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div><span className="text-muted">Buy Qty: </span><span className="price text-accent">{r.buy_qty}</span></div>
                  <div><span className="text-muted">Sell Qty: </span><span className="price text-red">{r.sell_qty}</span></div>
                  <div><span className="text-muted">Net: </span><span className={`price font-bold ${r.netQty >= 0 ? 'text-accent' : 'text-red'}`}>{r.netQty}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
