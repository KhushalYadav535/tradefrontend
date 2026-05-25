'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

export default function Combobox({
  value,
  onChange,
  options = [],          // array of { value, label } or strings
  placeholder = 'Select…',
  disabled = false,
  searchable = true,
  emptyText = 'No matches',
}) {
  const norm = (opt) => (typeof opt === 'string' ? { value: opt, label: opt } : opt);
  const items = useMemo(() => options.map(norm), [options]);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const selected = items.find((o) => o.value === value);
  const filtered = useMemo(() => {
    if (!query) return items;
    const q = query.toLowerCase();
    return items.filter((o) => o.label.toLowerCase().includes(q));
  }, [items, query]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  // Keep active row in view
  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-idx="${activeIdx}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx, open]);

  const choose = (opt) => {
    onChange?.(opt.value);
    setOpen(false);
  };

  const onKey = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const opt = filtered[activeIdx];
      if (opt) choose(opt);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={`select w-full flex items-center justify-between text-left ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        style={{ backgroundImage: 'none', paddingRight: '12px' }}
      >
        <span className={`truncate ${selected ? '' : 'text-muted'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <svg width="10" height="10" viewBox="0 0 10 6" className={`shrink-0 ml-2 transition-transform ${open ? 'rotate-180' : ''}`} fill="currentColor">
          <path d="M0 0l5 6 5-6z" />
        </svg>
      </button>

      {open && !disabled && (
        <div className="absolute z-40 mt-1 w-full card shadow-glow overflow-hidden">
          {searchable && (
            <div className="p-2 border-b border-border">
              <div className="relative">
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </span>
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setActiveIdx(0); }}
                  onKeyDown={onKey}
                  placeholder=""
                  className="w-full bg-bg border border-border rounded px-2 py-1 text-xs focus:outline-none focus:border-brand"
                />
              </div>
            </div>
          )}
          <div ref={listRef} className="max-h-64 overflow-y-auto py-1" role="listbox">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-xs text-muted">{emptyText}</div>
            ) : filtered.map((opt, i) => {
              const active = i === activeIdx;
              const isSel = opt.value === value;
              return (
                <button
                  key={opt.value}
                  data-idx={i}
                  onClick={() => choose(opt)}
                  onMouseEnter={() => setActiveIdx(i)}
                  className={`w-full text-left px-3 py-1.5 text-sm flex items-center justify-between ${
                    active ? 'bg-surface2' : ''
                  } ${isSel ? 'text-brand-2 font-semibold' : 'text-fg'}`}
                  role="option"
                >
                  <span>{opt.label}</span>
                  {isSel && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
