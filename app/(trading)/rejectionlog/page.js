'use client';

import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/axios';

export default function RejectionLogPage() {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marketFilter, setMarketFilter] = useState('');
  const [scriptFilter, setScriptFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/trades/rejectionlog')
      .then(r => setTrades(r.data.trades || []))
      .catch(() => setTrades([]))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const markets = useMemo(() => [...new Set(trades.map(t => t.exchange).filter(Boolean))], [trades]);
  const scripts = useMemo(() => [...new Set(trades.map(t => t.script).filter(Boolean))], [trades]);

  const filtered = useMemo(() => trades.filter(t => {
    if (marketFilter && t.exchange !== marketFilter) return false;
    if (scriptFilter && t.script !== scriptFilter) return false;
    if (fromDate && new Date(t.created_at) < new Date(fromDate)) return false;
    if (toDate && new Date(t.created_at) > new Date(toDate + 'T23:59:59')) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!t.script?.toLowerCase().includes(q) && !t.exchange?.toLowerCase().includes(q) && !t.reject_reason?.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [trades, marketFilter, scriptFilter, fromDate, toDate, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div>
      <h2 className="text-xl font-bold heading mb-4 text-fg">Rejection Log</h2>
      <div className="card p-4 mb-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-[10px] text-muted font-semibold uppercase tracking-wider mb-1">Select Market</label>
            <select value={marketFilter} onChange={e => { setMarketFilter(e.target.value); setPage(1); }} className="select h-[38px] min-w-[160px]">
              <option value="">Select Market</option>
              {markets.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-muted font-semibold uppercase tracking-wider mb-1">Select Script</label>
            <select value={scriptFilter} onChange={e => { setScriptFilter(e.target.value); setPage(1); }} className="select h-[38px] min-w-[160px]">
              <option value="">Select Scri…</option>
              {scripts.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-muted font-semibold uppercase tracking-wider mb-1">From Date</label>
            <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1); }} className="input h-[38px] min-w-[140px]" />
          </div>
          <div>
            <label className="block text-[10px] text-muted font-semibold uppercase tracking-wider mb-1">To Date</label>
            <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1); }} className="input h-[38px] min-w-[140px]" />
          </div>
          <button onClick={() => { load(); setPage(1); }} className="self-end px-6 py-2.5 rounded font-bold text-sm text-white" style={{ background: '#1a1a1a', border: '1px solid #444' }}>FIND LOGS</button>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 text-sm text-muted">
          <span>SHOW</span>
          <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }} className="select w-20 h-[34px] text-sm">{[10,25,50,100].map(n=><option key={n} value={n}>{n}</option>)}</select>
          <span>ENTRIES</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted">
          <span>SEARCH:</span>
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="input w-48 h-[34px] text-sm" />
        </div>
      </div>
      {loading ? <div className="text-muted text-sm py-8 text-center">Loading…</div> : (
        <div className="card overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="qtable">
              <thead><tr><th className="text-left">ACTION</th><th className="text-left">DATE</th><th className="text-left">CLIENT</th><th className="text-left">SCRIPT</th><th>TYPE</th><th>LOT</th><th>QTY</th><th>RATE</th><th className="text-left">REJECTION REASON</th></tr></thead>
              <tbody>
                {paginated.length === 0 ? <tr><td colSpan={9} className="py-10 text-center text-muted text-sm">No data available in table</td></tr>
                  : paginated.map(t => (
                    <tr key={t.id}>
                      <td className="text-left"><span className="badge-bad">REJECTED</span></td>
                      <td className="text-left text-xs text-muted price">{new Date(t.created_at).toLocaleDateString()}</td>
                      <td className="text-left text-xs text-muted">—</td>
                      <td className="sym"><div>{t.script}</div><div className="text-[10px] text-muted">{t.exchange}</div></td>
                      <td><span className={t.trade_type === 'BUY' ? 'badge-buy' : 'badge-sell'}>{t.trade_type}</span></td>
                      <td className="price">—</td>
                      <td className="price">{t.quantity}</td>
                      <td className="price">{Number(t.price).toFixed(2)}</td>
                      <td className="text-left text-xs text-red">{t.reject_reason || '—'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {/* Mobile */}
          <div className="flex flex-col md:hidden divide-y divide-border/50">
            {paginated.length === 0 ? <div className="p-8 text-center text-muted text-sm">No data available in table</div>
              : paginated.map(t => (
                <div key={t.id} className="p-4 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className={t.trade_type === 'BUY' ? 'badge-buy' : 'badge-sell'}>{t.trade_type}</span>
                      <span className="font-bold text-fg">{t.script}</span>
                      <span className="text-[10px] text-muted">{t.exchange}</span>
                    </div>
                    <span className="badge-bad">REJECTED</span>
                  </div>
                  <div className="bg-red/10 border border-red/20 rounded p-2.5 mt-1">
                    <span className="text-xs text-red font-semibold">{t.reject_reason}</span>
                  </div>
                </div>
              ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-border/50 text-sm text-muted">
            <span>Showing {filtered.length===0?0:(page-1)*pageSize+1} to {Math.min(page*pageSize,filtered.length)} of {filtered.length} entries</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1} className="px-3 py-1.5 rounded text-xs font-semibold border border-border hover:bg-surface2 disabled:opacity-40">Previous</button>
              {Array.from({length:Math.min(5,totalPages)},(_,i)=>i+1).map(p=><button key={p} onClick={()=>setPage(p)} className={`w-8 h-8 rounded text-xs font-semibold ${page===p?'bg-brand text-white':'border border-border hover:bg-surface2'}`}>{p}</button>)}
              {totalPages>5&&<span className="px-1">…</span>}
              <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages} className="px-3 py-1.5 rounded text-xs font-semibold border border-border hover:bg-surface2 disabled:opacity-40">Next</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
