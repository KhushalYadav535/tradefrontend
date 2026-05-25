'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import usePrices from '@/hooks/usePrices';
import OrderModal from '@/components/OrderModal';
import InlineOrderPanel from '@/components/InlineOrderPanel';
import EmptyState from '@/components/EmptyState';
import Combobox from '@/components/Combobox';
import { useToast } from '@/components/Toast';
import { SCRIPT_CATALOG, EXPIRY_CATALOG, strikesFor } from '@/lib/catalog';

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
        <div className="border border-border rounded-b overflow-x-auto">
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
                <tr><td colSpan={11} className="py-8 text-muted">No scripts in this segment. Use the filters above and click + to add.</td></tr>
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
                        <td colSpan={9} className="text-muted text-xs italic">Live quote not available — added as placeholder</td>
                      </>
                    )}
                    <td>
                      <button
                        onClick={(e) => { e.stopPropagation(); onRemove(r.key); }}
                        className="w-6 h-6 inline-flex items-center justify-center bg-red/80 text-white text-xs rounded hover:bg-red"
                        title="Remove from watchlist"
                      >×</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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

  // Persistent watchlist of items added by user.
  // Use a ref-flag so the save-on-change effect doesn't fire before load.
  const [watchItems, setWatchItems] = useState([]);
  const hasLoaded = useRef(false);
  useEffect(() => {
    setWatchItems(loadWatch());
    hasLoaded.current = true;
  }, []);
  useEffect(() => {
    if (!hasLoaded.current) return;
    saveWatch(watchItems);
  }, [watchItems]);

  // Reset selections when segment changes
  const scriptOptions = useMemo(() => SCRIPT_CATALOG[segment] || [], [segment]);
  useEffect(() => {
    setScriptName(scriptOptions[0] || '');
    setOptionType('');
    setStrike('');
  }, [segment]); // eslint-disable-line

  // Strikes adapt to selected script
  const strikeOptions = useMemo(() => strikesFor(scriptName), [scriptName]);

  const onAdd = () => {
    if (!scriptName) {
      toast.error('Select a script first');
      return;
    }
    // For option segments, require CE/PE + strike
    if (segmentDef?.isOption && (!optionType || !strike)) {
      toast.error('Pick CE/PE and a strike for options');
      return;
    }
    // Non-option segments ignore CE/PE + strike to avoid stale fields polluting the key
    const otype = segmentDef?.isOption ? optionType : '';
    const stk = segmentDef?.isOption ? strike : '';
    const key = watchKey(segment, scriptName, expiry, otype, stk);
    if (watchItems.some((w) => w.key === key)) {
      toast.info(`${scriptName} already in watchlist`);
      return;
    }
    const next = [
      ...watchItems,
      { key, segment, name: scriptName, expiry, optionType: otype, strike: stk },
    ];
    setWatchItems(next);
    const suffix = otype && stk ? ` ${stk} ${otype}` : '';
    toast.success(`Added ${scriptName}${suffix} to watchlist`);
  };

  const onRemove = (key) => {
    setWatchItems((w) => w.filter((x) => x.key !== key));
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
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-end">
          <Field label="SEGMENT">
            <Combobox
              value={segment}
              onChange={setSegment}
              options={SEGMENTS}
            />
          </Field>

          <Field label="SCRIPT">
            <Combobox
              value={scriptName}
              onChange={setScriptName}
              options={scriptOptions}
              placeholder="Pick a script"
              disabled={scriptOptions.length === 0}
            />
          </Field>

          <Field label="EXPIRY">
            <Combobox
              value={expiry}
              onChange={setExpiry}
              options={EXPIRY_CATALOG}
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
            className="bg-accent hover:bg-accent/90 text-white rounded h-[38px] flex items-center justify-center font-bold text-xl"
            title="Add to watchlist"
          >+</button>

          <div className="relative">
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
            <span>{watchItems.length} script{watchItems.length > 1 ? 's' : ''} in watchlist</span>
            <button onClick={() => setWatchItems([])} className="hover:text-red underline">Clear all</button>
          </div>
        )}
      </div>

      {error && (
        <div className="card p-4 text-red mb-4">{error}</div>
      )}
      {loading && scripts.length === 0 && watchItems.length === 0 ? (
        <div className="text-muted text-sm">Loading scripts…</div>
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
