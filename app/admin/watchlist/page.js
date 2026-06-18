'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import api from '@/lib/axios';
import usePrices from '@/hooks/usePrices';
import useVedpragyaExpiries from '@/hooks/useVedpragyaExpiries';
import useVedpragyaStream from '@/hooks/useVedpragyaStream';

/* ─── AVADH11 Tokens ───────────────────────────────────────────────────── */
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
const arr  = { position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none', fontSize: 9 };
const thSt = { padding: '9px 10px', fontSize: 10, fontWeight: 800, color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.07em', background: C.th, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' };
const tdSt = { padding: '9px 12px', fontSize: 12, color: C.text, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' };
const lbl  = { fontSize: 11, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5, display: 'block' };

const fmt2 = n => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const MARKETS = [
  { value: 'NSEFUT',    label: 'NSEFUT',    exchange: 'NSE', isMcx: false },
  { value: 'NSEOPTION', label: 'NSEOPTION', exchange: 'NSE', isMcx: false },
  { value: 'MCXFUT',    label: 'MCXFUT',    exchange: 'MCX', isMcx: true  },
  { value: 'MCXOPTION', label: 'MCXOPTION', exchange: 'MCX', isMcx: true  },
  { value: 'BSEFUT',    label: 'BSEFUT',    exchange: 'BSE', isMcx: false },
  { value: 'BSEOPTION', label: 'BSEOPTION', exchange: 'BSE', isMcx: false },
];

const STORAGE_KEY = 'admin_watchlist_v2';

/* ─── FlashCell ─────────────────────────────────────────────────────────── */
function FlashCell({ value, color, children }) {
  const ref   = useRef(null);
  const prev  = useRef(null);
  const timer = useRef(null);

  useEffect(() => {
    if (value == null) return;
    if (prev.current == null) { prev.current = value; return; }
    if (value === prev.current) return;
    const bg = value > prev.current ? '#28a74540' : '#dc354540';
    prev.current = value;
    const el = ref.current;
    if (!el) return;
    el.style.background = bg;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { if (el) el.style.background = 'transparent'; }, 700);
  }, [value]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return (
    <td ref={ref} style={{ ...tdSt, textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: color || C.text, transition: 'background 0.15s' }}>
      {children ?? (value != null ? fmt2(value) : '—')}
    </td>
  );
}

function Sel({ value, onChange, placeholder, children, minWidth = 0 }) {
  return (
    <div style={{ position: 'relative', minWidth }}>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ ...inp, paddingRight: 28, appearance: 'none', cursor: 'pointer', minWidth }}>
        {placeholder && <option value="">{placeholder}</option>}
        {children}
      </select>
      <span style={arr}>▼</span>
    </div>
  );
}

export default function AdminWatchlistPage() {
  /* REST price feed */
  const { scripts: liveScripts } = usePrices(3000);

  /* watchlist state (localStorage) */
  const [items,  setItems]  = useState([]);
  const [search, setSearch] = useState('');
  const [toast,  setToast]  = useState(null);

  /* add form */
  const [fMarket, setFMarket] = useState('NSEFUT');
  const [fScript, setFScript] = useState('');
  const [fExpiry, setFExpiry] = useState('');

  const showToast = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  /* ── Load watchlist from localStorage ── */
  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')); } catch { setItems([]); }
  }, []);

  const persist = (newItems) => {
    setItems(newItems);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems)); } catch {}
  };

  /* ── Scripts filtered by selected market ── */
  const marketDef = MARKETS.find(m => m.value === fMarket);
  const marketScripts = useMemo(() => {
    if (!fMarket || !liveScripts.length) return [];
    const ex = marketDef?.exchange || fMarket.replace('FUT', '').replace('OPTION', '').replace('OPT', '');
    return [...new Set(liveScripts.filter(s => s.exchange === ex).map(s => s.name))];
  }, [fMarket, liveScripts, marketDef]);

  /* Reset script when market changes */
  useEffect(() => {
    setFScript(marketScripts[0] || '');
    setFExpiry('');
  }, [fMarket]);

  /* Reset expiry when script changes */
  useEffect(() => { setFExpiry(''); }, [fScript]);

  /* ── Vedpragya Expiries for selected script ── */
  const { expiries: vpExpiries, loading: expiriesLoading } = useVedpragyaExpiries(
    fScript,
    fMarket
  );

  /* Auto-select first expiry when list arrives */
  useEffect(() => {
    if (vpExpiries.length > 0 && !fExpiry) {
      setFExpiry(vpExpiries[0]);
    }
  }, [vpExpiries]);

  /* ── ADD to watchlist ── */
  const addScript = () => {
    if (!fScript) return showToast('Select a Script', false);
    if (!fExpiry) return showToast('Select an Expiry', false);

    const dupKey = `${fMarket}|${fScript}|${fExpiry}`;
    if (items.some(i => `${i.market}|${i.name}|${i.expiry}` === dupKey))
      return showToast(`${fScript} (${fExpiry}) already in watchlist`, false);

    const newItem = {
      id:       Date.now(),
      name:     fScript,
      market:   fMarket,
      exchange: marketDef?.exchange || '',
      expiry:   fExpiry,
      /* Symbol key for Vedpragya stream: "SCRIPT EXPIRY:EXCHANGE" */
      vpKey:    fExpiry ? `${fScript} ${fExpiry}:${marketDef?.exchange}` : `${fScript}:${marketDef?.exchange}`,
    };
    persist([...items, newItem]);
    showToast(`${fScript} (${fExpiry}) added!`);
  };

  const removeScript = (id) => {
    persist(items.filter(i => i.id !== id));
    showToast('Removed');
  };

  /* ── Vedpragya live stream ── */
  const watchSymbols = useMemo(() => {
    const seen = new Set();
    return items.map(i => i.vpKey).filter(k => k && !seen.has(k) && seen.add(k));
  }, [items]);

  const { ticks: vpTicks, status: vpStatus } = useVedpragyaStream(watchSymbols);

  /* ── Merge live data ── */
  const rows = useMemo(() => {
    return items
      .filter(item => !search || item.name.toLowerCase().includes(search.toLowerCase()))
      .map(item => {
        const restScript  = liveScripts.find(s => s.name === item.name) || null;
        const tick        = vpTicks[item.vpKey] || vpTicks[item.name] || null;

        const script = restScript
          ? {
              ...restScript,
              ltp:        tick?.ltp        ?? restScript.ltp,
              bid:        tick?.bid        ?? restScript.bid,
              ask:        tick?.ask        ?? restScript.ask,
              net_change: tick?.change     ?? restScript.net_change,
              change_pct: tick?.pchange    ?? restScript.change_pct,
              high:       tick?.ohlc?.h    ?? restScript.high,
              low:        tick?.ohlc?.l    ?? restScript.low,
              open:       tick?.ohlc?.o    ?? restScript.open,
              close:      tick?.ohlc?.c    ?? restScript.close,
              source:     tick ? 'vedpragya' : restScript.source,
            }
          : tick
          ? {
              name:       item.name,
              ltp:        tick.ltp,
              bid:        tick.bid,
              ask:        tick.ask,
              net_change: tick.change,
              change_pct: tick.pchange,
              high:       tick.ohlc?.h,
              low:        tick.ohlc?.l,
              open:       tick.ohlc?.o,
              close:      null,
              source:     'vedpragya',
              is_banned:  false,
            }
          : null;

        return { ...item, script };
      });
  }, [items, liveScripts, vpTicks, search]);

  const isUp = (s) => (s?.net_change || 0) >= 0;

  return (
    <div style={{ background: C.bg, minHeight: '100%', color: C.text, fontFamily: 'var(--font-sans, Inter, sans-serif)' }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, padding: '12px 20px', borderRadius: 6, fontWeight: 700, fontSize: 13, background: toast.ok ? '#28a745' : '#dc3545', color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
          {toast.ok ? '✅ ' : '❌ '}{toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '13px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18, color: '#fff' }}>Watchlist</div>
          <div style={{ fontSize: 11, color: C.muted }}>Live market prices — {items.length} script{items.length !== 1 ? 's' : ''}</div>
        </div>

        {/* Live stream status */}
        {watchSymbols.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: vpStatus === 'live' ? '#28a74515' : vpStatus === 'connecting' ? '#ffc10715' : '#dc354515',
            border: `1px solid ${vpStatus === 'live' ? '#28a74530' : vpStatus === 'connecting' ? '#ffc10730' : '#dc354530'}`,
            borderRadius: 20, padding: '4px 12px',
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%', display: 'inline-block',
              background: vpStatus === 'live' ? '#28a745' : vpStatus === 'connecting' ? '#ffc107' : '#dc3545',
              animation: vpStatus === 'connecting' ? 'pulse 1s infinite' : vpStatus === 'live' ? 'pulse 2s infinite' : 'none',
            }} />
            <span style={{ fontSize: 10, fontWeight: 800, color: vpStatus === 'live' ? '#28a745' : vpStatus === 'connecting' ? '#ffc107' : '#dc3545' }}>
              {vpStatus === 'live' ? 'LIVE (VP)' : vpStatus === 'connecting' ? 'CONNECTING…' : vpStatus === 'error' ? 'ERROR' : 'IDLE'}
            </span>
          </div>
        )}
      </div>

      <div style={{ padding: '16px 20px' }}>

        {/* ══ ADD FORM ══ */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: '16px 20px', marginBottom: 20 }}>

          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr 1fr 110px', gap: 14, alignItems: 'end', marginBottom: 12 }}>

            {/* MARKET */}
            <div>
              <span style={lbl}>MARKET</span>
              <Sel value={fMarket} onChange={setFMarket}>
                {MARKETS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </Sel>
            </div>

            {/* SCRIPT */}
            <div>
              <span style={lbl}>SCRIPT</span>
              <Sel value={fScript} onChange={setFScript} placeholder={marketScripts.length === 0 ? 'Loading…' : 'Select Script'}>
                {marketScripts.map(s => <option key={s} value={s}>{s}</option>)}
              </Sel>
            </div>

            {/* EXPIRY — from Vedpragya */}
            <div>
              <span style={lbl}>
                EXPIRY
                {expiriesLoading && <span style={{ color: '#ffc107', fontSize: 9, marginLeft: 6 }}>⏳ loading…</span>}
                {!expiriesLoading && fScript && vpExpiries.length === 0 && (
                  <span style={{ color: '#888', fontSize: 9, marginLeft: 6 }}>no expiries found</span>
                )}
              </span>
              <Sel value={fExpiry} onChange={setFExpiry} placeholder={expiriesLoading ? 'Loading…' : 'Select Expiry'}>
                {vpExpiries.map(e => <option key={e} value={e}>{e}</option>)}
              </Sel>
            </div>

            {/* ADD button */}
            <div>
              <span style={lbl}>&nbsp;</span>
              <button
                onClick={addScript}
                style={{ padding: '8px 0', width: '100%', background: '#28a745', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 800, fontSize: 13, cursor: 'pointer', letterSpacing: '0.04em' }}
              >
                + ADD
              </button>
            </div>
          </div>

          {/* Search + Clear All row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: C.muted, fontSize: 12, fontWeight: 700 }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search scripts…"
                style={{ ...inp, width: 220, border: '1px solid #555' }} />
            </div>
            {items.length > 0 && (
              <button
                onClick={() => { if (confirm('Clear all?')) persist([]); }}
                style={{ padding: '5px 16px', background: '#dc354520', color: '#dc3545', border: '1px solid #dc354540', borderRadius: 4, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* ══ LIVE TABLE ══ */}
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 950 }}>
              <thead>
                <tr>
                  {[
                    { h: 'SYMBOL',     a: 'left'  },
                    { h: 'EXPIRY',     a: 'left'  },
                    { h: 'MARKET',     a: 'left'  },
                    { h: 'BID',        a: 'right' },
                    { h: 'ASK',        a: 'right' },
                    { h: 'LTP',        a: 'right' },
                    { h: 'CHANGE %',   a: 'right' },
                    { h: 'NET CHANGE', a: 'right' },
                    { h: 'HIGH',       a: 'right' },
                    { h: 'LOW',        a: 'right' },
                    { h: 'OPEN',       a: 'right' },
                    { h: 'CLOSE',      a: 'right' },
                    { h: '',           a: 'center'},
                  ].map(c => (
                    <th key={c.h} style={{ ...thSt, textAlign: c.a }}>{c.h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={13} style={{ ...tdSt, textAlign: 'center', padding: 50, color: '#555' }}>
                      {items.length === 0
                        ? '📋 Watchlist is empty — select Market, Script & Expiry then click + ADD'
                        : 'No matching scripts'}
                    </td>
                  </tr>
                ) : rows.map(r => {
                  const s   = r.script;
                  const up  = isUp(s);
                  return (
                    <tr key={r.id}
                      onMouseEnter={e => e.currentTarget.style.background = C.trHover}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                      {/* SYMBOL */}
                      <td style={{ ...tdSt, fontWeight: 700, color: '#fff' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>{r.name}</span>
                          {s?.is_banned && (
                            <span style={{ fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 3, background: '#dc354520', color: '#dc3545', border: '1px solid #dc354440' }}>BAN</span>
                          )}
                          {s?.source === 'vedpragya' && (
                            <span style={{ fontSize: 8, fontWeight: 800, padding: '1px 5px', borderRadius: 3, background: '#28a74515', color: '#28a745', border: '1px solid #28a74530' }}>VP</span>
                          )}
                        </div>
                      </td>

                      {/* EXPIRY */}
                      <td style={{ ...tdSt, color: '#aaa', fontSize: 11, fontFamily: 'monospace' }}>
                        {r.expiry || '—'}
                      </td>

                      {/* MARKET */}
                      <td style={{ ...tdSt }}>
                        <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 3, background: '#17a2b820', color: '#17a2b8', border: '1px solid #17a2b840' }}>
                          {r.market}
                        </span>
                      </td>

                      {/* BID */}
                      <FlashCell value={s?.bid} color="#dc3545" />
                      {/* ASK */}
                      <FlashCell value={s?.ask} color="#28a745" />

                      {/* LTP */}
                      <FlashCell value={s?.ltp} color={s ? (up ? '#28a745' : '#dc3545') : C.muted}>
                        {s ? fmt2(s.ltp) : '—'}
                      </FlashCell>

                      {/* CHANGE % */}
                      <td style={{ ...tdSt, textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: s ? (up ? '#28a745' : '#dc3545') : C.muted }}>
                        {s ? `${up ? '+' : ''}${fmt2(s.change_pct)}%` : '—'}
                      </td>

                      {/* NET CHANGE */}
                      <td style={{ ...tdSt, textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: s ? (up ? '#28a745' : '#dc3545') : C.muted }}>
                        {s ? `${up ? '▲' : '▼'} ${fmt2(Math.abs(s.net_change || 0))}` : '—'}
                      </td>

                      {/* HIGH */}
                      <FlashCell value={s?.high} color="#ffc107" />
                      {/* LOW */}
                      <FlashCell value={s?.low}  color="#17a2b8" />
                      {/* OPEN */}
                      <FlashCell value={s?.open} />
                      {/* CLOSE */}
                      <FlashCell value={s?.close} />

                      {/* REMOVE */}
                      <td style={{ ...tdSt, textAlign: 'center' }}>
                        <button
                          onClick={() => removeScript(r.id)}
                          style={{ width: 26, height: 26, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#dc354515', color: '#dc3545', border: '1px solid #dc354440', borderRadius: 3, fontSize: 16, fontWeight: 900, cursor: 'pointer', lineHeight: 1 }}
                          title="Remove"
                        >×</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {rows.length > 0 && (
          <div style={{ marginTop: 8, color: C.muted, fontSize: 11 }}>
            {rows.length} script{rows.length !== 1 ? 's' : ''} shown
          </div>
        )}

      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  );
}
