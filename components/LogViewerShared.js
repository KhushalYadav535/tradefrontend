'use client';

import { useState, useCallback } from 'react';

/* ─── Shared style tokens ────────────────────────── */
export const S = {
  label: { fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3, display: 'block' },
  input: { background: '#1e1e30', border: '1px solid #444', color: '#e0e0e0', borderRadius: 4, padding: '6px 10px', fontSize: 12, outline: 'none', width: '100%' },
  select: { background: '#1e1e30', border: '1px solid #444', color: '#e0e0e0', borderRadius: 4, padding: '6px 26px 6px 9px', fontSize: 12, outline: 'none', appearance: 'none', cursor: 'pointer', width: '100%' },
  btn: (bg, color = '#fff') => ({ padding: '6px 14px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, color, background: bg, display: 'inline-flex', alignItems: 'center', gap: 5 }),
  th: { padding: '8px 10px', fontSize: 10, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#12122a', borderBottom: '1px solid #2a2a40', whiteSpace: 'nowrap' },
  td: { padding: '7px 10px', fontSize: 12, color: '#ddd', borderBottom: '1px solid #1e1e30', whiteSpace: 'nowrap' },
};

export const fmt2 = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const fmtDT = (dt) => dt ? new Date(dt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—';

/* ─── Select wrapper ─────────────────────────────── */
export function Sel({ value, onChange, children, placeholder }) {
  return (
    <div style={{ position: 'relative' }}>
      <select value={value} onChange={e => onChange(e.target.value)} style={S.select}>
        {placeholder && <option value="">{placeholder}</option>}
        {children}
      </select>
      <span style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none', fontSize: 9 }}>▼</span>
    </div>
  );
}

/* ─── Date-range row ─────────────────────────────── */
export function DateRangeRow({ startDate, setStartDate, endDate, setEndDate, onSubmit, onClear, loading, extra }) {
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
      <div style={{ minWidth: 150 }}>
        <span style={S.label}>From Date</span>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={S.input} />
      </div>
      <div style={{ minWidth: 150 }}>
        <span style={S.label}>To Date</span>
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={S.input} />
      </div>
      {extra}
      <button onClick={onSubmit} disabled={loading} style={S.btn('#17a2b8')}>
        {loading ? '⏳ Loading…' : '🔍 SUBMIT'}
      </button>
      <button onClick={onClear} style={S.btn('#3a3a4d', '#aaa')}>✕ CLEAR</button>
    </div>
  );
}

/* ─── Universal LogTable ─────────────────────────── */
export function LogTable({ columns, rows, loading, emptyMsg = 'No records found.' }) {
  const [search, setSearch]       = useState('');
  const [showEntries, setShowEntries] = useState('All');

  const filtered = rows.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return Object.values(r).some(v => String(v ?? '').toLowerCase().includes(q));
  });
  const paged = showEntries === 'All' ? filtered : filtered.slice(0, Number(showEntries));

  const exportCSV = () => {
    const csv = [columns.map(c => c.label), ...filtered.map(r => columns.map(c => String(r[c.key] ?? '')))].map(r => r.join(',')).join('\n');
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: 'log_export.csv' });
    a.click();
  };

  const exportPDF = () => {
    const w = window.open('', '_blank');
    const thead = columns.map(c => `<th>${c.label}</th>`).join('');
    const tbody = filtered.map(r => `<tr>${columns.map(c => `<td>${r[c.key] ?? ''}</td>`).join('')}</tr>`).join('');
    w.document.write(`<html><head><title>Log Export</title>
      <style>body{font-family:Arial;font-size:11px}table{width:100%;border-collapse:collapse}
      th{background:#1a1a2e;color:#fff;padding:6px;text-align:left}td{padding:5px 6px;border-bottom:1px solid #ddd}</style>
      </head><body><h3>Log Export — ${new Date().toLocaleString()}</h3>
      <table><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table></body></html>`);
    w.document.close(); w.focus(); setTimeout(() => { w.print(); w.close(); }, 300);
  };

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#888', fontSize: 12 }}>Show</span>
          <select value={showEntries} onChange={e => setShowEntries(e.target.value)} style={{ ...S.select, width: 70 }}>
            {['10', '25', '50', '100', 'All'].map(v => <option key={v}>{v}</option>)}
          </select>
          <span style={{ color: '#888', fontSize: 12 }}>entries</span>
          <button onClick={exportCSV} style={{ ...S.btn('#5a4a2a'), fontSize: 11 }}>📄 CSV</button>
          <button onClick={exportPDF} style={{ ...S.btn('#5a4a2a'), fontSize: 11 }}>🖨 PDF</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#888', fontSize: 12 }}>Search:</span>
          <input value={search} onChange={e => setSearch(e.target.value)} style={{ ...S.input, width: 220 }} placeholder="Filter rows…" />
        </div>
      </div>

      {/* Table */}
      <div style={{ border: '1px solid #252540', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
            <thead>
              <tr>
                {columns.map(c => <th key={c.key} style={S.th}>{c.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={columns.length} style={{ ...S.td, textAlign: 'center', padding: 32, color: '#555' }}>Loading…</td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={columns.length} style={{ ...S.td, textAlign: 'center', padding: 32, color: '#555' }}>{emptyMsg}</td></tr>
              ) : paged.map((r, i) => (
                <tr key={i}
                  onMouseEnter={e => e.currentTarget.style.background = '#1e1e34'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {columns.map(c => (
                    <td key={c.key} style={{ ...S.td, ...c.style }}>
                      {c.render ? c.render(r[c.key], r) : (r[c.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', fontSize: 12, marginTop: 8 }}>
        <span>Showing {paged.length} of {filtered.length} entries (total: {rows.length})</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button style={{ ...S.btn('#252535'), color: '#888', padding: '3px 12px', fontSize: 11 }}>Previous</button>
          <button style={{ ...S.btn('#17a2b8'), padding: '3px 10px', fontSize: 11 }}>1</button>
          <button style={{ ...S.btn('#252535'), color: '#888', padding: '3px 12px', fontSize: 11 }}>Next</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Page shell ─────────────────────────────────── */
export function LogPage({ title, subtitle, color = '#17a2b8', badge, children }) {
  return (
    <div style={{ background: '#0f0f1a', minHeight: '100%', color: '#e0e0e0', fontFamily: 'var(--font-sans)' }}>
      {/* Header */}
      <div style={{ padding: '13px 20px', borderBottom: '1px solid #1e1e30', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 17, color: '#fff', fontFamily: 'var(--font-heading)' }}>{title}</div>
          {subtitle && <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{subtitle}</div>}
        </div>
        {badge !== undefined && (
          <span style={{ background: `${color}18`, color, border: `1px solid ${color}35`, borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700 }}>
            {badge} records
          </span>
        )}
      </div>
      {/* Filter panel + table */}
      <div style={{ padding: '14px 20px' }}>
        {children}
      </div>
    </div>
  );
}
