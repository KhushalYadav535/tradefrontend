'use client';

/* ─────────────────────────────────────────────────────────────
   AdminTable  –  shared premium table component for admin pages
   Props:
     columns  : [{key, label, align?, width?}]
     rows     : array of objects
     renderCell(row, col): returns ReactNode
     emptyMsg : string
     loading  : bool
     maxH     : max-height string (default '65vh')
   ──────────────────────────────────────────────────────────── */
export default function AdminTable({ columns, rows, renderCell, emptyMsg = 'No data found.', loading = false, maxH = '65vh' }) {
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48, gap: 10 }}>
        <div style={{
          width: 24, height: 24, borderRadius: '50%',
          border: '2px solid rgb(var(--border))',
          borderTopColor: 'rgb(var(--brand))',
          animation: 'spin 0.7s linear infinite',
        }} />
        <span style={{ fontSize: 13, color: 'rgb(var(--muted))' }}>Loading…</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto', maxHeight: maxH, overflowY: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={{
                padding: '9px 12px',
                textAlign: col.align || 'left',
                fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.09em',
                color: 'rgb(var(--muted))', fontWeight: 700,
                background: 'rgb(var(--surface2))',
                borderBottom: '1px solid rgb(var(--border))',
                whiteSpace: 'nowrap',
                width: col.width,
              }}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{
                padding: '40px 24px', textAlign: 'center',
                color: 'rgb(var(--muted))', fontSize: 13,
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'rgb(var(--border))' }}>
                    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
                    <rect x="9" y="3" width="6" height="4" rx="1"/>
                    <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
                  </svg>
                  <span>{emptyMsg}</span>
                </div>
              </td>
            </tr>
          ) : rows.map((row, i) => (
            <tr key={row.id ?? i}
              style={{ borderBottom: '1px solid rgba(var(--border), 0.5)', transition: 'background 120ms' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgb(var(--surface2))'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {columns.map((col) => (
                <td key={col.key} style={{
                  padding: '8px 12px',
                  textAlign: col.align || 'left',
                  verticalAlign: 'middle',
                  color: 'rgb(var(--fg))',
                }}>
                  {renderCell ? renderCell(row, col.key) : (row[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
