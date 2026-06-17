'use client';

import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/axios';

function fmt(n, d = 2) {
  return Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
}

function FilterCheck({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-1.5 cursor-pointer select-none">
      <span onClick={onChange} className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${checked ? 'border-brand bg-brand' : 'border-border bg-surface2'}`}>
        {checked && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><polyline points="1,3.5 3.5,6 8,1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </span>
      <span className="text-[11px] font-semibold text-muted uppercase tracking-wide whitespace-nowrap">{label}</span>
    </label>
  );
}

export default function LedgerPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [onlyBills, setOnlyBills] = useState(false);
  const [onlyCashEntry, setOnlyCashEntry] = useState(false);
  const [onlyJvEntry, setOnlyJvEntry] = useState(false);
  const [onlyNegative, setOnlyNegative] = useState(false);
  const [onlyPositive, setOnlyPositive] = useState(false);
  const [cashOnlyDebit, setCashOnlyDebit] = useState(false);
  const [cashOnlyCredit, setCashOnlyCredit] = useState(false);
  const [jvOnlyDebit, setJvOnlyDebit] = useState(false);
  const [jvOnlyCredit, setJvOnlyCredit] = useState(false);
  const [pageSize, setPageSize] = useState('All');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/ledger')
      .then(r => setEntries(r.data.entries || []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => entries.filter(e => {
    if (fromDate && new Date(e.created_at) < new Date(fromDate)) return false;
    if (onlyNegative && Number(e.debit) <= 0) return false;
    if (onlyPositive && Number(e.credit) <= 0) return false;
    if (cashOnlyDebit && !(Number(e.debit) > 0)) return false;
    if (cashOnlyCredit && !(Number(e.credit) > 0)) return false;
    if (search && !e.description?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [entries, fromDate, onlyNegative, onlyPositive, cashOnlyDebit, cashOnlyCredit, search]);

  const effSize = pageSize === 'All' ? filtered.length || 1 : Number(pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / effSize));
  const paginated = pageSize === 'All' ? filtered : filtered.slice((page - 1) * effSize, page * effSize);

  const totalDebit = filtered.reduce((s, e) => s + Number(e.debit || 0), 0);
  const totalCredit = filtered.reduce((s, e) => s + Number(e.credit || 0), 0);
  const lastBalance = filtered.length ? Number(filtered[filtered.length - 1].balance) : 0;

  const exportCSV = () => {
    const rows = filtered.map((e, i) => [i+1, `"${(e.description||'').replace(/"/g,'""')}"`, new Date(e.created_at).toLocaleString(), Number(e.debit||0).toFixed(2), Number(e.credit||0).toFixed(2), Number(e.balance||0).toFixed(2)]);
    rows.push(['','Total','',totalDebit.toFixed(2),totalCredit.toFixed(2),lastBalance.toFixed(2)]);
    const csv = [['SR NO','REMARKS','DATE','DEBIT','CREDIT','BALANCE'],...rows].map(r=>r.join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
    a.download = `ledger_${new Date().toISOString().slice(0,10)}.csv`; a.click();
  };

  return (
    <div>
      <h2 className="text-xl font-bold heading mb-4 text-fg">Ledger</h2>
      <div className="card p-4 mb-4">
        <div className="flex flex-wrap gap-6 items-start">
          <div className="shrink-0">
            <label className="block text-[10px] text-muted font-semibold uppercase tracking-wider mb-1.5">From Date</label>
            <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1); }} className="input h-[38px] min-w-[150px]" />
          </div>
          <div className="shrink-0">
            <div className="text-[10px] text-muted font-bold uppercase tracking-wider mb-2">Select Entry Type</div>
            <div className="flex flex-col gap-2">
              <FilterCheck label="Only Bills" checked={onlyBills} onChange={() => setOnlyBills(v=>!v)} />
              <FilterCheck label="Only Cash Entry" checked={onlyCashEntry} onChange={() => setOnlyCashEntry(v=>!v)} />
              <FilterCheck label="Only JV Entry" checked={onlyJvEntry} onChange={() => setOnlyJvEntry(v=>!v)} />
            </div>
          </div>
          <div className="shrink-0">
            <div className="text-[10px] text-muted font-bold uppercase tracking-wider mb-2">Bill Type</div>
            <div className="flex flex-col gap-2">
              <FilterCheck label="Only Negative" checked={onlyNegative} onChange={() => { setOnlyNegative(v=>!v); setOnlyPositive(false); setPage(1); }} />
              <FilterCheck label="Only Positive" checked={onlyPositive} onChange={() => { setOnlyPositive(v=>!v); setOnlyNegative(false); setPage(1); }} />
            </div>
          </div>
          <div className="shrink-0">
            <div className="text-[10px] text-muted font-bold uppercase tracking-wider mb-2">Cash Entry</div>
            <div className="flex flex-col gap-2">
              <FilterCheck label="Only Debit" checked={cashOnlyDebit} onChange={() => { setCashOnlyDebit(v=>!v); setCashOnlyCredit(false); setPage(1); }} />
              <FilterCheck label="Only Credit" checked={cashOnlyCredit} onChange={() => { setCashOnlyCredit(v=>!v); setCashOnlyDebit(false); setPage(1); }} />
            </div>
          </div>
          <div className="shrink-0">
            <div className="text-[10px] text-muted font-bold uppercase tracking-wider mb-2">JV Entry</div>
            <div className="flex flex-col gap-2">
              <FilterCheck label="Only Debit" checked={jvOnlyDebit} onChange={() => { setJvOnlyDebit(v=>!v); setJvOnlyCredit(false); setPage(1); }} />
              <FilterCheck label="Only Credit" checked={jvOnlyCredit} onChange={() => { setJvOnlyCredit(v=>!v); setJvOnlyDebit(false); setPage(1); }} />
            </div>
          </div>
          <div className="flex items-end self-stretch">
            <button onClick={() => { load(); setPage(1); }} className="self-end px-6 py-2.5 rounded font-bold text-sm text-white" style={{ background: '#1a1a1a', border: '1px solid #555' }}>FIND LOGS</button>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 text-sm text-muted">
          <span>SHOW</span>
          <select value={pageSize} onChange={e => { setPageSize(e.target.value); setPage(1); }} className="select w-24 h-[34px] text-sm">
            {['All',10,25,50,100].map(n=><option key={n} value={n}>{n}</option>)}
          </select>
          <span>ENTRIES</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded overflow-hidden border border-border">
            <button onClick={exportCSV} className="px-4 py-1.5 text-xs font-bold text-white" style={{background:'#8B6914'}}>CSV</button>
            <button onClick={() => window.print()} className="px-4 py-1.5 text-xs font-bold text-white border-l border-white/20" style={{background:'#8B6914'}}>PDF</button>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted">
            <span>SEARCH:</span>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="input w-44 h-[34px] text-sm" />
          </div>
        </div>
      </div>
      {loading ? <div className="text-muted text-sm py-8 text-center">Loading…</div> : (
        <div className="card overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="qtable">
              <thead><tr><th className="text-center w-14">SR NO</th><th className="text-left">REMARKS</th><th>DATE</th><th>DEBIT</th><th>CREDIT</th><th>BALANCE</th><th className="w-20">DOWNLOAD</th></tr></thead>
              <tbody>
                {paginated.length === 0 ? <tr><td colSpan={7} className="py-10 text-center text-muted text-sm">No data available in table</td></tr>
                  : paginated.map((e, i) => (
                    <tr key={e.id}>
                      <td className="text-center text-muted">{(page-1)*effSize+i+1}</td>
                      <td className="text-left text-sm">{e.description}</td>
                      <td className="price text-xs text-muted">{new Date(e.created_at).toLocaleString('en-IN',{dateStyle:'short',timeStyle:'short'})}</td>
                      <td className={`price ${Number(e.debit)>0?'text-red':'text-muted'}`}>{Number(e.debit)>0?fmt(e.debit):'-'}</td>
                      <td className={`price ${Number(e.credit)>0?'text-accent':'text-muted'}`}>{Number(e.credit)>0?fmt(e.credit):'-'}</td>
                      <td className="price font-semibold">{fmt(e.balance)}</td>
                      <td className="text-center">
                        {e.trade_id ? (
                          <button className="w-7 h-7 inline-flex items-center justify-center rounded hover:bg-surface2 text-muted hover:text-fg" onClick={() => {
                            const t = `Entry #${i+1}\nDate: ${new Date(e.created_at).toLocaleString()}\nDesc: ${e.description}\nDebit: ${fmt(e.debit)}\nCredit: ${fmt(e.credit)}\nBalance: ${fmt(e.balance)}`;
                            const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([t],{type:'text/plain'}));
                            a.download = `ledger_${e.id}.txt`; a.click();
                          }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                          </button>
                        ) : <span className="text-muted text-sm">-</span>}
                      </td>
                    </tr>
                  ))}
              </tbody>
              {filtered.length > 0 && (
                <tfoot>
                  <tr className="border-t-2" style={{borderColor:'rgb(var(--border))'}}>
                    <td colSpan={3} className="text-right font-bold text-sm py-2 px-3 text-muted">Total :</td>
                    <td className="price font-bold text-red py-2">{fmt(totalDebit)}</td>
                    <td className="price font-bold text-accent py-2">{fmt(totalCredit)}</td>
                    <td className="price font-bold py-2">{fmt(lastBalance)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          {/* Mobile */}
          <div className="flex flex-col md:hidden divide-y divide-border/50">
            {paginated.length === 0 ? <div className="p-8 text-center text-muted text-sm">No data available in table</div>
              : paginated.map((e, i) => (
                <div key={e.id} className="p-4 flex flex-col gap-2">
                  <div className="font-semibold text-fg text-sm">{e.description}</div>
                  <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-border/30">
                    <div><span className="text-muted">Debit: </span><span className="price text-red">{Number(e.debit)>0?fmt(e.debit):'—'}</span></div>
                    <div><span className="text-muted">Credit: </span><span className="price text-accent">{Number(e.credit)>0?fmt(e.credit):'—'}</span></div>
                    <div className="text-right"><span className="text-muted">Bal: </span><span className="price font-bold">{fmt(e.balance)}</span></div>
                  </div>
                </div>
              ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-border/50 text-sm text-muted">
            <span>Showing {filtered.length===0?0:(page-1)*effSize+1} to {Math.min(page*effSize,filtered.length)} of {filtered.length} entries</span>
            {pageSize !== 'All' && (
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p=>Math.max(1,p-1))} disabled={page===1} className="px-3 py-1.5 rounded text-xs font-semibold border border-border hover:bg-surface2 disabled:opacity-40">Previous</button>
                {Array.from({length:Math.min(5,totalPages)},(_,i)=>i+1).map(p=><button key={p} onClick={()=>setPage(p)} className={`w-8 h-8 rounded text-xs font-semibold ${page===p?'bg-brand text-white':'border border-border hover:bg-surface2'}`}>{p}</button>)}
                {totalPages>5&&<span className="px-1">…</span>}
                <button onClick={() => setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages} className="px-3 py-1.5 rounded text-xs font-semibold border border-border hover:bg-surface2 disabled:opacity-40">Next</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
