'use client';

import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/axios';

export default function MaxQtyPage() {
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/scripts/maxqty')
      .then(r => setScripts(r.data.scripts || []))
      .catch(() => setScripts([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search) return scripts;
    const q = search.toLowerCase();
    return scripts.filter(s => s.name?.toLowerCase().includes(q) || s.exchange?.toLowerCase().includes(q));
  }, [scripts, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div>
      <h2 className="text-xl font-bold heading mb-4 text-fg">Max Quantity Details</h2>
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
      {loading ? (
        <div className="text-muted text-sm py-8 text-center">Loading…</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="qtable">
              <thead>
                <tr>
                  <th className="text-left">MARKET</th>
                  <th className="text-left">SCRIPT</th>
                  <th>POSITION LIMIT</th>
                  <th>MAX ORDER</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={4} className="py-10 text-center text-muted text-sm">No data available in table</td></tr>
                ) : paginated.map(s => {
                  const posLimit = (s.lot_size || 1) * (s.max_lots || 0);
                  const maxOrder = posLimit / 2;
                  return (
                    <tr key={s.id}>
                      <td className="text-left font-semibold text-sm">{s.exchange}</td>
                      <td className="text-left font-semibold">{s.name}</td>
                      <td className="price">{posLimit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="price">{maxOrder.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Mobile */}
          <div className="flex flex-col md:hidden divide-y divide-border/50">
            {paginated.length === 0 ? (
              <div className="p-8 text-center text-muted text-sm">No data available in table</div>
            ) : paginated.map(s => {
              const posLimit = (s.lot_size || 1) * (s.max_lots || 0);
              return (
                <div key={s.id} className="p-4 flex justify-between items-center">
                  <div><span className="font-bold text-fg">{s.name}</span><span className="text-[10px] text-muted ml-2">{s.exchange}</span></div>
                  <div className="text-right"><div className="price text-accent font-semibold">{posLimit.toLocaleString('en-IN')}</div></div>
                </div>
              );
            })}
          </div>
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
