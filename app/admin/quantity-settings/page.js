'use client';

import { useState, useCallback, useEffect } from 'react';
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
  background: C.surface,
  border: `1px solid ${C.border}`,
  color: C.text,
  borderRadius: 4,
  padding: '7px 10px',
  fontSize: 12,
  outline: 'none',
  width: '100%',
};
const arr = {
  position: 'absolute', right: 8, top: '50%',
  transform: 'translateY(-50%)', color: '#666',
  pointerEvents: 'none', fontSize: 9,
};
const lbl = {
  fontSize: 11, fontWeight: 800, color: C.muted,
  textTransform: 'uppercase', letterSpacing: '0.07em',
  marginBottom: 5, display: 'block',
};
const thSt = {
  padding: '9px 12px', fontSize: 10, fontWeight: 800,
  color: '#bbb', textTransform: 'uppercase',
  letterSpacing: '0.07em', background: C.th,
  borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap',
};
const tdSt = {
  padding: '9px 12px', fontSize: 12, color: C.text,
  borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap',
};

function Sel({ value, onChange, placeholder, children }) {
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ ...inp, paddingRight: 28, appearance: 'none', cursor: 'pointer' }}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {children}
      </select>
      <span style={arr}>▼</span>
    </div>
  );
}

/* ─── Constants ─────────────────────────────────────────────────────────── */
const LEVELS = [
  'Extra Small', 'Small', 'Medium', 'Large', 'Extra Large',
  '1 LOT', '2 LOT', '3 LOT', '4 LOT', '5 LOT', '10 LOT',
];
const MARKETS = [
  'NSEFUT', 'NSEOPTION', 'MCXFUT', 'MCXOPTION', 'BSEFUT', 'BSEOPTION',
];

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function QuantitySettingsPage() {
  /* script list */
  const [scripts, setScripts] = useState([]);

  /* ADD form fields */
  const [fLevel,    setFLevel]    = useState('');
  const [fMarket,   setFMarket]   = useState('');
  const [fScript,   setFScript]   = useState('');
  const [fPosition, setFPosition] = useState('');
  const [fMinOrd,   setFMinOrd]   = useState('');
  const [fMaxOrd,   setFMaxOrd]   = useState('');

  /* FIND filter */
  const [filterLevel, setFilterLevel] = useState('');

  /* data */
  const [rules,   setRules]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy,    setBusy]    = useState(false);
  const [toast,   setToast]   = useState(null);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3200);
  };

  /* ── Load ── */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, qRes] = await Promise.allSettled([
        api.get('/scripts'),
        api.get('/admin/settings/quantity'),
      ]);
      if (sRes.status === 'fulfilled') {
        setScripts(sRes.value.data.scripts || []);
      }
      if (qRes.status === 'fulfilled') {
        const raw = qRes.value.data.qty_settings?.qty_rules;
        try {
          setRules(typeof raw === 'string' ? JSON.parse(raw) : (Array.isArray(raw) ? raw : []));
        } catch { setRules([]); }
      }
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Save rules to backend ── */
  const saveRules = async (newRules) => {
    try {
      await api.post('/admin/settings/quantity', { qty_rules: newRules });
      setRules(newRules);
    } catch { showToast('Failed to save', false); }
  };

  /* ── ADD ── */
  const addRule = async () => {
    if (!fLevel)    return showToast('Select a Level', false);
    if (!fPosition) return showToast('Enter Position', false);
    if (!fMinOrd)   return showToast('Enter Min Order', false);
    if (!fMaxOrd)   return showToast('Enter Max Order', false);

    setBusy(true);
    const newRule = {
      id:       Date.now().toString(),
      level:    fLevel,
      market:   fMarket,
      script:   fScript,
      position: fPosition,
      min_order: fMinOrd,
      max_order: fMaxOrd,
    };
    await saveRules([newRule, ...rules]);
    setFLevel(''); setFMarket(''); setFScript('');
    setFPosition(''); setFMinOrd(''); setFMaxOrd('');
    showToast('Rule added!');
    setBusy(false);
  };

  /* ── DELETE ── */
  const delRule = async (id) => {
    if (!confirm('Delete this rule?')) return;
    await saveRules(rules.filter(r => r.id !== id));
    showToast('Deleted');
  };

  /* filtered by LEVEL */
  const displayed = filterLevel
    ? rules.filter(r => r.level === filterLevel)
    : rules;

  /* ─── Render ──────────────────────────────────────────────────────────── */
  return (
    <div style={{ background: C.bg, minHeight: '100%', color: C.text, fontFamily: 'var(--font-sans, Inter, sans-serif)' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          padding: '12px 20px', borderRadius: 6, fontWeight: 700, fontSize: 13,
          background: toast.ok ? '#28a745' : '#dc3545', color: '#fff',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        }}>
          {toast.ok ? '✅ ' : '❌ '}{toast.msg}
        </div>
      )}

      {/* ── Page Header ── */}
      <div style={{ padding: '13px 20px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontWeight: 800, fontSize: 18, color: '#fff' }}>Max Quantity Details</div>
      </div>

      <div style={{ padding: '16px 20px' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 18 }}>
          Max Quantity Details
        </div>

        {/* ══════════ ADD FORM ══════════ */}
        <div style={{ marginBottom: 30 }}>

          {/* Row: 6 columns (LEVEL, MARKET, SCRIPT, POSITION, MIN ORDER, MAX ORDER) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '160px 160px 180px 140px 140px 140px',
            gap: 12,
            alignItems: 'end',
            marginBottom: 14,
            overflowX: 'auto',
          }}>
            {/* LEVEL */}
            <div>
              <span style={lbl}>LEVEL</span>
              <Sel value={fLevel} onChange={setFLevel} placeholder="Select Level">
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </Sel>
            </div>

            {/* MARKET */}
            <div>
              <span style={lbl}>MARKET</span>
              <Sel value={fMarket} onChange={setFMarket} placeholder="Select Market">
                {MARKETS.map(m => <option key={m} value={m}>{m}</option>)}
              </Sel>
            </div>

            {/* SCRIPT */}
            <div>
              <span style={lbl}>SCRIPT</span>
              <Sel value={fScript} onChange={setFScript} placeholder="Select Script">
                {scripts.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </Sel>
            </div>

            {/* POSITION */}
            <div>
              <span style={lbl}>POSITION</span>
              <input
                value={fPosition}
                onChange={e => setFPosition(e.target.value)}
                placeholder="Position"
                type="number" min="0"
                style={inp}
              />
            </div>

            {/* MIN ORDER */}
            <div>
              <span style={lbl}>MIN ORDER</span>
              <input
                value={fMinOrd}
                onChange={e => setFMinOrd(e.target.value)}
                placeholder="Min Order"
                type="number" min="0"
                style={inp}
              />
            </div>

            {/* MAX ORDER */}
            <div>
              <span style={lbl}>MAX ORDER</span>
              <input
                value={fMaxOrd}
                onChange={e => setFMaxOrd(e.target.value)}
                placeholder="Max Order"
                type="number" min="0"
                style={inp}
              />
            </div>
          </div>

          {/* + ADD button */}
          <button
            onClick={addRule}
            disabled={busy}
            style={{
              padding: '8px 22px',
              background: '#28a745',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              fontWeight: 800,
              fontSize: 13,
              cursor: busy ? 'default' : 'pointer',
              opacity: busy ? 0.7 : 1,
              letterSpacing: '0.04em',
            }}
          >
            {busy ? '…' : '+ ADD'}
          </button>
        </div>

        {/* ══════════ FIND FILTER ══════════ */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
            <div style={{ width: 180 }}>
              <span style={lbl}>LEVEL</span>
              <Sel value={filterLevel} onChange={setFilterLevel} placeholder="Select Level">
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </Sel>
            </div>
            <button
              onClick={() => {/* filter already reactive */}}
              style={{
                padding: '8px 22px',
                background: '#17a2b8',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
                letterSpacing: '0.04em',
              }}
            >
              + FIND
            </button>
            {filterLevel && (
              <button
                onClick={() => setFilterLevel('')}
                style={{ padding: '8px 14px', background: '#555', color: '#ddd', border: 'none', borderRadius: 4, fontWeight: 600, fontSize: 12, cursor: 'pointer' }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* ══════════ TABLE ══════════ */}
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr>
                  {[
                    { h: 'LEVEL',          w: '18%' },
                    { h: 'MARKET',         w: '18%' },
                    { h: 'SCRIPT',         w: '20%' },
                    { h: 'POSITION LIMIT', w: '18%' },
                    { h: 'MAX ORDER',      w: '16%' },
                    { h: 'ACTION',         w: '10%' },
                  ].map(c => (
                    <th key={c.h} style={{ ...thSt, width: c.w, textAlign: ['POSITION LIMIT', 'MAX ORDER', 'ACTION'].includes(c.h) ? 'center' : 'left' }}>
                      {c.h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ ...tdSt, textAlign: 'center', padding: 40, color: '#555' }}>Loading…</td>
                  </tr>
                ) : displayed.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ ...tdSt, textAlign: 'center', padding: 40, color: '#555' }}>No data available</td>
                  </tr>
                ) : displayed.map(r => (
                  <tr
                    key={r.id}
                    onMouseEnter={e => e.currentTarget.style.background = C.trHover}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* LEVEL */}
                    <td style={{ ...tdSt, fontWeight: 700, color: '#fff' }}>
                      <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 3, fontSize: 11, background: '#6f42c120', color: '#6f42c1', border: '1px solid #6f42c140', fontWeight: 800 }}>
                        {r.level || '—'}
                      </span>
                    </td>

                    {/* MARKET */}
                    <td style={{ ...tdSt, color: '#aaa' }}>
                      {r.market || <span style={{ color: '#444' }}>—</span>}
                    </td>

                    {/* SCRIPT */}
                    <td style={{ ...tdSt, color: '#17a2b8', fontWeight: 600 }}>
                      {r.script || <span style={{ color: '#444' }}>—</span>}
                    </td>

                    {/* POSITION LIMIT */}
                    <td style={{ ...tdSt, textAlign: 'center', fontFamily: 'monospace', color: C.brand, fontWeight: 700 }}>
                      {r.position || '—'}
                    </td>

                    {/* MAX ORDER */}
                    <td style={{ ...tdSt, textAlign: 'center', fontFamily: 'monospace', color: '#dc3545', fontWeight: 700 }}>
                      {r.max_order || '—'}
                    </td>

                    {/* ACTION */}
                    <td style={{ ...tdSt, textAlign: 'center' }}>
                      <button
                        onClick={() => delRule(r.id)}
                        style={{
                          padding: '3px 12px',
                          background: '#dc354520',
                          color: '#dc3545',
                          border: '1px solid #dc354540',
                          borderRadius: 3,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
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

        {/* Record count */}
        {displayed.length > 0 && (
          <div style={{ marginTop: 8, color: C.muted, fontSize: 11 }}>
            Showing {displayed.length} rule{displayed.length !== 1 ? 's' : ''}
            {filterLevel ? ` for level "${filterLevel}"` : ''}
          </div>
        )}

      </div>
    </div>
  );
}
