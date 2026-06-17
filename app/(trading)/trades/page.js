'use client';

import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/axios';

function fmt(n, d = 2) {
  return Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
}

export default function TradesPage() {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [showPending, setShowPending] = useState(false);
  const [showExecuted, setShowExecuted] = useState(false);
  const [showAll, setShowAll] = useState(true);
  const [tradeAfter, setTradeAfter] = useState('');
  const [tradeBefore, setTradeBefore] = useState('');
  const [marketFilter, setMarketFilter] = useState('');
  const [scriptFilter, setScriptFilter] = useState('');
  const [orderTypeFilter, setOrderTypeFilter] = useState('');

  // Table controls
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/trades')
      .then(r => setTrades(r.data.trades || []))
      .catch(() => setTrades([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const markets = useMemo(() => [...new Set(trades.map(t => t.exchange).filter(Boolean))], [trades]);
  const scripts = useMemo(() => [...new Set(trades.map(t => t.script).filter(Boolean))], [trades]);

  const filtered = useMemo(() => {
    return trades.filter(t => {
      if (!showAll) {
        if (showPending && t.status !== 'PENDING') return false;
        if (showExecuted && !showPending && t.status !== 'EXECUTED') return false;
      }
      if (marketFilter && t.exchange !== marketFilter) return false;
      if (scriptFilter && t.script !== scriptFilter) return false;
      if (orderTypeFilter && t.order_type !== orderTypeFilter) return false;
      if (tradeAfter && new Date(t.created_at) < new Date(tradeAfter)) return false;
      if (tradeBefore && new Date(t.created_at) > new Date(tradeBefore + 'T23:59:59')) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!t.script?.toLowerCase().includes(q) && !t.exchange?.toLowerCase().includes(q) && !t.trade_type?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [trades, showAll, showPending, showExecuted, marketFilter, scriptFilter, orderTypeFilter, tradeAfter, tradeBefore, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const clearFilter = () => {
    setShowPending(false); setShowExecuted(false); setShowAll(true);
    setTradeAfter(''); setTradeBefore(''); setMarketFilter('');
    setScriptFilter(''); setOrderTypeFilter(''); setSearch(''); setPage(1);
  };

  const handleStatusCheck = (type) => {
    if (type === 'all') { setShowAll(true); setShowPending(false); setShowExecuted(false); }
    else if (type === 'pending') { setShowPending(v => !v); setShowAll(false); setShowExecuted(false); }
    else if (type === 'executed') { setShowExecuted(v => !v); setShowAll(false); setShowPending(false); }
    setPage(1);
  };

  function CheckBox({ label, checked, onChange }) {
    return (
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <span onClick={onChange} className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${checked ? 'border-brand bg-brand' : 'border-border bg-surface2'}`}>
          {checked && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><polyline points="1,4 4,7 9,1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        </span>
        <span className="text-xs font-semibold text-muted uppercase tracking-wider whitespace-nowrap">{label}</span>
      </label>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold heading mb-4 text-fg">Trades</h2>

      {/* Filter Bar */}
      <div className="card p-4 mb-4">
        <div className="flex flex-wrap gap-5 items-end">
          <div className="flex flex-col gap-2">
            <CheckBox label="PENDING ORDERS" checked={showPending} onChange={() => handleStatusCheck('pending')} />
            <CheckBox label="EXECUTED ORDERS" checked={showExecuted} onChange={() => handleStatusCheck('executed')} />
            <CheckBox label="SHOW ALL" checked={showAll} onChange={() => handleStatusCheck('all')} />
          </div>
          <div>
            <label className="block text-[10px] text-muted font-bold uppercase tracking-wider mb-1">Trade After</label>
            <input type="date" value={tradeAfter} onChange={e => { setTradeAfter(e.target.value); setPage(1); }} className="input h-[38px] min-w-[150px]" />
          </div>
          <div>
            <label className="block text-[10px] text-muted font-bold uppercase tracking-wider mb-1">Trade Before</label>
            <input type="date" value={tradeBefore} onChange={e => { setTradeBefore(e.target.value); setPage(1); }} className="input h-[38px] min-w-[150px]" />
          </div>
          <div>
            <label className="block text-[10px] text-muted font-bold uppercase tracking-wider mb-1">Market</label>
            <select value={marketFilter} onChange={e => { setMarketFilter(e.target.value); setPage(1); }} className="select h-[38px] min-w-[140px]">
              <option value="">Select Mar...</option>
              {markets.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-muted font-bold uppercase tracking-wider mb-1">Script</label>
            <select value={scriptFilter} onChange={e => { setScriptFilter(e.target.value); setPage(1); }} className="select h-[38px] min-w-[140px]">
              <option value="">Select Scri...</option>
              {scripts.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-muted font-bold uppercase tracking-wider mb-1">Order Type</label>
            <select value={orderTypeFilter} onChange={e => { setOrderTypeFilter(e.target.value); setPage(1); }} className="select h-[38px] min-w-[150px]">
              <option value="">Select Order Typ...</option>
              {['MARKET', 'LIMIT', 'SL', 'SL-M'].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <button onClick={() => { load(); setPage(1); }} className="px-5 py-2 rounded font-bold text-sm text-white" style={{ background: '#1a1a1a', border: '1px solid #555' }}>FIND ORDERS</button>
          <button onClick={clearFilter} className="px-5 py-2 rounded font-bold text-sm text-fg" style={{ background: '#2a2a2a', border: '1px solid #555' }}>CLEAR FILTER</button>
          <button className="px-5 py-2 rounded font-bold text-sm text-white" style={{ background: 'rgb(220 38 38)' }}>CANCEL TRADE</button>
          <button className="px-5 py-2 rounded font-bold text-sm text-white" style={{ background: 'rgb(99 102 241)' }}>TRADE EXPORT</button>
        </div>
      </div>

      {/* Table Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 text-sm text-muted">
          <span>SHOW</span>
          <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }} className="select w-20 h-[34px] text-sm">
            {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <span>ENTRIES</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted">
          <span>SEARCH:</span>
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="input w-48 h-[34px] text-sm" />
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
                  <th>D</th><th>TIME</th><th>MARKET</th><th>SCRIPT</th><th>B/S</th>
                  <th>ORDER TYPE</th><th>LOT</th><th>QTY</th><th>ORDER PRICE</th>
                  <th>STATUS</th><th>O. TIME</th><th>MODI</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={12} className="py-10 text-center text-muted text-sm">No data available in table</td></tr>
                ) : paginated.map((t) => (
                  <tr key={t.id}>
                    <td className="text-muted text-xs">#{t.id}</td>
                    <td className="price text-xs text-muted">{new Date(t.created_at).toLocaleTimeString()}</td>
                    <td className="text-xs">{t.exchange}</td>
                    <td className="sym">{t.script}</td>
                    <td><span className={t.trade_type === 'BUY' ? 'badge-buy' : 'badge-sell'}>{t.trade_type}</span></td>
                    <td className="text-xs">{t.order_type || 'MARKET'}</td>
                    <td className="price">{t.lots ?? '—'}</td>
                    <td className="price">{t.quantity}</td>
                    <td className="price">{fmt(t.price)}</td>
                    <td><span className={t.status === 'EXECUTED' ? 'badge-ok' : t.status === 'PENDING' ? 'badge-warn' : 'badge-bad'}>{t.status}</span></td>
                    <td className="price text-xs text-muted">{new Date(t.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td className="text-muted text-xs">—</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile */}
          <div className="flex flex-col md:hidden divide-y divide-border/50">
            {paginated.length === 0 ? (
              <div className="p-8 text-center text-muted text-sm">No data available in table</div>
            ) : paginated.map((t) => (
              <div key={t.id} className="p-4 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className={t.trade_type === 'BUY' ? 'badge-buy' : 'badge-sell'}>{t.trade_type}</span>
                    <span className="font-bold text-fg">{t.script}</span>
                    <span className="text-[10px] text-muted">{t.exchange}</span>
                  </div>
                  <span className={t.status === 'EXECUTED' ? 'badge-ok' : t.status === 'PENDING' ? 'badge-warn' : 'badge-bad'}>{t.status}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Qty: <span className="price text-fg">{t.quantity}</span></span>
                  <span className="text-muted">Price: <span className="price text-fg">{fmt(t.price)}</span></span>
                  <span className="text-muted text-xs price">{new Date(t.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>
              </div>
            ))}
          </div>
          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-border/50 text-sm text-muted">
            <span>Showing {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1} to {Math.min(page * pageSize, filtered.length)} of {filtered.length} entries</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded text-xs font-semibold border border-border hover:bg-surface2 disabled:opacity-40">Previous</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded text-xs font-semibold ${page === p ? 'bg-brand text-white' : 'border border-border hover:bg-surface2'}`}>{p}</button>
              ))}
              {totalPages > 5 && <span className="px-1">…</span>}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 rounded text-xs font-semibold border border-border hover:bg-surface2 disabled:opacity-40">Next</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
