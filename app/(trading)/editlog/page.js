'use client';

import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/axios';

function CheckBox({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <span onClick={onChange} className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0 ${checked ? 'border-brand bg-brand' : 'border-border bg-surface2'}`}>
        {checked && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><polyline points="1,3.5 3.5,6 8,1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </span>
      <span className="text-[11px] font-semibold text-muted uppercase tracking-wide whitespace-nowrap">{label}</span>
    </label>
  );
}

export default function EditLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpdate, setShowUpdate] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [segment, setSegment] = useState('');
  const [scriptFilter, setScriptFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showAdminOnly, setShowAdminOnly] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/trades/editlog')
      .then(r => setLogs(r.data.logs || []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const segments = useMemo(() => [...new Set(logs.map(l => l.exchange).filter(Boolean))], [logs]);
  const scripts = useMemo(() => [...new Set(logs.map(l => l.script).filter(Boolean))], [logs]);

  const filtered = useMemo(() => logs.filter(l => {
    if (showUpdate && !showDelete && l.action !== 'EDITED') return false;
    if (showDelete && !showUpdate && l.action !== 'DELETED') return false;
    if (segment && l.exchange !== segment) return false;
    if (scriptFilter && l.script !== scriptFilter) return false;
    if (fromDate && new Date(l.created_at) < new Date(fromDate)) return false;
    if (toDate && new Date(l.created_at) > new Date(toDate + 'T23:59:59')) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!l.script?.toLowerCase().includes(q) && !l.action?.toLowerCase().includes(q) && !l.done_by?.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [logs, showUpdate, showDelete, segment, scriptFilter, fromDate, toDate, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div>
      <h2 className="text-xl font-bold heading mb-4 text-fg">Edit / Delete Log</h2>
      <div className="card p-4 mb-4">
        <div className="flex flex-wrap gap-6 items-end">
          <div className="flex flex-col gap-2 shrink-0">
            <CheckBox label="UPDATE" checked={showUpdate} onChange={() => setShowUpdate(v => !v)} />
            <CheckBox label="DELETE" checked={showDelete} onChange={() => setShowDelete(v => !v)} />
          </div>
          <div>
            <label className="block text-[10px] text-muted font-semibold uppercase tracking-wider mb-1">Segment</label>
            <select value={segment} onChange={e => { setSegment(e.target.value); setPage(1); }} className="select h-[38px] min-w-[150px]">
              <option value="">Select Market</option>
              {segments.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-muted font-semibold uppercase tracking-wider mb-1">Select Script</label>
            <select value={scriptFilter} onChange={e => { setScriptFilter(e.target.value); setPage(1); }} className="select h-[38px] min-w-[150px]">
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
          <label className="flex items-center gap-2 cursor-pointer select-none self-end pb-2">
            <span onClick={() => setShowAdminOnly(v => !v)} className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center ${showAdminOnly ? 'border-brand bg-brand' : 'border-border bg-surface2'}`}>
              {showAdminOnly && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><polyline points="1,3.5 3.5,6 8,1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </span>
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wide">Show Admin<br/>Only</span>
          </label>
          <button onClick={() => { load(); setPage(1); }} className="self-end px-6 py-2.5 rounded font-bold text-sm text-white" style={{ background: '#1a1a1a', border: '1px solid #444' }}>FIND LOGS</button>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 text-sm text-muted">
          <span>SHOW</span>
          <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }} className="select w-20 h-[34px] text-sm">{[10,25,50,100].map(n => <option key={n} value={n}>{n}</option>)}</select>
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
              <thead><tr><th className="text-left">ACTION</th><th className="text-left">CLIENT</th><th className="text-left">SCRIPT</th><th>TYPE</th><th>LOT</th><th>QTY</th><th>RATE</th><th className="text-left">USER</th><th className="text-left">ADD TIME</th></tr></thead>
              <tbody>
                {paginated.length === 0 ? <tr><td colSpan={9} className="py-10 text-center text-muted text-sm">No data available in table</td></tr>
                  : paginated.map(l => {
                    const nv = l.new_values || {}; const ov = l.old_values || {};
                    return <tr key={l.id}>
                      <td className="text-left"><span className={l.action === 'EDITED' ? 'badge-warn' : 'badge-bad'}>{l.action}</span></td>
                      <td className="text-left text-xs text-muted">{l.done_by || '—'}</td>
                      <td className="sym">{l.script || '—'}</td>
                      <td>{nv.trade_type ? <span className={nv.trade_type === 'BUY' ? 'badge-buy' : 'badge-sell'}>{nv.trade_type}</span> : '—'}</td>
                      <td className="price">{nv.lots ?? ov.lots ?? '—'}</td>
                      <td className="price">{nv.quantity ?? ov.quantity ?? '—'}</td>
                      <td className="price">{nv.price ? Number(nv.price).toFixed(2) : ov.price ? Number(ov.price).toFixed(2) : '—'}</td>
                      <td className="text-left text-xs text-muted">{l.done_by || 'system'}</td>
                      <td className="text-left text-xs text-muted price">{new Date(l.created_at).toLocaleString()}</td>
                    </tr>;
                  })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-border/50 text-sm text-muted">
            <span>Showing {filtered.length === 0 ? 0 : (page-1)*pageSize+1} to {Math.min(page*pageSize,filtered.length)} of {filtered.length} entries</span>
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
