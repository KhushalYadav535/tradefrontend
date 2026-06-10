'use client';

import { useEffect, useMemo, useState } from 'react';
import usePrices from '@/hooks/usePrices';
import InlineOrderPanel from '@/components/InlineOrderPanel';
import EmptyState from '@/components/EmptyState';
import Combobox from '@/components/Combobox';
import { useToast } from '@/components/Toast';
import { EXPIRY_CATALOG } from '@/lib/catalog';
import useOptionChain from '@/hooks/useOptionChain';
import api from '@/lib/axios';
import VedpragyaSearch from '@/components/VedpragyaSearch';
import useVedpragyaStream from '@/hooks/useVedpragyaStream';

const STORAGE_KEY = 'avadh15_watchlist_v2';

// Map DB row → local item shape
function dbRowToItem(r) {
  return {
    id: r.id,
    key: watchKey(r.segment, r.name, r.expiry, r.option_type, r.strike),
    segment: r.segment,
    name: r.name,
    expiry: r.expiry || '',
    optionType: r.option_type || '',
    strike: r.strike || '',
  };
}

function fmt(n, d = 2) {
  return Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
}

function watchKey(seg, name, expiry, optionType, strike) {
  return [seg, name, expiry, optionType, strike].filter(Boolean).join('|');
}

function loadWatch() {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function saveWatch(items) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch {}
}

function ScriptTable({ title, rows, onTrade, onRemove, segmentLabel }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="mb-6">
      <div className={`flex items-center bg-surface border border-border ${collapsed ? 'rounded' : 'border-b-0 rounded-t'}`}>
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="w-10 h-10 flex items-center justify-center text-muted hover:text-fg"
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className={`transition-transform ${collapsed ? '-rotate-90' : ''}`}>
            <polygon points="6,9 18,9 12,16" />
          </svg>
        </button>
        <span className="text-xs text-muted font-semibold tracking-wider">{segmentLabel} · {rows.length}</span>
        <div className="flex-1" />
      </div>
      {!collapsed && (
        <div className="border border-border rounded-b bg-surface overflow-hidden">
          
          {/* Mobile Layout (Cards) — matches professional trading app style */}
          <div className="flex flex-col md:hidden">
            {rows.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted">No scripts in this segment. Use the filters above and click + to add.</div>
            ) : rows.map((r) => {
              const s = r.script;
              const tradable = !!(s && r.tradable);
              const up = (s?.net_change || 0) >= 0;
              const optSuffix = r.optionType && r.strike ? ` ${r.strike} ${r.optionType}` : '';

              return (
                <div key={r.key} className="border-b border-border/40 last:border-b-0">
                  {/* Row 1: change info (left) + Q / LTP (right) */}
                  <div className="flex items-center justify-between px-3 pt-2.5 pb-1 gap-3">
                    <div className="flex items-center gap-1.5">
                      {s ? (
                        <span className={`text-[13px] font-semibold ${up ? 'text-accent' : 'text-red'}`}>
                          {up ? '▲' : '▼'} {fmt(Math.abs(s.net_change || 0))} {fmt(s.change_pct)}%
                        </span>
                      ) : (
                        <span className="text-xs text-muted italic">No quote</span>
                      )}
                      {!tradable && <span className="badge-warn text-[9px] px-1 py-0">QUOTE</span>}
                      {s?.is_banned && <span className="badge-bad text-[9px] px-1 py-0">BAN</span>}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted shrink-0">
                      <span>Q : <span className="text-fg font-semibold">0</span></span>
                      {s && (
                        <span className="flex items-center gap-1">
                          LTP : <span className="price font-bold text-fg">{fmt(s.ltp)}</span>
                          {s.source && (
                            <span className={`text-[8px] font-bold px-1 py-0.5 rounded ${s.source === 'vedpragya' ? 'bg-green-500/15 text-green-400' : s.source === 'yahoo' ? 'bg-blue-500/15 text-blue-400' : s.source === 'nse' ? 'bg-orange-500/15 text-orange-400' : 'bg-surface2 text-muted'}`}>
                            {s.source === 'vedpragya' ? 'VP' : s.source === 'yahoo' ? 'YH' : s.source === 'nse' ? 'NSE' : 'SIM'}
                          </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Script name + expiry */}
                  <div className="px-3 pb-2">
                    <div className="font-bold text-fg text-[16px] leading-tight tracking-tight">{r.name}</div>
                    <div className="text-muted text-[12px] font-medium mt-0.5">{r.expiry}{optSuffix}</div>
                  </div>

                  {/* Row 3: BID / ASK big buttons */}
                  {s ? (
                    <div className="flex gap-0 border-t border-border/30">
                      <button
                        onClick={() => tradable && !s.is_banned && onTrade(s, 'SELL')}
                        className="flex-1 py-3 flex flex-col items-center justify-center active:opacity-80 transition-opacity"
                        style={{ background: 'rgb(var(--bid-bg))', color: 'rgb(var(--bid-fg))' }}
                      >
                        <span className="font-bold text-[17px] leading-tight price">{fmt(s.bid)}</span>
                        <span className="text-[11px] opacity-75 mt-0.5">H : {fmt(s.high)}</span>
                      </button>
                      <button
                        onClick={() => tradable && !s.is_banned && onTrade(s, 'BUY')}
                        className="flex-1 py-3 flex flex-col items-center justify-center active:opacity-80 transition-opacity border-l border-black/20"
                        style={{ background: 'rgb(var(--ask-bg))', color: 'rgb(var(--ask-fg))' }}
                      >
                        <span className="font-bold text-[17px] leading-tight price">{fmt(s.ask)}</span>
                        <span className="text-[11px] opacity-75 mt-0.5">L : {fmt(s.low)}</span>
                      </button>
                      <button
                        onClick={() => onRemove(r.key)}
                        className="w-10 flex items-center justify-center bg-surface2 text-muted border-l border-border/30 active:text-red transition-colors"
                        title="Remove"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between px-3 py-2 border-t border-border/30 bg-surface2/30">
                      <span className="text-xs text-muted italic">Live quote not available</span>
                      <button onClick={() => onRemove(r.key)} className="text-red text-xs font-bold px-2 py-1 bg-red/10 rounded">REMOVE</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop Layout (Table) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="qtable">
              <thead>
                <tr>
                  <th className="text-left">{title} SYM</th>
                  <th>BID RATE</th>
                  <th>ASK RATE</th>
                  <th>LTP</th>
                  <th>CHANGE %</th>
                  <th>NET CHANGE</th>
                  <th>HIGH</th>
                  <th>LOW</th>
                  <th>OPEN</th>
                  <th>CLOSE</th>
                  <th>REMOVE</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={11} className="py-8 text-muted text-center">No scripts in this segment. Use the filters above and click + to add.</td></tr>
                ) : rows.map((r) => {
                  const s = r.script;
                  const tradable = r.tradable;
                  const up = (s?.net_change || 0) >= 0;
                  const optSuffix = r.optionType && r.strike ? ` ${r.strike} ${r.optionType}` : '';
                  const onRowClick = () => tradable && !s?.is_banned && onTrade(s, 'BUY');
                  return (
                    <tr key={r.key} className={tradable ? 'cursor-pointer' : ''} onClick={onRowClick}>
                      <td className="sym">
                        <div className="flex items-center gap-1.5">
                          <span>{r.name}</span>
                          <span className="text-muted text-[11px]">{r.expiry}{optSuffix}</span>
                          {!tradable && <span className="badge-warn ml-1">QUOTE</span>}
                          {s?.is_banned && <span className="badge-bad ml-1">BAN</span>}
                        </div>
                      </td>
                      {s ? (
                        <>
                          <td className="cell-bid" onClick={(e) => { e.stopPropagation(); tradable && !s.is_banned && onTrade(s, 'SELL'); }} title={tradable ? 'Click to SELL' : 'Quote only'}>{fmt(s.bid)}</td>
                          <td className="cell-ask" onClick={(e) => { e.stopPropagation(); tradable && !s.is_banned && onTrade(s, 'BUY'); }} title={tradable ? 'Click to BUY' : 'Quote only'}>{fmt(s.ask)}</td>
                          <td className="cell-ltp">
                            <span className="flex items-center justify-end gap-1.5">
                              {fmt(s.ltp)}
                              {s.source && (
                                <span className={`text-[8px] font-bold px-1 py-0.5 rounded ${s.source === 'vedpragya' ? 'bg-green-500/15 text-green-400' : s.source === 'yahoo' ? 'bg-blue-500/15 text-blue-400' : s.source === 'nse' ? 'bg-orange-500/15 text-orange-400' : 'bg-surface2 text-muted'}`}>
                                  {s.source === 'vedpragya' ? 'VP' : s.source === 'yahoo' ? 'YH' : s.source === 'nse' ? 'NSE' : 'SIM'}
                                </span>
                              )}
                            </span>
                          </td>
                          <td className={`price ${up ? 'text-accent' : 'text-red'}`}>{up ? '+' : ''}{fmt(s.change_pct)}%</td>
                          <td className={`price ${up ? 'text-accent' : 'text-red'}`}>
                            {up ? '▲' : '▼'} {fmt(Math.abs(s.net_change || 0))}
                          </td>
                          <td className="price">{fmt(s.high)}</td>
                          <td className="price">{fmt(s.low)}</td>
                          <td className="price">{fmt(s.open)}</td>
                          <td className="price">{fmt(s.close)}</td>
                        </>
                      ) : (
                        <>
                          <td colSpan={9} className="text-muted text-xs italic text-center">Live quote not available — added as placeholder</td>
                        </>
                      )}
                      <td className="text-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); onRemove(r.key); }}
                          className="w-6 h-6 inline-flex items-center justify-center bg-red/10 text-red text-lg font-bold rounded hover:bg-red/20 transition-colors"
                          title="Remove from watchlist"
                        >×</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WatchlistPage() {
  const { scripts, loading, error } = usePrices(3000);
  const toast = useToast();

  const [segments, setSegments] = useState([]);
  const [segment, setSegment] = useState('');
  const [orderFor, setOrderFor] = useState(null);
  const [search, setSearch] = useState('');

  const segmentDef = segments.find((s) => s.value === segment);

  // Filter-bar selections (drive the + button)
  const [scriptName, setScriptName] = useState('');
  const [expiry, setExpiry] = useState(EXPIRY_CATALOG[0]);
  const [optionType, setOptionType] = useState('');


  // Persistent watchlist — synced to backend, localStorage as local cache.
  const [watchItems, setWatchItems] = useState([]);
  const [watchLoading, setWatchLoading] = useState(true);

  // Load from API on mount
  useEffect(() => {
    api.get('/scripts/indices').then(({ data }) => {
      const segs = (data.indices || []).map(idx => ({
        value: idx.value,
        label: idx.label,
        isOption: idx.value.endsWith('OPT'),
        exchange: idx.value.startsWith('MCX') ? 'MCX' : idx.value.startsWith('GLOBAL') ? 'GLOBAL' : 'NSE'
      }));
      setSegments(segs);
      if (segs.length > 0) setSegment(segs[0].value);
    }).catch(console.error);

    api.get('/watchlist')
      .then(({ data }) => {
        const items = data.items.map(dbRowToItem);
        setWatchItems(items);
        // Also cache locally for fast reload
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch {}
      })
      .catch(() => {
        // Fallback to localStorage if API fails
        try { setWatchItems(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')); } catch {}
      })
      .finally(() => setWatchLoading(false));
  }, []);

  // Reset selections when segment changes
  // Reset selections when segment changes
  const scriptOptions = useMemo(() => {
    return [...new Set(scripts.filter(s => s.exchange === segment).map(s => s.name))];
  }, [segment, scripts]);
  
  useEffect(() => {
    setScriptName(scriptOptions[0] || '');
    setOptionType('');
  }, [segment, scriptOptions]);


  // Live expiries from option chain when available (strike data not used)
  const optionChain = useOptionChain(segmentDef?.isOption ? scriptName : null);
  const liveExpiries = optionChain.data?.expiries || [];
  const expiryOptions = (segmentDef?.isOption && liveExpiries.length) ? liveExpiries : EXPIRY_CATALOG;


  // If user picked an expiry that isn't in the live list, snap to first
  useEffect(() => {
    if (segmentDef?.isOption && liveExpiries.length && !liveExpiries.includes(expiry)) {
      setExpiry(liveExpiries[0]);
    }
  }, [liveExpiries.join('|')]); // eslint-disable-line

  // Add from Vedpragya search result
  const onVpSelect = async (result) => {
    const sym = result.symbol || result.name || '';
    if (!sym) return;
    // Pick segment based on instrumentType + exchange
    let seg = 'NSEEQT';
    if (result.exchange === 'NFO' || result.segment === 'NFO') seg = result.instrumentType === 'FUT' ? 'NSEFUT' : 'NSEOPT';
    else if (result.exchange === 'MCX' || result.segment?.includes('MCX')) seg = 'MCXFUT';
    else if (result.assetClass === 'currency') seg = 'NSECDS';

    const key = watchKey(seg, sym, result.expiry || '', result.optionType || '', result.strike || '');
    if (watchItems.some((w) => w.key === key)) {
      toast.info(`${sym} already in watchlist`);
      return;
    }
    try {
      const { data } = await api.post('/watchlist', {
        segment: seg,
        name: sym,
        expiry: result.expiry || null,
        option_type: result.optionType || null,
        strike: result.strike || null,
      });
      const newItem = data.item
        ? dbRowToItem(data.item)
        : { key, segment: seg, name: sym, expiry: result.expiry || '', optionType: result.optionType || '', strike: result.strike || '' };
      const next = [...watchItems, newItem];
      setWatchItems(next);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      toast.success(`Added ${sym} to watchlist`);
    } catch {
      toast.error('Failed to add to watchlist');
    }
  };

  const onAdd = async () => {
    if (!scriptName) {
      toast.error('Select a script first');
      return;
    }
    if (segmentDef?.isOption && !optionType) {
      toast.error('Pick CE or PE for options');
      return;
    }
    const otype = segmentDef?.isOption ? optionType : '';
    const stk = '';
    const key = watchKey(segment, scriptName, expiry, otype, stk);
    if (watchItems.some((w) => w.key === key)) {
      toast.info(`${scriptName} already in watchlist`);
      return;
    }
    try {
      const { data } = await api.post('/watchlist', {
        segment,
        name: scriptName,
        expiry,
        option_type: otype || null,
        strike: stk || null,
      });
      const newItem = data.item ? dbRowToItem(data.item) : { key, segment, name: scriptName, expiry, optionType: otype, strike: stk };
      const next = [...watchItems, newItem];
      setWatchItems(next);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      const suffix = otype && stk ? ` ${stk} ${otype}` : '';
      toast.success(`Added ${scriptName}${suffix} to watchlist`);
    } catch {
      toast.error('Failed to add to watchlist');
    }
  };

  const onRemove = async (key) => {
    const item = watchItems.find((x) => x.key === key);
    if (item?.id) {
      try { await api.delete(`/watchlist/${item.id}`); } catch {}
    }
    const next = watchItems.filter((x) => x.key !== key);
    setWatchItems(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
    toast.info('Removed from watchlist');
  };

  // Segment → exchange map
  const SEGMENT_EXCHANGE = useMemo(() => {
    const m = {};
    for (const seg of segments) m[seg.value] = seg.exchange || '';
    return m;
  }, [segments]);

  // Collect unique "SYMBOL:EXCHANGE" tokens → feed to Vedpragya stream
  // Sending the exchange lets the backend pick the correct MCX/NSE UIR ID.
  const watchSymbols = useMemo(() => {
    const seen = new Set();
    return watchItems
      .map((w) => {
        const ex = SEGMENT_EXCHANGE[w.segment] || '';
        return ex ? `${w.name}:${ex}` : w.name;
      })
      .filter((tok) => { if (seen.has(tok)) return false; seen.add(tok); return true; });
  }, [watchItems, SEGMENT_EXCHANGE]);

  // Real-time Socket.IO stream from Vedpragya
  const { ticks: vpTicks, status: vpStatus } = useVedpragyaStream(watchSymbols);

  // Resolve each watch item: base from REST scripts, override LTP from live tick
  const rows = useMemo(() => {
    return watchItems
      .filter((w) => (search ? w.name.toLowerCase().includes(search.toLowerCase()) : true))
      .map((w) => {
        const live  = scripts.find((s) => s.name === w.name) || null;
        const tick  = vpTicks[w.name] || null;

        // Merge: tick overrides LTP/change/bid/ask from REST base
        const script = live
          ? {
              ...live,
              ltp       : tick?.ltp      ?? live.ltp,
              bid       : tick?.bid      ?? live.bid,
              ask       : tick?.ask      ?? live.ask,
              net_change: tick?.change   ?? live.net_change,
              change_pct: tick?.pchange  ?? live.change_pct,
              high      : tick?.ohlc?.h  ?? live.high,
              low       : tick?.ohlc?.l  ?? live.low,
              open      : tick?.ohlc?.o  ?? live.open,
              volume    : tick?.volume   ?? live.volume,
              source    : tick ? 'vedpragya' : live.source,
            }
          : tick
          ? {
              // We have a live tick but no REST entry — construct a minimal script
              name       : w.name,
              ltp        : tick.ltp,
              bid        : tick.bid,
              ask        : tick.ask,
              net_change : tick.change,
              change_pct : tick.pchange,
              high       : tick.ohlc?.h,
              low        : tick.ohlc?.l,
              open       : tick.ohlc?.o,
              close      : null,
              source     : 'vedpragya',
              is_banned  : false,
            }
          : null;

        return {
          ...w,
          script,
          tradable: !!live,
        };
      });
  }, [watchItems, scripts, vpTicks, search]);

  const segmentRows = rows.filter((r) => r.segment === segment);
  const otherRows   = rows.filter((r) => r.segment !== segment);

  return (
    <div>
      {/* Vedpragya Instrument Search — add any of 200k+ instruments */}
      <div className="mb-3 flex items-center gap-2">
        <div className="flex-1">
          <VedpragyaSearch
            onSelect={onVpSelect}
            placeholder="Search 200,000+ instruments via Vedpragya… (RELIANCE, NIFTY, GOLD, etc.)"
          />
        </div>

        {/* Socket.IO live stream status */}
        {watchSymbols.length > 0 && (
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[10px] font-bold border shrink-0 ${
            vpStatus === 'live'       ? 'bg-green-500/10 text-green-400 border-green-500/20' :
            vpStatus === 'connecting' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
            vpStatus === 'error'      ? 'bg-red-500/10 text-red border-red-500/20' :
            'bg-surface2 text-muted border-border'
          }`} title={vpStatus === 'live' ? 'Vedpragya live stream connected' : vpStatus}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              vpStatus === 'live'       ? 'bg-green-400 animate-pulse' :
              vpStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' :
              vpStatus === 'error'      ? 'bg-red' :
              'bg-muted'
            }`} />
            {vpStatus === 'live' ? 'LIVE' : vpStatus === 'connecting' ? 'CONN…' : vpStatus === 'error' ? 'ERR' : '—'}
          </div>
        )}
      </div>

      {/* Filter bar */}
      <div className="bg-surface border border-border rounded p-3 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-7 gap-3 items-end">
          <div className="col-span-2 md:col-span-1">
            <Field label="SEGMENT">
              <Combobox
                value={segment}
                onChange={setSegment}
                options={segments}
              />
            </Field>
          </div>

          <div className="col-span-2 md:col-span-1">
            <Field label="SCRIPT">
              <Combobox
                value={scriptName}
                onChange={setScriptName}
                options={scriptOptions}
                placeholder="Pick a script"
                disabled={scriptOptions.length === 0}
              />
            </Field>
          </div>

          <Field label="EXPIRY">
            <Combobox
              value={expiry}
              onChange={setExpiry}
              options={expiryOptions}
            />
          </Field>

          {segmentDef?.isOption && (
            <Field label="CE/PE">
              <Combobox
                value={optionType}
                onChange={setOptionType}
                options={[
                  { value: '', label: '—' },
                  { value: 'CE', label: 'CE' },
                  { value: 'PE', label: 'PE' },
                ]}
                searchable={false}
                placeholder="—"
              />
            </Field>
          )}

          <button
            onClick={onAdd}
            className="bg-accent hover:bg-accent/90 text-white rounded h-[38px] flex items-center justify-center font-bold text-xl active:scale-95 transition-transform"
            title="Add to watchlist"
          >+</button>

          <div className="relative col-span-2 md:col-span-1 mt-2 md:mt-0">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-8 h-[38px]"
            />
          </div>
        </div>

        {watchItems.length > 0 && (
          <div className="mt-2 flex justify-end gap-3 text-xs text-muted">
            {optionChain.data?.underlying ? (
              <span>{scriptName} spot: <span className="price text-fg">{Number(optionChain.data.underlying).toLocaleString('en-IN')}</span></span>
            ) : null}
            <span>{watchItems.length} script{watchItems.length > 1 ? 's' : ''} in watchlist</span>
            <button onClick={async () => {
              try { await api.delete('/watchlist/clear'); } catch {}
              setWatchItems([]);
              try { localStorage.removeItem(STORAGE_KEY); } catch {}
            }} className="hover:text-red underline">Clear all</button>
          </div>
        )}
      </div>

      {error && (
        <div className="card p-4 text-red mb-4">{error}</div>
      )}
      {(loading && scripts.length === 0 && watchItems.length === 0) || watchLoading ? (
        <div className="text-muted text-sm">Loading…</div>
      ) : (
        <>
          <ScriptTable
            title={segmentDef?.label || 'WATCH'}
            segmentLabel={segmentDef?.label || ''}
            rows={segmentRows}
            onTrade={(s, side) => setOrderFor({ script: s, side })}
            onRemove={onRemove}
          />
          {otherRows.length > 0 && (
            <ScriptTable
              title="OTHER"
              segmentLabel="Other Segments"
              rows={otherRows}
              onTrade={(s, side) => setOrderFor({ script: s, side })}
              onRemove={onRemove}
            />
          )}
          {watchItems.length === 0 && (
            <EmptyState
              icon="+"
              title="Your watchlist is empty"
              subtitle="Pick a SEGMENT and SCRIPT above, then click + to add."
            />
          )}
        </>
      )}

      {orderFor && (
        <InlineOrderPanel
          script={orderFor.script}
          side={orderFor.side}
          onClose={() => setOrderFor(null)}
          onPlaced={() => setOrderFor(null)}
        />
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-[10px] text-muted font-semibold uppercase tracking-wider mb-1">{label}</label>
      {children}
    </div>
  );
}
