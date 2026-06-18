'use client';

import { useState, useCallback } from 'react';
import api from '@/lib/axios';

const C = {
  bg: '#0f0f1a', surface: '#1a1a2e', border: '#252540',
  th: '#12122a', trHover: '#1e1e34', text: '#e0e0e0', muted: '#888', brand: '#f5a623',
};
const inp  = { background: C.surface, border: `1px solid ${C.border}`, color: C.text, borderRadius: 4, padding: '7px 10px', fontSize: 12, outline: 'none', width: '100%' };
const thSt  = { padding: '9px 10px', fontSize: 10, fontWeight: 800, color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.07em', background: C.th, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap', cursor: 'pointer' };
const tdSt  = { padding: '9px 10px', fontSize: 12, color: C.text, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' };
const fmt2  = n => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function TrialBalancePage() {
  const [filters, setFilters] = useState({ all: true, masters: false, brokers: false, clients: false });
  const [rows,    setRows]    = useState([]);
  const [grand,   setGrand]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [search,  setSearch]  = useState('');
  const [perPage, setPerPage] = useState(10);
  const [page,    setPage]    = useState(1);

  const toggle = (key) => setFilters(prev => ({ ...prev, [key]: !prev[key] }));

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      // Backend currently queries users; pass type param for possible future use
      if (filters.all) {
        params.type = 'all';
      } else {
        const types = [];
        if (filters.masters) types.push('master');
        if (filters.brokers) types.push('broker');
        if (filters.clients) types.push('user');
        if (types.length > 0) params.type = types.join(',');
      }

      const { data } = await api.get('/admin/accounts/trial-balance', { params });

      // Backend returns { rows, grand_total }
      const list = data.rows || data.balance || data.records || [];
      setRows(list);
      setGrand(data.grand_total || null);
      setPage(1);
    } catch (err) {
      console.error('Trial balance error:', err);
      setRows([]);
      setGrand(null);
    } finally { setLoading(false); }
  }, [filters]);

  /* The backend returns users only. For masters/brokers support filter on frontend too */
  const roleFiltered = rows.filter(r => {
    if (filters.all) return true;
    const role = (r.role || r.user_type || 'user').toLowerCase();
    if (filters.clients && role === 'user')   return true;
    if (filters.masters && role === 'master') return true;
    if (filters.brokers && role === 'broker') return true;
    return false;
  });

  const filtered = roleFiltered.filter(r =>
    !search || (r.full_name || r.username || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / (perPage || filtered.length)) || 1;
  const paged = perPage === 0 ? filtered : filtered.slice((page - 1) * perPage, page * perPage);

  /* Use grand from API if available, else compute from filtered */
  const totals = grand && filters.all ? grand : filtered.reduce((a, r) => ({
    total_debit:  a.total_debit  + Number(r.total_debit  || r.debit  || 0),
    total_credit: a.total_credit + Number(r.total_credit || r.credit || 0),
    net_ledger:   a.net_ledger   + Number(r.net_ledger   || r.balance || 0),
  }), { total_debit: 0, total_credit: 0, net_ledger: 0 });

  const exportCSV = () => {
    const cols = ['Name', 'Username', 'Total Debit', 'Total Credit', 'Net Ledger', 'Current Balance', 'Entries'];
    const data = filtered.map(r => [
      r.full_name || '—', r.username,
      Number(r.total_debit  || 0).toFixed(2),
      Number(r.total_credit || 0).toFixed(2),
      Number(r.net_ledger   || 0).toFixed(2),
      Number(r.current_balance || 0).toFixed(2),
      r.entry_count || 0,
    ]);
    const csv = [cols, ...data].map(row => row.join(',')).join('\n');
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
      download: 'trial_balance.csv',
    });
    a.click();
  };

  const CHECKBOXES = [
    { key: 'all',     label: 'ALL' },
    { key: 'masters', label: 'ONLY MASTERS' },
    { key: 'brokers', label: 'ONLY BROKERS' },
    { key: 'clients', label: 'ONLY CLIENTS' },
  ];

  return (
    <div style={{ background: C.bg, minHeight: '100%', color: C.text, fontFamily: 'var(--font-sans, Inter, sans-serif)' }}>
      <div style={{ padding: '13px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontWeight: 800, fontSize: 18, color: '#fff' }}>Trial Balance</div>
        {rows.length > 0 && (
          <span style={{ background: '#6f42c120', color: '#6f42c1', border: '1px solid #6f42c135', borderRadius: 20, padding: '2px 12px', fontSize: 11, fontWeight: 700 }}>
            {rows.length} accounts
          </span>
        )}
      </div>

      <div style={{ padding: '16px 20px' }}>

        {/* ── Filter ── */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: '16px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          {CHECKBOXES.map(({ key, label }) => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: filters[key] ? '#6f42c1' : '#888', userSelect: 'none' }}>
              <div
                onClick={() => toggle(key)}
                style={{ width: 18, height: 18, border: `2px solid ${filters[key] ? '#6f42c1' : '#555'}`, borderRadius: 3, background: filters[key] ? '#6f42c1' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0 }}>
                {filters[key] && <span style={{ color: '#fff', fontSize: 11, lineHeight: 1 }}>✓</span>}
              </div>
              {label}
            </label>
          ))}

          <button onClick={fetchRecords} disabled={loading}
            style={{ padding: '9px 22px', background: '#6f42c1', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 800, fontSize: 13, cursor: 'pointer', letterSpacing: '0.05em', opacity: loading ? 0.7 : 1 }}>
            {loading ? '⏳ LOADING…' : 'FETCH RECORDS'}
          </button>
        </div>

        {/* ── Summary Cards ── */}
        {rows.length > 0 && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            {[
              { label: 'Total Accounts',  val: rows.length,               fmt: v => v,              color: '#17a2b8' },
              { label: 'Total Debit',     val: totals.total_debit,        fmt: v => `₹${fmt2(v)}`,  color: '#dc3545' },
              { label: 'Total Credit',    val: totals.total_credit,       fmt: v => `₹${fmt2(v)}`,  color: '#28a745' },
              { label: 'Net Ledger',      val: totals.net_ledger,         fmt: v => `₹${fmt2(Math.abs(v))}`, color: Number(totals.net_ledger) >= 0 ? '#28a745' : '#dc3545' },
            ].map(c => (
              <div key={c.label} style={{ background: C.surface, border: `1px solid ${c.color}25`, borderRadius: 6, padding: '10px 18px', flex: 1, minWidth: 130 }}>
                <div style={{ fontSize: 9, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>{c.label}</div>
                <div style={{ fontWeight: 800, color: c.color, fontFamily: 'var(--font-mono)', fontSize: 14 }}>{c.fmt(c.val)}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Toolbar ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: C.muted, fontSize: 12 }}>SHOW</span>
            <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }} style={{ ...inp, width: 70 }}>
              {[10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
              <option value={0}>All</option>
            </select>
            <span style={{ color: C.muted, fontSize: 12 }}>ENTRIES</span>
            {filtered.length > 0 && (
              <button onClick={exportCSV} style={{ padding: '5px 14px', background: C.brand, color: '#000', border: 'none', borderRadius: 4, fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>CSV</button>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: C.muted, fontSize: 12, fontWeight: 700 }}>SEARCH:</span>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ ...inp, width: 200, border: '1px solid #555' }} />
          </div>
        </div>

        {/* ── Table ── */}
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr>
                  {[
                    { label: 'NAME ↕',         align: 'left' },
                    { label: 'OPENING BAL.',    align: 'right' },
                    { label: 'TOTAL DEBIT',     align: 'right' },
                    { label: 'TOTAL CREDIT',    align: 'right' },
                    { label: 'NET LEDGER',      align: 'right' },
                    { label: 'CURRENT BAL.',    align: 'right' },
                    { label: 'ENTRIES',         align: 'right' },
                  ].map(h => (
                    <th key={h.label} style={{ ...thSt, textAlign: h.align }}>{h.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ ...tdSt, textAlign: 'center', padding: 40, color: '#555' }}>Fetching records…</td></tr>
                ) : paged.length === 0 ? (
                  <tr><td colSpan={7} style={{ ...tdSt, textAlign: 'center', padding: 40, color: '#555' }}>
                    {rows.length === 0 ? 'Select filter and click FETCH RECORDS.' : 'No matching records.'}
                  </td></tr>
                ) : paged.map((r, i) => {
                  const netLedger     = Number(r.net_ledger     || 0);
                  const currentBal    = Number(r.current_balance || 0);
                  return (
                    <tr key={i}
                      onMouseEnter={e => e.currentTarget.style.background = C.trHover}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                      {/* NAME */}
                      <td style={{ ...tdSt, fontWeight: 700, color: '#fff' }}>
                        <div>{r.full_name || r.username || '—'}</div>
                        <div style={{ fontSize: 10, color: '#888', fontFamily: 'monospace' }}>{r.username}</div>
                      </td>

                      {/* OPENING BAL (not in backend — show — ) */}
                      <td style={{ ...tdSt, textAlign: 'right', fontFamily: 'monospace', color: '#555' }}>—</td>

                      {/* TOTAL DEBIT */}
                      <td style={{ ...tdSt, textAlign: 'right', fontFamily: 'monospace', color: '#dc3545', fontWeight: 700 }}>
                        ₹{fmt2(r.total_debit)}
                      </td>

                      {/* TOTAL CREDIT */}
                      <td style={{ ...tdSt, textAlign: 'right', fontFamily: 'monospace', color: '#28a745', fontWeight: 700 }}>
                        ₹{fmt2(r.total_credit)}
                      </td>

                      {/* NET LEDGER */}
                      <td style={{ ...tdSt, textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, color: netLedger >= 0 ? '#28a745' : '#dc3545' }}>
                        {netLedger >= 0 ? '▲' : '▼'} ₹{fmt2(Math.abs(netLedger))}
                      </td>

                      {/* CURRENT BAL */}
                      <td style={{ ...tdSt, textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, color: currentBal >= 0 ? '#ffc107' : '#dc3545' }}>
                        ₹{fmt2(Math.abs(currentBal))}
                      </td>

                      {/* ENTRIES count */}
                      <td style={{ ...tdSt, textAlign: 'right', color: '#888' }}>
                        {r.entry_count || 0}
                      </td>
                    </tr>
                  );
                })}

                {/* Totals row */}
                {paged.length > 0 && (
                  <tr style={{ background: '#12122a', borderTop: '2px solid #333' }}>
                    <td style={{ ...tdSt, fontWeight: 800, color: '#fff' }}>TOTALS ({filtered.length})</td>
                    <td style={tdSt} />
                    <td style={{ ...tdSt, textAlign: 'right', fontWeight: 800, color: '#dc3545', fontFamily: 'monospace' }}>
                      ₹{fmt2(totals.total_debit)}
                    </td>
                    <td style={{ ...tdSt, textAlign: 'right', fontWeight: 800, color: '#28a745', fontFamily: 'monospace' }}>
                      ₹{fmt2(totals.total_credit)}
                    </td>
                    <td style={{ ...tdSt, textAlign: 'right', fontWeight: 800, fontFamily: 'monospace', color: Number(totals.net_ledger) >= 0 ? '#28a745' : '#dc3545' }}>
                      {Number(totals.net_ledger) >= 0 ? '▲' : '▼'} ₹{fmt2(Math.abs(totals.net_ledger))}
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
              style={{ padding: '5px 14px', background: page === 1 ? '#1a1a2e' : '#252535', color: page === 1 ? '#555' : '#aaa', border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 12, cursor: page === 1 ? 'default' : 'pointer' }}>Previous</button>
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
              style={{ padding: '5px 14px', background: page === totalPages ? '#1a1a2e' : '#252535', color: page === totalPages ? '#555' : '#aaa', border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 12, cursor: page === totalPages ? 'default' : 'pointer' }}>Next</button>
          </div>
        </div>

      </div>
    </div>
  );
}
