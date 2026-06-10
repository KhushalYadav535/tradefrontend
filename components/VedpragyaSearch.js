'use client';

/**
 * VedpragyaSearch
 *
 * A debounced instrument search box backed by /api/market/search.
 * Renders a dropdown of results with live price, exchange, and instrument type.
 *
 * Props:
 *   onSelect(result)   — called when user clicks a result
 *   placeholder        — input placeholder
 *   autoFocus          — boolean
 *   className          — extra class on wrapper div
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import api from '@/lib/axios';

const DEBOUNCE_MS = 300;

function SourceDot({ status }) {
  return (
    <span
      className={`w-1.5 h-1.5 rounded-full shrink-0 inline-block ${status === 'live' ? 'bg-green-400' : 'bg-yellow-400'}`}
      title={status === 'live' ? 'Live price' : 'Stale'}
    />
  );
}

export default function VedpragyaSearch({
  onSelect,
  placeholder = 'Search instruments… (e.g. RELIANCE, NIFTY, GOLD)',
  autoFocus = false,
  className = '',
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);

  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  // ── Search ────────────────────────────────────────────────────────────────
  const doSearch = useCallback(async (q) => {
    if (!q || q.trim().length < 1) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get(`/market/search?q=${encodeURIComponent(q)}&limit=12`);
      setResults(data.results || []);
      setOpen(true);
      setHighlighted(0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const onInput = (e) => {
    const v = e.target.value;
    setQuery(v);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(v), DEBOUNCE_MS);
  };

  // ── Keyboard navigation ───────────────────────────────────────────────────
  const onKeyDown = (e) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[highlighted]) pick(results[highlighted]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const pick = (result) => {
    setOpen(false);
    setQuery('');
    setResults([]);
    onSelect?.(result);
  };

  // ── Close on outside click ────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (!wrapperRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const fmt = (n) => n != null ? Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—';

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {/* Input */}
      <div className="relative">
        {/* Search icon */}
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          ref={inputRef}
          value={query}
          onChange={onInput}
          onKeyDown={onKeyDown}
          onFocus={() => query.length >= 1 && results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="input pl-9 pr-10 h-[38px] w-full"
          autoComplete="off"
          spellCheck={false}
        />
        {/* Loading / Vedpragya badge */}
        <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {loading ? (
            <span className="w-3.5 h-3.5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          ) : (
            <span className="text-[9px] font-bold text-green-400 tracking-wider opacity-70 hidden sm:inline">
              VDPGYA
            </span>
          )}
        </span>
      </div>

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-surface border border-border rounded shadow-glow overflow-hidden max-h-[400px] overflow-y-auto">
          {results.map((r, i) => (
            <button
              key={`${r.id}-${i}`}
              onMouseDown={(e) => { e.preventDefault(); pick(r); }}
              onMouseEnter={() => setHighlighted(i)}
              className={`w-full text-left px-3 py-2.5 flex items-center gap-3 text-sm transition-colors border-b border-border/40 last:border-b-0 ${
                i === highlighted ? 'bg-brand/10' : 'hover:bg-surface2'
              }`}
            >
              {/* Status dot */}
              <SourceDot status={r.priceStatus} />

              {/* Symbol + Name */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-fg text-[13px]">{r.symbol}</span>
                  {r.instrumentType && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      r.instrumentType === 'EQ' ? 'bg-blue-500/15 text-blue-400' :
                      r.instrumentType === 'FUT' ? 'bg-purple-500/15 text-purple-400' :
                      r.instrumentType === 'OPT' ? 'bg-orange-500/15 text-orange-400' :
                      'bg-surface2 text-muted'
                    }`}>
                      {r.instrumentType}
                    </span>
                  )}
                  {r.optionType && (
                    <span className={`text-[9px] font-bold px-1 rounded ${r.optionType === 'CE' ? 'text-accent' : 'text-red'}`}>
                      {r.optionType}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-muted truncate">{r.name}{r.expiry ? ` · ${r.expiry}` : ''}</div>
              </div>

              {/* Exchange */}
              <div className="text-right shrink-0">
                <div className="text-[10px] text-muted font-semibold">{r.exchange}</div>
                {r.last_price != null ? (
                  <div className="text-[12px] font-bold price text-fg">{fmt(r.last_price)}</div>
                ) : (
                  <div className="text-[10px] text-muted italic">no quote</div>
                )}
              </div>
            </button>
          ))}

          {/* Footer */}
          <div className="px-3 py-1.5 text-[9px] text-muted text-right border-t border-border/40 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Powered by Vedpragya Streams
            </span>
            <span>{results.length} result{results.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      )}

      {/* No results */}
      {open && !loading && results.length === 0 && query.length >= 1 && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-surface border border-border rounded shadow-glow px-4 py-3 text-sm text-muted text-center">
          No instruments found for <span className="text-fg font-semibold">"{query}"</span>
        </div>
      )}
    </div>
  );
}
