'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/axios';

const S = {
  label: { fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, display: 'block' },
  select: {
    background: '#2a2a3d', border: '1px solid #444', color: '#e0e0e0', borderRadius: 4,
    padding: '7px 28px 7px 10px', fontSize: 13, width: '100%', outline: 'none',
    appearance: 'none', cursor: 'pointer',
  },
  input: {
    background: '#2a2a3d', border: '1px solid #444', color: '#888', borderRadius: 4,
    padding: '7px 10px', fontSize: 13, width: '100%', outline: 'none',
    placeholder: '#555',
  },
  btn: (color) => ({
    padding: '8px 18px', borderRadius: 4, border: 'none', cursor: 'pointer',
    fontSize: 13, fontWeight: 700, color: '#fff', background: color,
    display: 'inline-flex', alignItems: 'center', gap: 5,
  }),
  th: { padding: '9px 12px', fontSize: 11, fontWeight: 700, color: '#ccc', textTransform: 'uppercase', letterSpacing: '0.07em', background: '#1a1a2e', borderBottom: '1px solid #333', whiteSpace: 'nowrap', textAlign: 'left' },
  td: { padding: '8px 12px', fontSize: 13, color: '#e0e0e0', borderBottom: '1px solid #252535', whiteSpace: 'nowrap' },
};

const LEVELS = ['Admin', 'Master', 'Client'];
const MARKETS = ['NSEFUT', 'MCXFUT', 'NSEOPT', 'MCXOPT', 'NSEEQT'];

export default function MaxQtyPage() {
  const [scripts, setScripts] = useState([]);

  /* ADD form */
  const [addLevel,    setAddLevel]    = useState('');
  const [addMarket,   setAddMarket]   = useState('');
  const [addScript,   setAddScript]   = useState('');
  const [addPosition, setAddPosition] = useState('');
  const [addMinOrder, setAddMinOrder] = useState('');
  const [addMaxOrder, setAddMaxOrder] = useState('');
  const [adding, setAdding] = useState(false);

  /* FIND form */
  const [findLevel,  setFindLevel]  = useState('');
  const [findRows,   setFindRows]   = useState([]);
  const [finding, setFinding] = useState(false);
  const [searched, setSearched] = useState(false);
  const [search, setSearch] = useState('');
  const [showEntries, setShowEntries] = useState('All');

  useEffect(() => {
    // Use /admin/script-master for dropdown (all scripts including inactive)
    api.get('/admin/script-master').then(r => setScripts(r.data.scripts || [])).catch(() => {});
    findAll();
  }, []);

  const findAll = useCallback(async () => {
    setFinding(true);
    try {
      // Use dedicated /scripts/maxqty endpoint for proper lot/qty data
      const r = await api.get('/scripts/maxqty');
      const all = r.data.scripts || [];
      setFindRows(all.map(s => ({
        id: s.id, level: 'Admin', market: s.exchange, script: s.name,
        posLimit: s.max_qty || (s.max_lots * (s.lot_size || 1)), maxOrder: s.max_lots,
        lotSize: s.lot_size, marginPerLot: s.margin_per_lot,
      })));
      setSearched(true);
    } catch {}
    finally { setFinding(false); }
  }, []);

  const doFind = async () => {
    setFinding(true);
    try {
      const r = await api.get('/scripts/maxqty');
      let rows = (r.data.scripts || []).map(s => ({
        id: s.id, level: 'Admin', market: s.exchange, script: s.name,
        posLimit: s.max_qty || (s.max_lots * (s.lot_size || 1)), maxOrder: s.max_lots,
        lotSize: s.lot_size, marginPerLot: s.margin_per_lot,
      }));
      if (findLevel) rows = rows.filter(r => r.level === findLevel);
      if (addMarket)  rows = rows.filter(r => r.market === addMarket);
      if (addScript)  rows = rows.filter(r => r.script === addScript);
      setFindRows(rows);
      setSearched(true);
    } catch {}
    finally { setFinding(false); }
  };

  const doAdd = async () => {
    if (!addScript || !addMaxOrder) return alert('Please fill Script and Max Order.');
    setAdding(true);
    try {
      const target = scripts.find(s => s.name === addScript);
      if (target) await api.patch(`/admin/scripts/${target.id}`, { max_lots: Number(addMaxOrder) });
      await findAll();
      setAddScript(''); setAddMaxOrder(''); setAddMinOrder(''); setAddPosition('');
    } catch { alert('Failed to add.'); }
    finally { setAdding(false); }
  };

  const filteredRows = findRows.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return r.script.toLowerCase().includes(q) || r.market.toLowerCase().includes(q) || r.level.toLowerCase().includes(q);
  });

  const pageRows = showEntries === 'All' ? filteredRows : filteredRows.slice(0, Number(showEntries));

  const markets = [...new Set(scripts.map(s => s.exchange).filter(Boolean))];
  const scriptNames = scripts.filter(s => !addMarket || s.exchange === addMarket).map(s => s.name);

  return (
    <div style={{ background: '#13131f', minHeight: '100%', color: '#e0e0e0', padding: '16px 0' }}>
      <div style={{ padding: '0 20px 14px', fontWeight: 700, fontSize: 18, color: '#fff', fontFamily: 'var(--font-heading)' }}>
        Max Quantity Details
      </div>

      {/* ── ADD form ── */}
      <div style={{ padding: '16px 20px', background: '#1a1a2e', borderBottom: '2px solid #252535', marginBottom: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 14 }}>
          {/* Level */}
          <div>
            <span style={S.label}>Level</span>
            <div style={{ position: 'relative' }}>
              <select value={addLevel} onChange={e => setAddLevel(e.target.value)} style={S.select}>
                <option value="">Select Level</option>
                {LEVELS.map(l => <option key={l}>{l}</option>)}
              </select>
              <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#888', pointerEvents: 'none', fontSize: 10 }}>▼</span>
            </div>
          </div>
          {/* Market */}
          <div>
            <span style={S.label}>Market</span>
            <div style={{ position: 'relative' }}>
              <select value={addMarket} onChange={e => { setAddMarket(e.target.value); setAddScript(''); }} style={S.select}>
                <option value="">Select Market</option>
                {markets.map(m => <option key={m}>{m}</option>)}
              </select>
              <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#888', pointerEvents: 'none', fontSize: 10 }}>▼</span>
            </div>
          </div>
          {/* Script */}
          <div>
            <span style={S.label}>Script</span>
            <div style={{ position: 'relative' }}>
              <select value={addScript} onChange={e => setAddScript(e.target.value)} style={S.select}>
                <option value="">Select Script</option>
                {scriptNames.map(n => <option key={n}>{n}</option>)}
              </select>
              <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#888', pointerEvents: 'none', fontSize: 10 }}>▼</span>
            </div>
          </div>
          {/* Position */}
          <div>
            <span style={S.label}>Position</span>
            <input value={addPosition} onChange={e => setAddPosition(e.target.value)} placeholder="Position" style={S.input} />
          </div>
          {/* Min Order */}
          <div>
            <span style={S.label}>Min Order</span>
            <input value={addMinOrder} onChange={e => setAddMinOrder(e.target.value)} placeholder="Min Order" style={S.input} />
          </div>
          {/* Max Order */}
          <div>
            <span style={S.label}>Max Order</span>
            <input value={addMaxOrder} onChange={e => setAddMaxOrder(e.target.value)} placeholder="Max Order" style={S.input} />
          </div>
        </div>

        <button onClick={doAdd} disabled={adding} style={S.btn('#28a745')}>
          {adding ? '…' : '+ ADD'}
        </button>
      </div>

      {/* ── FIND form ── */}
      <div style={{ padding: '16px 20px', background: '#1a1a2e', borderBottom: '2px solid #252535', marginBottom: 16 }}>
        <span style={S.label}>Level</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative', width: 200 }}>
            <select value={findLevel} onChange={e => setFindLevel(e.target.value)} style={S.select}>
              <option value="">Select Level</option>
              {LEVELS.map(l => <option key={l}>{l}</option>)}
            </select>
            <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#888', pointerEvents: 'none', fontSize: 10 }}>▼</span>
          </div>
          <button onClick={doFind} disabled={finding} style={S.btn('#17a2b8')}>
            {finding ? '…' : '+ FIND'}
          </button>
        </div>
      </div>

      {/* ── Results table ── */}
      <div style={{ padding: '0 20px' }}>
        {/* Table controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#888', fontSize: 12 }}>Show</span>
            <select value={showEntries} onChange={e => setShowEntries(e.target.value)}
              style={{ ...S.select, width: 80, padding: '5px 8px' }}>
              {['10', '25', '50', 'All'].map(v => <option key={v}>{v}</option>)}
            </select>
            <span style={{ color: '#888', fontSize: 12 }}>Entries</span>
            <button style={{ ...S.btn('#7b5e3b'), fontSize: 11, padding: '4px 12px' }}>CSV</button>
            <button style={{ ...S.btn('#7b5e3b'), fontSize: 11, padding: '4px 12px' }}>PDF</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#888', fontSize: 12 }}>Search:</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              style={{ ...S.input, width: 200, padding: '5px 10px' }} />
          </div>
        </div>

        <div style={{ border: '1px solid #252535', borderRadius: 6, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Level', 'Market', 'Script', 'Position Limit', 'Max Order'].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {finding ? (
                <tr><td colSpan={5} style={{ ...S.td, textAlign: 'center', padding: 32, color: '#666' }}>Loading…</td></tr>
              ) : pageRows.length === 0 ? (
                <tr><td colSpan={5} style={{ ...S.td, textAlign: 'center', padding: 32, color: '#666' }}>No records found.</td></tr>
              ) : pageRows.map((r, i) => (
                <tr key={r.id || i}
                  onMouseEnter={e => e.currentTarget.style.background = '#1e1e30'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={S.td}>{r.level}</td>
                  <td style={S.td}>{r.market}</td>
                  <td style={{ ...S.td, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{r.script}</td>
                  <td style={{ ...S.td, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{r.posLimit}</td>
                  <td style={{ ...S.td, textAlign: 'right', fontFamily: 'var(--font-mono)', color: '#17a2b8', fontWeight: 700 }}>{r.maxOrder}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, color: '#888', fontSize: 12 }}>
          <span>Showing {Math.min(pageRows.length, filteredRows.length)} of {filteredRows.length} entries</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button style={{ ...S.btn('#2a2a3d'), color: '#888', padding: '4px 12px', fontSize: 12 }}>Previous</button>
            <button style={{ ...S.btn('#17a2b8'), padding: '4px 12px', fontSize: 12 }}>1</button>
            <button style={{ ...S.btn('#2a2a3d'), color: '#888', padding: '4px 12px', fontSize: 12 }}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
