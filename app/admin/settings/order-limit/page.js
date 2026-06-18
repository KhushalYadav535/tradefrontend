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

export default function OrderLimitPage() {
  /* dropdown data */
  const [masters, setMasters] = useState([]);
  const [clients, setClients] = useState([]);
  const [scripts, setScripts] = useState([]);

  /* form */
  const [fMaster,  setFMaster]  = useState('');
  const [fClient,  setFClient]  = useState('');
  const [fMarket,  setFMarket]  = useState('');
  const [fScript,  setFScript]  = useState('');
  const [fType,    setFType]    = useState('PRICE');  // PRICE | PERCENT
  const [fValue,   setFValue]   = useState('');

  /* table */
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy,    setBusy]    = useState(false);
  const [search,  setSearch]  = useState('');
  const [perPage, setPerPage] = useState(10);
  const [page,    setPage]    = useState(1);
  const [toast,   setToast]   = useState(null);

  const showToast = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3200); };

  /* Load dropdown data */
  useEffect(() => {
    api.get('/admin/masters').then(r => setMasters(r.data.masters || [])).catch(() => {});
    api.get('/scripts').then(r => setScripts(r.data.scripts || [])).catch(() => {});
    loadLimits();
  }, []);

  /* When master changes, load its clients */
  useEffect(() => {
    if (fMaster) {
      api.get('/admin/students', { params: { master_id: fMaster, role: 'user' } })
        .then(r => setClients(r.data.students || [])).catch(() => {});
    } else {
      api.get('/admin/students', { params: { role: 'user' } })
        .then(r => setClients(r.data.students || [])).catch(() => {});
    }
    setFClient('');
  }, [fMaster]);

  const loadLimits = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/settings/order-limits');
      // Build display rows from users list
      const raw = data.users || [];
      // Also check for any saved per-script limits in settings
      const saved = data.global_limits?.client_order_limits;
      let extra = [];
      try { extra = typeof saved === 'string' ? JSON.parse(saved) : (Array.isArray(saved) ? saved : []); } catch { extra = []; }
      setRows(extra);
    } catch { setRows([]); } finally { setLoading(false); }
  }, []);

  const submit = async () => {
    if (!fClient) return showToast('Please select a Client', false);
    if (!fValue || Number(fValue) <= 0) return showToast('Enter a valid Value', false);
    setBusy(true);
    try {
      const newRow = {
        id: Date.now().toString(),
        master_id: fMaster, client_id: fClient,
        client_name: clients.find(c => String(c.id) === fClient)?.full_name
          || clients.find(c => String(c.id) === fClient)?.username || fClient,
        market: fMarket, script: fScript,
        price_percent: fType, value: fValue,
        time: new Date().toLocaleString('en-IN'),
      };
      const newRows = [newRow, ...rows];
      // Persist via global settings
      await api.post('/admin/settings/order-limit', {
        global: { client_order_limits: newRows },
      });
      setRows(newRows);
      showToast('Order limit added!');
      setFClient(''); setFMarket(''); setFScript(''); setFValue('');
    } catch (err) { showToast(err.response?.data?.error || 'Failed', false); } finally { setBusy(false); }
  };

  const deleteRow = async (id) => {
    if (!confirm('Delete this limit?')) return;
    const newRows = rows.filter(r => r.id !== id);
    try {
      await api.post('/admin/settings/order-limit', { global: { client_order_limits: newRows } });
      setRows(newRows);
      showToast('Deleted');
    } catch { showToast('Failed to delete', false); }
  };

  /* search + paginate */
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
        <div style={{ fontWeight: 800, fontSize: 18, color: '#fff' }}>Client Order Limit</div>
      </div>

      <div style={{ padding: '16px 20px' }}>

        {/* ══ FORM ══ */}
        <div style={{ marginBottom: 24 }}>

          {/* Row 1: MASTER · CLIENT · MARKET · SCRIPT · PRICE/PERCENT · VALUE */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '160px 160px 160px 180px 130px 140px',
            gap: 12,
            alignItems: 'end',
            marginBottom: 14,
          }}>
            {/* MASTER */}
            <div>
              <span style={lbl}>MASTER</span>
              <Sel value={fMaster} onChange={setFMaster} placeholder="Select...">
                {masters.map(m => <option key={m.id} value={String(m.id)}>{m.full_name || m.username}</option>)}
              </Sel>
            </div>

            {/* CLIENT */}
            <div>
              <span style={lbl}>CLIENT</span>
              <Sel value={fClient} onChange={setFClient} placeholder="Select...">
                {clients.map(c => <option key={c.id} value={String(c.id)}>{c.full_name || c.username}</option>)}
              </Sel>
            </div>

            {/* MARKET */}
            <div>
              <span style={lbl}>MARKET</span>
              <Sel value={fMarket} onChange={setFMarket} placeholder="Select...">
                {MARKETS.map(m => <option key={m} value={m}>{m}</option>)}
              </Sel>
            </div>

            {/* SCRIPT */}
            <div>
              <span style={lbl}>SCRIPT</span>
              <Sel value={fScript} onChange={setFScript} placeholder="Select...">
                {scripts.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </Sel>
            </div>

            {/* PRICE / PERCENT radios */}
            <div>
              <span style={lbl}>&nbsp;</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 4 }}>
                {['PRICE', 'PERCENT'].map(t => (
                  <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: fType === t ? '#6f42c1' : '#888' }}>
                    <input
                      type="radio" name="pricePercent" value={t}
                      checked={fType === t} onChange={() => setFType(t)}
                      style={{ accentColor: '#6f42c1', width: 14, height: 14 }}
                    />
                    {t}
                  </label>
                ))}
              </div>
            </div>

            {/* VALUE */}
            <div>
              <span style={lbl}>VALUE</span>
              <input
                type="number" min="0" step="0.01"
                value={fValue} onChange={e => setFValue(e.target.value)}
                style={inp}
              />
            </div>
          </div>

          {/* SUBMIT + DELETE buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={submit} disabled={busy}
              style={{ padding: '8px 24px', background: '#28a745', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 800, fontSize: 13, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.7 : 1, letterSpacing: '0.04em' }}
            >
              {busy ? '…' : 'SUBMIT'}
            </button>
            <button
              onClick={() => {
                setFMaster(''); setFClient(''); setFMarket('');
                setFScript(''); setFValue(''); setFType('PRICE');
              }}
              style={{ padding: '8px 24px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 800, fontSize: 13, cursor: 'pointer', letterSpacing: '0.04em' }}
            >
              DELETE
            </button>
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
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr>
                  {[
                    { h: 'CLIENT NAME ↕', a: 'left' },
                    { h: 'MARKET ↕',      a: 'left' },
                    { h: 'SCRIPT ↕',      a: 'left' },
                    { h: 'PRICE/PERCENT ↕', a: 'center' },
                    { h: 'VALUE ↕',       a: 'right' },
                    { h: 'TIME ↕',        a: 'left' },
                    { h: 'DELETE',        a: 'center' },
                  ].map(c => (
                    <th key={c.h} style={{ ...thSt, textAlign: c.a }}>{c.h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ ...tdSt, textAlign: 'center', padding: 40, color: '#555' }}>Loading…</td></tr>
                ) : paged.length === 0 ? (
                  <tr><td colSpan={7} style={{ ...tdSt, textAlign: 'center', padding: 40, color: '#555' }}>No data available in table</td></tr>
                ) : paged.map(r => (
                  <tr key={r.id}
                    onMouseEnter={e => e.currentTarget.style.background = C.trHover}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ ...tdSt, fontWeight: 700, color: '#fff' }}>{r.client_name || '—'}</td>
                    <td style={{ ...tdSt, color: '#aaa' }}>{r.market || '—'}</td>
                    <td style={{ ...tdSt, color: '#17a2b8', fontWeight: 600 }}>{r.script || '—'}</td>
                    <td style={{ ...tdSt, textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block', padding: '2px 10px', borderRadius: 3, fontSize: 10, fontWeight: 800,
                        background: r.price_percent === 'PRICE' ? '#6f42c120' : '#17a2b820',
                        color: r.price_percent === 'PRICE' ? '#6f42c1' : '#17a2b8',
                        border: `1px solid ${r.price_percent === 'PRICE' ? '#6f42c140' : '#17a2b840'}`,
                      }}>
                        {r.price_percent || '—'}
                      </span>
                    </td>
                    <td style={{ ...tdSt, textAlign: 'right', fontFamily: 'monospace', color: C.brand, fontWeight: 700 }}>
                      {r.value || '—'}
                    </td>
                    <td style={{ ...tdSt, color: '#888', fontSize: 11 }}>{r.time || '—'}</td>
                    <td style={{ ...tdSt, textAlign: 'center' }}>
                      <button
                        onClick={() => deleteRow(r.id)}
                        style={{ padding: '3px 12px', background: '#dc354520', color: '#dc3545', border: '1px solid #dc354540', borderRadius: 3, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Delete
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
            Showing {paged.length === 0 ? 0 : (page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length} entries
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: '5px 14px', background: page === 1 ? '#1a1a2e' : '#252535', color: page === 1 ? '#555' : '#aaa', border: `1px solid ${C.border}`, borderRadius: 4, cursor: page === 1 ? 'default' : 'pointer', fontSize: 12 }}>Previous</button>
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
              style={{ padding: '5px 14px', background: page === totalPages ? '#1a1a2e' : '#252535', color: page === totalPages ? '#555' : '#aaa', border: `1px solid ${C.border}`, borderRadius: 4, cursor: page === totalPages ? 'default' : 'pointer', fontSize: 12 }}>Next</button>
          </div>
        </div>

      </div>
    </div>
  );
}
