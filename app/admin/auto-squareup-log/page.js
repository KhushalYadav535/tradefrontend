'use client';

import { useState, useCallback } from 'react';
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
const lblSt = { fontSize: 11, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' };
const thSt  = { padding: '9px 12px', fontSize: 10, fontWeight: 800, color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.07em', background: C.th, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap', cursor: 'pointer' };
const tdSt  = { padding: '9px 12px', fontSize: 13, color: C.text, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' };

const fmtDT = v => v ? new Date(v).toLocaleString('en-IN', {
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
}).replace(/\//g, '-') : '—';

export default function AutoSquareUpLogPage() {
  const [fromDate, setFromDate] = useState('');
  const [toDate,   setToDate]   = useState('');
  const [rows,     setRows]     = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [search,   setSearch]   = useState('');
  const [perPage,  setPerPage]  = useState(10);
  const [page,     setPage]     = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (fromDate) params.start_date = fromDate;
      if (toDate)   params.end_date   = toDate;
      const { data } = await api.get('/admin/logs/auto-squareup', { params });
      setRows(data.logs || []);
      setPage(1);
    } catch { setRows([]); } finally { setLoading(false); }
  }, [fromDate, toDate]);

  /* search */
  const filtered = rows.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (r.username || '').toLowerCase().includes(q)
      || (r.full_name || '').toLowerCase().includes(q)
      || String(r.auto_cut_limit || '').includes(q);
  });

  const totalPages = Math.ceil(filtered.length / (perPage || filtered.length)) || 1;
  const paged = perPage === 0 ? filtered : filtered.slice((page - 1) * perPage, page * perPage);

  /* format CLIENT column: "NAME JI(ID)" like screenshot */
  const fmtClient = r => {
    const name = (r.full_name || r.username || '').toUpperCase();
    const id   = r.user_id || r.id || '';
    return id ? `${name}(${id})` : name;
  };

  /* format LIMIT: show number without ₹ like screenshot (200000, 500000) */
  const fmtLimit = v => v ? Number(v).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '—';

  return (
    <div style={{ background: C.bg, minHeight: '100%', color: C.text, fontFamily: 'var(--font-sans, Inter, sans-serif)' }}>

      {/* Header */}
      <div style={{ padding: '13px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontWeight: 800, fontSize: 18, color: '#fff' }}>Auto SquareUp Log</div>
        {rows.length > 0 && (
          <span style={{ background: '#dc354520', color: '#dc3545', border: '1px solid #dc354535', borderRadius: 20, padding: '2px 12px', fontSize: 11, fontWeight: 700 }}>
            {rows.length} events
          </span>
        )}
      </div>

      <div style={{ padding: '14px 20px' }}>

        {/* ══ FILTER: FROM DATE + TO DATE + FIND LOGS ══ */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: '14px 16px', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ ...lblSt, marginBottom: 5 }}>FROM DATE</div>
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={{ ...inp, width: 170 }} />
            </div>
            <div>
              <div style={{ ...lblSt, marginBottom: 5 }}>TO DATE</div>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={{ ...inp, width: 170 }} />
            </div>
            <button onClick={load} disabled={loading}
              style={{ padding: '8px 28px', background: '#1a1a1a', color: '#fff', border: '2px solid #444', borderRadius: 4, fontWeight: 800, fontSize: 13, cursor: 'pointer', letterSpacing: '0.05em', marginBottom: 1 }}>
              {loading ? 'LOADING…' : 'FIND LOGS'}
            </button>
            {rows.length > 0 && (
              <button onClick={() => { setRows([]); setFromDate(''); setToDate(''); }}
                style={{ padding: '8px 18px', background: '#555', color: '#ddd', border: 'none', borderRadius: 4, fontWeight: 700, fontSize: 13, cursor: 'pointer', marginBottom: 1 }}>
                CLEAR
              </button>
            )}
          </div>
        </div>

        {/* ══ TABLE TOOLBAR ══ */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: C.muted, fontSize: 12 }}>SHOW</span>
            <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }}
              style={{ ...inp, width: 70 }}>
              {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
              <option value={0}>All</option>
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
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thSt}>CLIENT ↕</th>
                  <th style={{ ...thSt, textAlign: 'right' }}>LIMIT ↕</th>
                  <th style={thSt}>TIME ↕</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={3} style={{ ...tdSt, textAlign: 'center', padding: 40, color: '#555' }}>Loading logs…</td></tr>
                ) : paged.length === 0 ? (
                  <tr><td colSpan={3} style={{ ...tdSt, textAlign: 'center', padding: 40, color: '#555' }}>No data available in table</td></tr>
                ) : paged.map((r, i) => (
                  <tr key={i}
                    onMouseEnter={e => e.currentTarget.style.background = C.trHover}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                    {/* CLIENT — "NISHU JI(723360)" */}
                    <td style={{ ...tdSt, fontWeight: 600, color: '#e0e0e0', fontSize: 13 }}>
                      {fmtClient(r)}
                    </td>

                    {/* LIMIT — "200000" no ₹ sign, like screenshot */}
                    <td style={{ ...tdSt, textAlign: 'right', fontFamily: 'var(--font-mono)', color: '#ffc107', fontWeight: 700, fontSize: 13 }}>
                      {fmtLimit(r.auto_cut_limit || r.limit_value || r.cut_limit)}
                    </td>

                    {/* TIME — "2026-06-05 19:54:20" */}
                    <td style={{ ...tdSt, color: '#888', fontFamily: 'monospace', fontSize: 12 }}>
                      {fmtDT(r.logged_at || r.created_at || r.time)}
                    </td>
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
            {Array.from({ length: Math.min(5, totalPages) }, (_, k) => {
              const pg = Math.max(1, Math.min(page - 2, totalPages - 4)) + k;
              return pg <= totalPages ? (
                <button key={pg} onClick={() => setPage(pg)}
                  style={{ padding: '5px 10px', background: pg === page ? '#dc3545' : '#252535', color: pg === page ? '#fff' : '#aaa', border: `1px solid ${C.border}`, borderRadius: 4, cursor: 'pointer', fontWeight: pg === page ? 800 : 400, fontSize: 12 }}>
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
