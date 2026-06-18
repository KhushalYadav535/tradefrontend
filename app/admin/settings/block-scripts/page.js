'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';

/* ─── AVADH11 Design Tokens ─────────────────────────────────────────────── */
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
const inp = {
  background: C.surface, border: `1px solid ${C.border}`, color: C.text,
  borderRadius: 4, padding: '7px 10px', fontSize: 12, outline: 'none', width: '100%',
};
const arr = { position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none', fontSize: 9 };
const lbl = { fontSize: 11, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5, display: 'block' };
const thSt = { padding: '9px 10px', fontSize: 10, fontWeight: 800, color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.07em', background: C.th, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap', cursor: 'pointer' };
const tdSt = { padding: '9px 10px', fontSize: 12, color: C.text, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' };

const MARKETS = ['NSEFUT', 'NSEOPTION', 'MCXFUT', 'MCXOPTION', 'BSEFUT', 'BSEOPTION'];

function Sel({ value, onChange, placeholder, children }) {
  return (
    <div style={{ position: 'relative' }}>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ ...inp, paddingRight: 28, appearance: 'none', cursor: 'pointer' }}>
        {placeholder && <option value="">{placeholder}</option>}
        {children}
      </select>
      <span style={arr}>▼</span>
    </div>
  );
}

export default function BlockAllowScriptsPage() {
  /* dropdown data */
  const [masters,     setMasters]     = useState([]);
  const [allClients,  setAllClients]  = useState([]);
  const [filtClients, setFiltClients] = useState([]);
  const [allScripts,  setAllScripts]  = useState([]);
  const [filtScripts, setFiltScripts] = useState([]);

  /* form selections */
  const [fMaster, setFMaster] = useState('');
  const [fClient, setFClient] = useState('');
  const [fMarket, setFMarket] = useState('');
  const [fScript, setFScript] = useState('');

  /* table data — blocked scripts list (per-client) */
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy,    setBusy]    = useState(false);
  const [search,  setSearch]  = useState('');
  const [perPage, setPerPage] = useState(10);
  const [page,    setPage]    = useState(1);
  const [toast,   setToast]   = useState(null);

  const showToast = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3200); };

  /* ── Load all static data ── */
  useEffect(() => {
    api.get('/admin/masters').then(r => setMasters(r.data.masters || [])).catch(() => {});
    api.get('/admin/students', { params: { role: 'user' } }).then(r => {
      setAllClients(r.data.students || []);
      setFiltClients(r.data.students || []);
    }).catch(() => {});
    api.get('/scripts').then(r => {
      setAllScripts(r.data.scripts || []);
      setFiltScripts(r.data.scripts || []);
    }).catch(() => {});
    loadBlockedRows();
  }, []);

  /* Filter clients by master */
  useEffect(() => {
    if (!fMaster) {
      setFiltClients(allClients);
    } else {
      const mid = Number(fMaster);
      setFiltClients(allClients.filter(c => c.master_id === mid || c.master_id === fMaster));
    }
    setFClient('');
  }, [fMaster, allClients]);

  /* Filter scripts by market */
  useEffect(() => {
    if (!fMarket) {
      setFiltScripts(allScripts);
    } else {
      setFiltScripts(allScripts.filter(s => s.exchange === fMarket));
    }
    setFScript('');
  }, [fMarket, allScripts]);

  /* ── Load blocked rows from settings ── */
  const loadBlockedRows = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/settings/block-scripts');
      // Build display list from only blocked scripts
      const blocked = (data.scripts || []).filter(s => s.is_banned);
      setRows(blocked.map(s => ({
        id:          s.id,
        client_name: '— (Global)',
        market:      s.exchange,
        script:      s.name,
        is_banned:   s.is_banned,
        ban_reason:  s.ban_reason,
        time:        s.updated_at || s.expiry || '',
      })));
    } catch { setRows([]); } finally { setLoading(false); }
  }, []);

  /* ── ADD (Block Script) ── */
  const addBlock = async () => {
    if (!fScript) return showToast('Please select a Script', false);
    const script = allScripts.find(s => String(s.id) === fScript || s.name === fScript);
    if (!script) return showToast('Script not found', false);
    setBusy(true);
    try {
      await api.patch(`/admin/settings/block-scripts/${script.id}`, {
        is_banned: true,
        ban_reason: fClient ? `Blocked for client ${fClient}` : 'Blocked by admin',
      });
      showToast(`"${script.name}" blocked!`);
      setFScript('');
      loadBlockedRows();
    } catch (err) { showToast(err.response?.data?.error || 'Failed', false); } finally { setBusy(false); }
  };

  /* ── REMOVE (Unblock Script) ── */
  const removeBlock = async (id, name) => {
    if (!confirm(`Unblock "${name}"?`)) return;
    try {
      await api.patch(`/admin/settings/block-scripts/${id}`, { is_banned: false, ban_reason: null });
      showToast(`"${name}" unblocked!`);
      loadBlockedRows();
    } catch { showToast('Failed to unblock', false); }
  };

  const clearForm = () => {
    setFMaster(''); setFClient(''); setFMarket(''); setFScript('');
  };

  /* ── Table filter + paginate ── */
  const filtered = rows.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (r.client_name || '').toLowerCase().includes(q)
      || (r.market || '').toLowerCase().includes(q)
      || (r.script || '').toLowerCase().includes(q);
  });
  const totalPages = Math.ceil(filtered.length / perPage) || 1;
  const paged = perPage === 0 ? filtered : filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div style={{ background: C.bg, minHeight: '100%', color: C.text, fontFamily: 'var(--font-sans, Inter, sans-serif)' }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, padding: '12px 20px', borderRadius: 6, fontWeight: 700, fontSize: 13, background: toast.ok ? '#28a745' : '#dc3545', color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
          {toast.ok ? '✅ ' : '❌ '}{toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '13px 20px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontWeight: 800, fontSize: 18, color: '#fff' }}>Block Scripts</div>
      </div>

      <div style={{ padding: '16px 20px' }}>

        {/* ══ FORM ROW ══ */}
        <div style={{ marginBottom: 24 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '160px 160px 170px 200px auto auto',
            gap: 12,
            alignItems: 'end',
          }}>
            {/* MASTER */}
            <div>
              <span style={lbl}>MASTER</span>
              <Sel value={fMaster} onChange={setFMaster} placeholder="Select Master">
                {masters.map(m => <option key={m.id} value={String(m.id)}>{m.full_name || m.username}</option>)}
              </Sel>
            </div>

            {/* CLIENT */}
            <div>
              <span style={lbl}>CLIENT</span>
              <Sel value={fClient} onChange={setFClient} placeholder="Select Client">
                {filtClients.map(c => <option key={c.id} value={String(c.id)}>{c.full_name || c.username}</option>)}
              </Sel>
            </div>

            {/* MARKET */}
            <div>
              <span style={lbl}>MARKET</span>
              <Sel value={fMarket} onChange={setFMarket} placeholder="Select Mar...">
                {MARKETS.map(m => <option key={m} value={m}>{m}</option>)}
              </Sel>
            </div>

            {/* SCRIPT */}
            <div>
              <span style={lbl}>SCRIPT</span>
              <Sel value={fScript} onChange={setFScript} placeholder="Select Script">
                {filtScripts.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
              </Sel>
            </div>

            {/* + ADD button */}
            <div>
              <span style={lbl}>&nbsp;</span>
              <button
                onClick={addBlock} disabled={busy}
                style={{ padding: '8px 20px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 800, fontSize: 13, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.7 : 1, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}
              >
                {busy ? '…' : '+ ADD'}
              </button>
            </div>

            {/* − REMOVE button */}
            <div>
              <span style={lbl}>&nbsp;</span>
              <button
                onClick={clearForm}
                style={{ padding: '8px 20px', background: '#28a745', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 800, fontSize: 13, cursor: 'pointer', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}
              >
                − REMOVE
              </button>
            </div>
          </div>
        </div>

        {/* ══ TOOLBAR ══ */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: C.muted, fontSize: 12 }}>SHOW</span>
            <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }}
              style={{ ...inp, width: 70 }}>
              {[10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
              <option value={0}>All</option>
            </select>
            <span style={{ color: C.muted, fontSize: 12 }}>ENTRIES</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: C.muted, fontSize: 12, fontWeight: 700 }}>SEARCH:</span>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{ ...inp, width: 200, border: '1px solid #555' }} />
          </div>
        </div>

        {/* ══ TABLE ══ */}
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr>
                  {[
                    { h: 'CLIENT NAME ↕', a: 'left' },
                    { h: 'MARKET ↕',      a: 'left' },
                    { h: 'SCRIPT ↕',      a: 'left' },
                    { h: 'TIME ↕',        a: 'left' },
                    { h: 'REMOVE ↕',      a: 'center' },
                  ].map(c => (
                    <th key={c.h} style={{ ...thSt, textAlign: c.a }}>{c.h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ ...tdSt, textAlign: 'center', padding: 40, color: '#555' }}>Loading…</td></tr>
                ) : paged.length === 0 ? (
                  <tr><td colSpan={5} style={{ ...tdSt, textAlign: 'center', padding: 40, color: '#555' }}>No data available in table</td></tr>
                ) : paged.map(r => (
                  <tr key={r.id}
                    onMouseEnter={e => e.currentTarget.style.background = C.trHover}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ ...tdSt, fontWeight: 700, color: '#fff' }}>{r.client_name || '—'}</td>
                    <td style={{ ...tdSt, color: '#aaa' }}>
                      {r.market ? (
                        <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 3, background: '#17a2b820', color: '#17a2b8', border: '1px solid #17a2b840' }}>
                          {r.market}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ ...tdSt, color: '#dc3545', fontWeight: 700 }}>
                      {r.script || '—'}
                    </td>
                    <td style={{ ...tdSt, color: '#888', fontSize: 11, fontFamily: 'monospace' }}>
                      {r.time ? new Date(r.time).toLocaleString('en-IN') : '—'}
                    </td>
                    <td style={{ ...tdSt, textAlign: 'center' }}>
                      <button
                        onClick={() => removeBlock(r.id, r.script)}
                        style={{ padding: '3px 14px', background: '#28a74520', color: '#28a745', border: '1px solid #28a74540', borderRadius: 3, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Unblock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, flexWrap: 'wrap', gap: 8 }}>
          <span style={{ color: C.muted, fontSize: 12 }}>
            Showing {paged.length === 0 ? 0 : (page - 1) * perPage + 1}–{Math.min(page * (perPage || filtered.length), filtered.length)} of {filtered.length} entries
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: '5px 14px', background: page === 1 ? '#1a1a2e' : '#252535', color: page === 1 ? '#555' : '#aaa', border: `1px solid ${C.border}`, borderRadius: 4, cursor: page === 1 ? 'default' : 'pointer', fontSize: 12 }}>Previous</button>
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
              style={{ padding: '5px 14px', background: page === totalPages ? '#1a1a2e' : '#252535', color: page === totalPages ? '#555' : '#aaa', border: `1px solid ${C.border}`, borderRadius: 4, cursor: page === totalPages ? 'default' : 'pointer', fontSize: 12 }}>Next</button>
          </div>
        </div>

      </div>
    </div>
  );
}
