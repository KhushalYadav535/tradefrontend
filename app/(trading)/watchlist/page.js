'use client';

import { useEffect, useMemo, useState } from 'react';
import usePrices from '@/hooks/usePrices';
import OrderModal from '@/components/OrderModal';
import EmptyState from '@/components/EmptyState';
import { useToast } from '@/components/Toast';

const SEGMENTS = [
  { key: 'NSEFUT', label: 'NSEFUT', exchange: 'NSE' },
  { key: 'MCXFUT', label: 'MCXFUT', exchange: 'MCX' },
  { key: 'NSEOPT', label: 'NSEOPT', exchange: 'NSE', isOption: true },
  { key: 'GLOBAL_FUT', label: 'GLOBAL FUTURES', exchange: 'GLOBAL' },
  { key: 'MCXOPT', label: 'MCXOPT', exchange: 'MCX', isOption: true },
  { key: 'NSECDS', label: 'NSECDS', exchange: 'FOREX' },
  { key: 'NSEEQT', label: 'NSEEQT', exchange: 'NSE' },
  { key: 'GLOBAL_STK', label: 'GLOBAL STOCKS', exchange: 'GLOBAL' },
];

const STRIKES = ['ATM', '23000', '23500', '24000', '24500', '25000'];

function fmt(n, d = 2) {
  return Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
}

function expiryFor(s) {
  // Pretty expiry string used in the table SYM column
  return s.expiry ? `26${s.expiry}26` : '';
}

function ScriptTable({ title, scripts, onTrade, onRemove, segmentLabel }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="mb-6">
      <div className={`flex items-center bg-surface border border-border ${collapsed ? 'rounded' : 'border-b-0 rounded-t'}`}>
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="w-10 h-10 flex items-center justify-center text-muted hover:text-white"
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className={`transition-transform ${collapsed ? '-rotate-90' : ''}`}>
            <polygon points="6,9 18,9 12,16" />
          </svg>
        </button>
        <span className="text-xs text-muted font-semibold tracking-wider">{segmentLabel} · {scripts.length}</span>
        <div className="flex-1" />
      </div>
      {collapsed ? null : (
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
            {scripts.length === 0 ? (
              <tr><td colSpan={11} className="py-8 text-muted">No scripts in this segment. Use the filters above and click + to add.</td></tr>
            ) : scripts.map((s) => {
              const up = (s.net_change || 0) >= 0;
              return (
                <tr key={s.id}>
                  <td className="sym">
                    <div className="flex items-center gap-1.5">
                      <span>{s.name}</span>
                      <span className="text-muted text-[11px]">{expiryFor(s)}</span>
                      {s.is_banned && <span className="badge-bad ml-1">BAN</span>}
                    </div>
                  </td>
                  <td className="cell-bid" onClick={() => !s.is_banned && onTrade(s, 'SELL')} title="Click to SELL">{fmt(s.bid)}</td>
                  <td className="cell-ask" onClick={() => !s.is_banned && onTrade(s, 'BUY')} title="Click to BUY">{fmt(s.ask)}</td>
                  <td className="cell-ltp">{fmt(s.ltp)}</td>
                  <td className={`price ${up ? 'text-accent' : 'text-red'}`}>{up ? '+' : ''}{fmt(s.change_pct)}%</td>
                  <td className={`price ${up ? 'text-accent' : 'text-red'}`}>
                    {up ? '▲' : '▼'} {fmt(Math.abs(s.net_change || 0))}
                  </td>
                  <td className="price">{fmt(s.high)}</td>
                  <td className="price">{fmt(s.low)}</td>
                  <td className="price">{fmt(s.open)}</td>
                  <td className="price">{fmt(s.close)}</td>
                  <td>
                    <button
                      onClick={() => onRemove(s.id)}
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

  const [segment, setSegment] = useState('NSEFUT');
  const [search, setSearch] = useState('');
  const [orderFor, setOrderFor] = useState(null);
  const [hidden, setHidden] = useState(new Set());

  // Filter-bar state (used to drive the + button)
  const [scriptName, setScriptName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [optionType, setOptionType] = useState('');
  const [strike, setStrike] = useState('');

  const segmentDef = SEGMENTS.find((s) => s.key === segment);

  // Scripts available for the SCRIPT dropdown given the segment
  const segmentScripts = useMemo(() => {
    if (!segmentDef) return scripts;
    if (segmentDef.exchange === 'GLOBAL') return [];
    return scripts.filter((s) => s.exchange === segmentDef.exchange);
  }, [scripts, segmentDef]);

  const expiriesForScript = useMemo(() => {
    const set = new Set();
    segmentScripts
      .filter((s) => (scriptName ? s.name === scriptName : true))
      .forEach((s) => s.expiry && set.add(s.expiry));
    return Array.from(set);
  }, [segmentScripts, scriptName]);

  // Reset/auto-select when segment changes
  useEffect(() => {
    setScriptName(segmentScripts[0]?.name || '');
    setExpiry(segmentScripts[0]?.expiry || '');
    setOptionType('');
    setStrike('');
  }, [segment]); // eslint-disable-line

  // When script changes, sync expiry to first valid one for that script
  useEffect(() => {
    if (expiriesForScript.length && !expiriesForScript.includes(expiry)) {
      setExpiry(expiriesForScript[0]);
    }
  }, [scriptName, expiriesForScript]); // eslint-disable-line

  const visibleScripts = useMemo(() => {
    return segmentScripts
      .filter((s) => !hidden.has(s.id))
      .filter((s) => (search ? s.name.toLowerCase().includes(search.toLowerCase()) : true));
  }, [segmentScripts, search, hidden]);

  const secondaryScripts = useMemo(() => {
    if (!scripts.length) return [];
    if (segmentDef?.exchange === 'MCX') return [];
    return scripts
      .filter((s) => !hidden.has(s.id) && s.exchange === 'MCX')
      .filter((s) => (search ? s.name.toLowerCase().includes(search.toLowerCase()) : true));
  }, [scripts, segmentDef, hidden, search]);

  const onRemove = (id) => {
    setHidden((h) => new Set([...h, id]));
    toast.info('Removed from watchlist');
  };

  const onAdd = () => {
    if (!scriptName) {
      toast.error('Pick a script first');
      return;
    }
    const candidate = segmentScripts.find(
      (s) => s.name === scriptName && (!expiry || s.expiry === expiry)
    );
    if (!candidate) {
      toast.error('Script/expiry not found in this segment');
      return;
    }
    if (!hidden.has(candidate.id)) {
      toast.info(`${candidate.name} is already in your watchlist`);
      return;
    }
    setHidden((h) => {
      const next = new Set(h);
      next.delete(candidate.id);
      return next;
    });
    const suffix = segmentDef?.isOption && optionType && strike
      ? ` ${strike} ${optionType}`
      : '';
    toast.success(`Added ${candidate.name}${suffix} to watchlist`);
  };

  const restoreAll = () => {
    setHidden(new Set());
    toast.info('Restored all scripts');
  };

  return (
    <div>
      {/* Filter bar */}
      <div className="bg-surface border border-border rounded p-3 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-end">
          <Field label="SEGMENT">
            <select className="select" value={segment} onChange={(e) => setSegment(e.target.value)}>
              {SEGMENTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </Field>

          <Field label="SCRIPT">
            <select className="select" value={scriptName} onChange={(e) => setScriptName(e.target.value)} disabled={segmentScripts.length === 0}>
              {segmentScripts.length === 0
                ? <option>—</option>
                : Array.from(new Set(segmentScripts.map((s) => s.name))).map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </Field>

          <Field label="EXPIRY">
            <select className="select" value={expiry} onChange={(e) => setExpiry(e.target.value)} disabled={!expiriesForScript.length}>
              {expiriesForScript.length === 0
                ? <option>—</option>
                : expiriesForScript.map((ex) => <option key={ex} value={ex}>26-{ex}-2026</option>)}
            </select>
          </Field>

          <Field label="CE/PE">
            <select
              className="select disabled:opacity-50"
              value={optionType}
              onChange={(e) => setOptionType(e.target.value)}
              disabled={!segmentDef?.isOption}
            >
              <option value="">—</option>
              <option value="CE">CE</option>
              <option value="PE">PE</option>
            </select>
          </Field>

          <Field label="STRIKE">
            <select
              className="select disabled:opacity-50"
              value={strike}
              onChange={(e) => setStrike(e.target.value)}
              disabled={!segmentDef?.isOption}
            >
              <option value="">Select...</option>
              {STRIKES.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </Field>

          <button
            onClick={onAdd}
            className="bg-accent hover:bg-accent/90 text-black rounded h-[38px] flex items-center justify-center font-bold text-xl"
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
              className="input pl-8 h-[38px] bg-[#1c1f26]"
            />
          </div>
        </div>

        {hidden.size > 0 && (
          <div className="mt-2 flex justify-end">
            <button onClick={restoreAll} className="text-xs text-muted hover:text-white underline">
              Restore {hidden.size} hidden script{hidden.size > 1 ? 's' : ''}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="card p-4 text-red mb-4">{error}</div>
      )}
      {loading && scripts.length === 0 ? (
        <div className="text-muted text-sm">Loading scripts…</div>
      ) : (
        <>
          <ScriptTable
            title={segmentDef?.label || 'WATCH'}
            segmentLabel={segmentDef?.label || ''}
            scripts={visibleScripts}
            onTrade={(s, side) => setOrderFor({ script: s, side })}
            onRemove={onRemove}
          />
          {secondaryScripts.length > 0 && (
            <ScriptTable
              title="MCXFUT"
              segmentLabel="MCXFUT"
              scripts={secondaryScripts}
              onTrade={(s, side) => setOrderFor({ script: s, side })}
              onRemove={onRemove}
            />
          )}
          {visibleScripts.length === 0 && secondaryScripts.length === 0 && (
            <EmptyState title="No scripts visible" subtitle="Try a different segment, clear the search, or restore hidden scripts" />
          )}
        </>
      )}

      {orderFor && (
        <OrderModal
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
