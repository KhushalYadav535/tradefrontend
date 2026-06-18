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
const thSt = { padding: '9px 10px', fontSize: 10, fontWeight: 800, color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.07em', background: C.th, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap', cursor: 'pointer' };
const tdSt = { padding: '8px 10px', fontSize: 12, color: C.text, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' };
const lblSt = { fontSize: 11, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' };

const fmtDT = v => v ? new Date(v).toLocaleString('en-IN', {
  day: '2-digit', month: '2-digit', year: 'numeric',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
}).replace(/\//g, '-') : '—';

/* ─── ACTION BADGE COLORS (AVADH11 exact) ─────────────────────── */
const ACTION_BADGES = {
  'BASIC':           { bg: '#17a2b8', color: '#fff', label: 'BASIC' },
  'MARGIN':          { bg: '#7b4f2e', color: '#fff', label: 'MARGIN L/SCRIPT L' },
  'MARGIN L':        { bg: '#7b4f2e', color: '#fff', label: 'MARGIN L/SCRIPT L' },
  'SCRIPT L':        { bg: '#7b4f2e', color: '#fff', label: 'MARGIN L/SCRIPT L' },
  'MARGIN L/SCRIPT L': { bg: '#7b4f2e', color: '#fff', label: 'MARGIN L/SCRIPT L' },
  'BROKERAGE':       { bg: '#d4891a', color: '#fff', label: 'BROKERAGE' },
  'MARKET':          { bg: '#e83e8c', color: '#fff', label: 'MARKET' },
  'BALANCE':         { bg: '#28a745', color: '#fff', label: 'BALANCE' },
  'PASSWORD':        { bg: '#6f42c1', color: '#fff', label: 'PASSWORD' },
  'STATUS':          { bg: '#dc3545', color: '#fff', label: 'STATUS' },
  'AUTO CUT':        { bg: '#fd7e14', color: '#fff', label: 'AUTO CUT' },
  'COMMISSION':      { bg: '#20c997', color: '#fff', label: 'COMMISSION' },
};

/* Map action string → badge config */
function getBadge(action) {
  if (!action) return { bg: '#555', color: '#fff', label: action || '—' };
  const u = action.toUpperCase().trim();
  // exact match first
  if (ACTION_BADGES[u]) return ACTION_BADGES[u];
  // partial match
  for (const [key, cfg] of Object.entries(ACTION_BADGES)) {
    if (u.includes(key)) return { ...cfg, label: action };
  }
  return { bg: '#555', color: '#fff', label: action };
}

/* Group logs by client + session (within 5 mins) to show merged action badges */
function groupLogs(logs) {
  const groups = [];
  const seen = new Map();

  logs.forEach(log => {
    // key = user_id + 5-min bucket
    const bucket = Math.floor(new Date(log.logged_at || log.created_at).getTime() / (5 * 60 * 1000));
    const key = `${log.target_user || log.user_id}_${bucket}`;

    if (seen.has(key)) {
      const g = seen.get(key);
      const action = log.action || log.field_changed || '';
      if (action && !g.actions.includes(action)) g.actions.push(action);
      // keep latest time
      if (new Date(log.logged_at || log.created_at) > new Date(g.time)) g.time = log.logged_at || log.created_at;
    } else {
      const g = {
        client:     `${log.full_name || log.target_user || log.user_name || '—'} (${log.target_user || log.user_id || '—'}) / ${log.admin_name || 'ADMIN'}`,
        actions:    [(log.action || log.field_changed || 'BASIC')].filter(Boolean),
        time:       log.logged_at || log.created_at,
        ip:         log.ip_address || '—',
        raw:        log,
      };
      seen.set(key, g);
      groups.push(g);
    }
  });

  return groups;
}

export default function UserEditLogPage() {
  const [fromDate, setFromDate] = useState('');
  const [toDate,   setToDate]   = useState('');

  const [rows,    setRows]    = useState([]);
  const [groups,  setGroups]  = useState([]);
  const [loading, setLoading] = useState(false);

  const [search,  setSearch]  = useState('');
  const [perPage, setPerPage] = useState(10);
  const [page,    setPage]    = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (fromDate) params.start_date = fromDate;
      if (toDate)   params.end_date   = toDate;
      const { data } = await api.get('/admin/logs/user-edit', { params });
      const logs = data.logs || [];
      setRows(logs);
      setGroups(groupLogs(logs));
      setPage(1);
    } catch { setRows([]); setGroups([]); } finally { setLoading(false); }
  }, [fromDate, toDate]);

  /* search filter on groups */
  const filtered = groups.filter(g => {
    if (!search) return true;
    const q = search.toLowerCase();
    return g.client.toLowerCase().includes(q)
      || g.actions.some(a => a.toLowerCase().includes(q))
      || (g.ip || '').includes(q);
  });

  const totalPages = Math.ceil(filtered.length / (perPage || filtered.length)) || 1;
  const paged = perPage === 0 ? filtered : filtered.slice((page - 1) * perPage, page * perPage);

  /* CSV */
  const exportCSV = () => {
    const cols = ['Client', 'Actions', 'Time', 'IP Address'];
    const data = filtered.map(g => [g.client, g.actions.join(' | '), g.time ? new Date(g.time).toLocaleString('en-IN') : '—', g.ip]);
    const csv = [cols, ...data].map(r => r.join(',')).join('\n');
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: 'user_edit_log.csv' });
    a.click();
  };

  return (
    <div style={{ background: C.bg, minHeight: '100%', color: C.text, fontFamily: 'var(--font-sans, Inter, sans-serif)' }}>

      {/* Header */}
      <div style={{ padding: '13px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontWeight: 800, fontSize: 18, color: '#fff' }}>User Edit Log</div>
        {groups.length > 0 && <span style={{ background: '#17a2b820', color: '#17a2b8', border: '1px solid #17a2b835', borderRadius: 20, padding: '2px 12px', fontSize: 11, fontWeight: 700 }}>{groups.length} sessions</span>}
      </div>

      <div style={{ padding: '14px 20px' }}>

        {/* ══ FILTER (simple: FROM DATE + TO DATE + FIND LOGS) ══ */}
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
              <button onClick={() => { setRows([]); setGroups([]); setFromDate(''); setToDate(''); }}
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
            {filtered.length > 0 && (
              <button onClick={exportCSV}
                style={{ padding: '5px 14px', background: C.brand, color: '#000', border: 'none', borderRadius: 4, fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>
                CSV
              </button>
            )}
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
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
              <thead>
                <tr>
                  <th style={thSt}>CLIENT ↕</th>
                  <th style={thSt}>ACTION</th>
                  <th style={{ ...thSt, textAlign: 'center' }}>TIME ↕</th>
                  <th style={{ ...thSt, textAlign: 'right' }}>IP ADDRESS ↕</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} style={{ ...tdSt, textAlign: 'center', padding: 40, color: '#555' }}>Loading logs…</td></tr>
                ) : paged.length === 0 ? (
                  <tr><td colSpan={4} style={{ ...tdSt, textAlign: 'center', padding: 40, color: '#555' }}>No data available in table</td></tr>
                ) : paged.map((g, i) => (
                  <tr key={i}
                    onMouseEnter={e => e.currentTarget.style.background = C.trHover}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                    {/* CLIENT */}
                    <td style={{ ...tdSt, maxWidth: 320 }}>
                      <div style={{ fontWeight: 700, color: '#fff', fontSize: 12 }}>
                        {g.client}
                      </div>
                    </td>

                    {/* ACTION badges */}
                    <td style={{ ...tdSt, maxWidth: 420 }}>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                        {/* Always show BASIC */}
                        {(() => {
                          const badges = g.actions.length > 0 ? g.actions : ['BASIC'];
                          // always prepend BASIC if not already there
                          const allBadges = badges.includes('BASIC') ? badges : ['BASIC', ...badges];
                          return allBadges.map((action, ai) => {
                            const { bg, color, label } = getBadge(action);
                            return (
                              <span key={ai} style={{
                                display: 'inline-block',
                                background: bg, color,
                                padding: '4px 12px', borderRadius: 3,
                                fontSize: 11, fontWeight: 800,
                                letterSpacing: '0.03em', cursor: 'default',
                                textTransform: 'uppercase', whiteSpace: 'nowrap',
                              }}>
                                {label}
                              </span>
                            );
                          });
                        })()}
                      </div>
                    </td>

                    {/* TIME */}
                    <td style={{ ...tdSt, textAlign: 'center', color: '#aaa', fontFamily: 'monospace', fontSize: 12 }}>
                      {fmtDT(g.time)}
                    </td>

                    {/* IP ADDRESS */}
                    <td style={{ ...tdSt, textAlign: 'right', color: '#888', fontFamily: 'monospace', fontSize: 12 }}>
                      {g.ip}
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
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pg = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              return pg <= totalPages ? (
                <button key={pg} onClick={() => setPage(pg)}
                  style={{ padding: '5px 10px', background: pg === page ? '#17a2b8' : '#252535', color: pg === page ? '#fff' : '#aaa', border: `1px solid ${C.border}`, borderRadius: 4, cursor: 'pointer', fontWeight: pg === page ? 800 : 400, fontSize: 12 }}>
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
