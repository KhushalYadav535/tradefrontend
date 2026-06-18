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
  const [scripts, setScripts] = useState([]);

  /* ADD form */
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

  const saveRules = async (newRules) => {
    try {
      await api.post('/admin/settings/quantity', { qty_rules: newRules });
      setRules(newRules);
    } catch { showToast('Failed to save', false); }
  };

  const addRule = async () => {
    if (!fLevel)    return showToast('Select a Level', false);
    if (!fPosition) return showToast('Enter Position', false);
    if (!fMinOrd)   return showToast('Enter Min Order', false);
    if (!fMaxOrd)   return showToast('Enter Max Order', false);
    setBusy(true);
    const newRule = {
      id: Date.now().toString(),
      level: fLevel, market: fMarket, script: fScript,
      position: fPosition, min_order: fMinOrd, max_order: fMaxOrd,
    };
    await saveRules([newRule, ...rules]);
    setFLevel(''); setFMarket(''); setFScript('');
    setFPosition(''); setFMinOrd(''); setFMaxOrd('');
    showToast('Rule added!');
    setBusy(false);
  };

  const delRule = async (id) => {
    if (!confirm('Delete this rule?')) return;
    await saveRules(rules.filter(r => r.id !== id));
    showToast('Deleted');
  };

  const displayed = filterLevel
    ? rules.filter(r => r.level === filterLevel)
    : rules;

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

      {/* Header */}
      <div style={{ padding: '13px 20px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontWeight: 800, fontSize: 18, color: '#fff' }}>Max Quantity Details</div>
      </div>

      <div style={{ padding: '16px 20px' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 20 }}>
          Max Quantity Details
        </div>

        {/* ══ ADD FORM ══ */}
        <div style={{ marginBottom: 28 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '160px 160px 180px 130px 130px 130px',
            gap: 14,
            alignItems: 'end',
            marginBottom: 14,
          }}>
            <div>
              <span style={lbl}>LEVEL</span>
              <Sel value={fLevel} onChange={setFLevel} placeholder="Select Level">
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </Sel>
            </div>
            <div>
              <span style={lbl}>MARKET</span>
              <Sel value={fMarket} onChange={setFMarket} placeholder="Select Market">
                {MARKETS.map(m => <option key={m} value={m}>{m}</option>)}
              </Sel>
            </div>
            <div>
              <span style={lbl}>SCRIPT</span>
              <Sel value={fScript} onChange={setFScript} placeholder="Select Script">
                {scripts.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </Sel>
            </div>
            <div>
              <span style={lbl}>POSITION</span>
              <input
                value={fPosition} onChange={e => setFPosition(e.target.value)}
                placeholder="Position" type="number" min="0" style={inp}
              />
            </div>
            <div>
              <span style={lbl}>MIN ORDER</span>
              <input
                value={fMinOrd} onChange={e => setFMinOrd(e.target.value)}
                placeholder="Min Order" type="number" min="0" style={inp}
              />
            </div>
            <div>
              <span style={lbl}>MAX ORDER</span>
              <input
                value={fMaxOrd} onChange={e => setFMaxOrd(e.target.value)}
                placeholder="Max Order" type="number" min="0" style={inp}
              />
            </div>
          </div>

          <button
            onClick={addRule} disabled={busy}
            style={{
              padding: '8px 22px', background: '#28a745', color: '#fff',
              border: 'none', borderRadius: 4, fontWeight: 800, fontSize: 13,
              cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.7 : 1,
              letterSpacing: '0.04em',
            }}
          >
            {busy ? '…' : '+ ADD'}
          </button>
        </div>

        <div style={{ height: 1, background: C.border, marginBottom: 20 }} />

        {/* ══ FIND FILTER ══ */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
            <div style={{ width: 180 }}>
              <span style={lbl}>LEVEL</span>
              <Sel value={filterLevel} onChange={setFilterLevel} placeholder="Select Level">
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </Sel>
            </div>
            <button
              style={{
                padding: '8px 22px', background: '#17a2b8', color: '#fff',
                border: 'none', borderRadius: 4, fontWeight: 800, fontSize: 13,
                cursor: 'pointer', letterSpacing: '0.04em',
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

        {/* ══ TABLE ══ */}
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr>
                  {[
                    { h: 'LEVEL',          align: 'left' },
                    { h: 'MARKET',         align: 'left' },
                    { h: 'SCRIPT',         align: 'left' },
                    { h: 'POSITION LIMIT', align: 'center' },
                    { h: 'MAX ORDER',      align: 'center' },
                    { h: '',               align: 'center' },
                  ].map((c, i) => (
                    <th key={i} style={{ ...thSt, textAlign: c.align }}>{c.h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ ...tdSt, textAlign: 'center', padding: 40, color: '#555' }}>Loading…</td></tr>
                ) : displayed.length === 0 ? (
                  <tr><td colSpan={6} style={{ ...tdSt, textAlign: 'center', padding: 40, color: '#555' }}>No data available</td></tr>
                ) : displayed.map(r => (
                  <tr
                    key={r.id}
                    onMouseEnter={e => e.currentTarget.style.background = C.trHover}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ ...tdSt, fontWeight: 700 }}>
                      <span style={{
                        display: 'inline-block', padding: '2px 10px', borderRadius: 3,
                        fontSize: 11, background: '#6f42c120', color: '#6f42c1',
                        border: '1px solid #6f42c140', fontWeight: 800,
                      }}>
                        {r.level || '—'}
                      </span>
                    </td>
                    <td style={{ ...tdSt, color: '#aaa' }}>{r.market || '—'}</td>
                    <td style={{ ...tdSt, color: '#17a2b8', fontWeight: 600 }}>{r.script || '—'}</td>
                    <td style={{ ...tdSt, textAlign: 'center', fontFamily: 'monospace', color: C.brand, fontWeight: 700 }}>{r.position || '—'}</td>
                    <td style={{ ...tdSt, textAlign: 'center', fontFamily: 'monospace', color: '#dc3545', fontWeight: 700 }}>{r.max_order || '—'}</td>
                    <td style={{ ...tdSt, textAlign: 'center' }}>
                      <button
                        onClick={() => delRule(r.id)}
                        style={{
                          padding: '3px 12px', background: '#dc354520', color: '#dc3545',
                          border: '1px solid #dc354540', borderRadius: 3,
                          fontSize: 11, fontWeight: 700, cursor: 'pointer',
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

        {displayed.length > 0 && (
          <div style={{ marginTop: 8, color: C.muted, fontSize: 11 }}>
            {displayed.length} rule{displayed.length !== 1 ? 's' : ''}
            {filterLevel ? ` for "${filterLevel}"` : ' total'}
          </div>
        )}

      </div>
    </div>
  );
}
