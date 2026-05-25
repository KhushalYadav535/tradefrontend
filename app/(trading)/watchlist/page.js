'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import usePrices from '@/hooks/usePrices';
import OrderModal from '@/components/OrderModal';
import InlineOrderPanel from '@/components/InlineOrderPanel';
import EmptyState from '@/components/EmptyState';
import Combobox from '@/components/Combobox';
import { useToast } from '@/components/Toast';
import { SCRIPT_CATALOG, EXPIRY_CATALOG, strikesFor } from '@/lib/catalog';
import useOptionChain, { NSE_OPT_SYMBOLS } from '@/hooks/useOptionChain';
import api from '@/lib/axios';

const SEGMENTS = [
  { value: 'NSEFUT', label: 'NSEFUT', exchange: 'NSE' },
  { value: 'MCXFUT', label: 'MCXFUT', exchange: 'MCX' },
  { value: 'NSEOPT', label: 'NSEOPT', exchange: 'NSE', isOption: true },
  { value: 'GLOBAL_FUT', label: 'GLOBAL FUTURES', exchange: 'GLOBAL' },
  { value: 'MCXOPT', label: 'MCXOPT', exchange: 'MCX', isOption: true },
  { value: 'NSECDS', label: 'NSECDS', exchange: 'FOREX' },
  { value: 'NSEEQT', label: 'NSEEQT', exchange: 'NSE' },
  { value: 'GLOBAL_STK', label: 'GLOBAL STOCKS', exchange: 'GLOBAL' },
];

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
                      {s && <span>LTP : <span className="price font-bold text-fg">{fmt(s.ltp)}</span></span>}
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
                          <td className="cell-ltp">{fmt(s.ltp)}</td>
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
  const { scripts, loading, error } = usePrices(2000);
  const toast = useToast();

  const [segment, setSegment] = useState('NSEOPT');
  const [orderFor, setOrderFor] = useState(null);
  const [search, setSearch] = useState('');

  const segmentDef = SEGMENTS.find((s) => s.value === segment);

  // Filter-bar selections (drive the + button)
  const [scriptName, setScriptName] = useState('');
  const [expiry, setExpiry] = useState(EXPIRY_CATALOG[0]);
  const [optionType, setOptionType] = useState('');
  const [strike, setStrike] = useState('');

  // Persistent watchlist — synced to backend, localStorage as local cache.
  const [watchItems, setWatchItems] = useState([]);
  const [watchLoading, setWatchLoading] = useState(true);

  // Load from API on mount
  useEffect(() => {
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
  const scriptOptions = useMemo(() => SCRIPT_CATALOG[segment] || [], [segment]);
  useEffect(() => {
    setScriptName(scriptOptions[0] || '');
    setOptionType('');
    setStrike('');
  }, [segment]); // eslint-disable-line

  // Strikes adapt to selected script
  const optionChain = useOptionChain(segmentDef?.isOption ? scriptName : null);
  const liveStrikes = optionChain.data?.rowsByExpiry?.[expiry]?.map((r) => String(r.strike)) || [];
  const fallbackStrikes = strikesFor(scriptName);
  const strikeOptions = (segmentDef?.isOption && liveStrikes.length) ? liveStrikes : fallbackStrikes;

  // Live expiries from option chain when available
  const liveExpiries = optionChain.data?.expiries || [];
  const expiryOptions = (segmentDef?.isOption && liveExpiries.length) ? liveExpiries : EXPIRY_CATALOG;

  // If user picked an expiry that isn't in the live list, snap to first
  useEffect(() => {
    if (segmentDef?.isOption && liveExpiries.length && !liveExpiries.includes(expiry)) {
      setExpiry(liveExpiries[0]);
    }
  }, [liveExpiries.join('|')]); // eslint-disable-line

  const onAdd = async () => {
    if (!scriptName) {
      toast.error('Select a script first');
      return;
    }
    if (segmentDef?.isOption && (!optionType || !strike)) {
      toast.error('Pick CE/PE and a strike for options');
      return;
    }
    const otype = segmentDef?.isOption ? optionType : '';
    const stk = segmentDef?.isOption ? strike : '';
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

  // Resolve each watch item to live API data when available
  const rows = useMemo(() => {
    return watchItems
      .filter((w) => (search ? w.name.toLowerCase().includes(search.toLowerCase()) : true))
      .map((w) => {
        const live = scripts.find((s) => s.name === w.name);
        return {
          ...w,
          script: live || null,
          tradable: !!live,
        };
      });
  }, [watchItems, scripts, search]);

  const segmentRows = rows.filter((r) => r.segment === segment);
  const otherRows = rows.filter((r) => r.segment !== segment);

  return (
    <div>
      {/* Filter bar */}
      <div className="bg-surface border border-border rounded p-3 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-7 gap-3 items-end">
          <div className="col-span-2 md:col-span-1">
            <Field label="SEGMENT">
              <Combobox
                value={segment}
                onChange={setSegment}
                options={SEGMENTS}
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

          <Field label="STRIKE">
            <Combobox
              value={strike}
              onChange={setStrike}
              options={strikeOptions}
              placeholder="Select..."
            />
          </Field>

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
