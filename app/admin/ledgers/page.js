'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/axios';

const S = {
  label: { fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, display: 'block' },
  select: { background: '#2a2a3d', border: '1px solid #444', color: '#e0e0e0', borderRadius: 4, padding: '7px 28px 7px 10px', fontSize: 13, width: '100%', outline: 'none', appearance: 'none', cursor: 'pointer' },
  input: { background: '#2a2a3d', border: '1px solid #444', color: '#e0e0e0', borderRadius: 4, padding: '7px 10px', fontSize: 13, width: '100%', outline: 'none' },
  btn: (bg, color = '#fff') => ({ padding: '8px 18px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color, background: bg }),
  th: { padding: '9px 12px', fontSize: 11, fontWeight: 700, color: '#ccc', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#1a1a2e', borderBottom: '1px solid #333', whiteSpace: 'nowrap', textAlign: 'right' },
  thL: { padding: '9px 12px', fontSize: 11, fontWeight: 700, color: '#ccc', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#1a1a2e', borderBottom: '1px solid #333', whiteSpace: 'nowrap', textAlign: 'left' },
  td: { padding: '8px 12px', fontSize: 12, color: '#e0e0e0', borderBottom: '1px solid #252535', whiteSpace: 'nowrap', textAlign: 'right', fontFamily: 'var(--font-mono)' },
  tdL: { padding: '8px 12px', fontSize: 12, color: '#e0e0e0', borderBottom: '1px solid #252535', whiteSpace: 'nowrap', textAlign: 'left' },
};

const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmt2 = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const MARKET_COLORS = { nsefut: '#17a2b8', mcxfut: '#e87722', nseopt: '#6f42c1', mcxopt: '#fd7e14', nseeqt: '#20c997', global: '#ffc107' };

export default function MarginManagementPage() {
  const [students, setStudents]   = useState([]);
  const [masters,  setMasters]    = useState([]);
  const [brokers,  setBrokers]    = useState([]);
  const [master, setMaster]       = useState('');
  const [client, setClient]       = useState('');
  const [broker, setBroker]       = useState('');
  const [rows, setRows]           = useState([]);
  const [loading, setLoading]     = useState(false);
  const [searched, setSearched]   = useState(false);
  const [search, setSearch]       = useState('');
  const [showEntries, setShowEntries] = useState('All');

  useEffect(() => {
    api.get('/admin/students', { params: { role: 'user'   } }).then(r => setStudents(r.data.students || [])).catch(() => {});
    api.get('/admin/students', { params: { role: 'master' } }).then(r => setMasters(r.data.students || [])).catch(() => {});
    api.get('/admin/students', { params: { role: 'broker' } }).then(r => setBrokers(r.data.students || [])).catch(() => {});
    loadAll();
  }, []);

  const buildRows = (data) => data.map(u => ({
    id: u.id,
    name: `${(u.full_name || u.username).toUpperCase()} (${u.id}) (U)`,
    username: u.username,
    balance: u.balance,
    openPos: u.open_positions || 0,
    nsefut: u.nsefut || 0,
    mcxfut: u.mcxfut || 0,
    nseopt: u.nseopt || 0,
    mcxopt: u.mcxopt || 0,
    nseeqt: u.nseeqt || 0,
    global: u.global || 0,
  }));

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/admin/reports/margin-breakdown');
      setRows(buildRows(r.data.users || []));
      setSearched(true);
    } catch {} finally { setLoading(false); }
  }, []);

  const doSubmit = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (client) params.user_id = client;
      const r = await api.get('/admin/reports/margin-breakdown', { params });
      let users = r.data.users || [];
      if (master) users = users.filter(u => String(u.master_id) === master);
      if (broker) users = users.filter(u => String(u.broker_id) === broker);
      setRows(buildRows(users));
      setSearched(true);
    } catch {} finally { setLoading(false); }
  }, [client, master, broker]);

  const clearFilter = () => { setMaster(''); setClient(''); setBroker(''); setSearch(''); loadAll(); };

  const exportCSV = () => {
    const cols = ['Name', 'Username', 'Balance', 'Open Pos.', 'NSEFUT', 'MCXFUT', 'NSEOPT', 'MCXOPT', 'NSEEQT', 'Global'];
    const data = filtered.map(r => [r.name, r.username, fmt2(r.balance), r.openPos, fmt(r.nsefut), fmt(r.mcxfut), fmt(r.nseopt), fmt(r.mcxopt), fmt(r.nseeqt), fmt(r.global)]);
    const csv = [cols, ...data].map(r => r.join(',')).join('\n');
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: 'margin_breakdown.csv' });
    a.click();
  };

  const exportPDF = () => {
    const printWin = window.open('', '_blank');
    const tableRows = filtered.map((r, i) => `
      <tr style="background:${i % 2 === 0 ? '#f9f9f9' : '#fff'}">
        <td>${r.name}</td>
        <td style="text-align:right">${fmt2(r.balance)}</td>
        <td style="text-align:center">${r.openPos}</td>
        <td style="text-align:right;color:#17a2b8">${fmt(r.nsefut)}</td>
        <td style="text-align:right;color:#e87722">${fmt(r.mcxfut)}</td>
        <td style="text-align:right">${fmt(r.nseopt)}</td>
        <td style="text-align:right">${fmt(r.mcxopt)}</td>
        <td style="text-align:right">${fmt(r.nseeqt)}</td>
        <td style="text-align:right;font-weight:bold">${fmt(r.global)}</td>
      </tr>`).join('');
    printWin.document.write(`<html><head><title>Margin Management Report</title>
      <style>body{font-family:Arial,sans-serif;font-size:12px}table{width:100%;border-collapse:collapse}
      th{background:#1a1a2e;color:#fff;padding:8px;text-align:right}th:first-child{text-align:left}
      td{padding:7px 8px;border-bottom:1px solid #ddd}</style></head>
      <body><h2>Margin Management — ${new Date().toLocaleDateString()}</h2>
      <table><thead><tr><th style="text-align:left">Name</th><th>Balance</th><th>Open Pos.</th>
      <th>NSEFUT</th><th>MCXFUT</th><th>NSEOPT</th><th>MCXOPT</th><th>NSEEQT</th><th>Global</th></tr></thead>
      <tbody>${tableRows}</tbody></table></body></html>`);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => { printWin.print(); printWin.close(); }, 300);
  };

  const filtered = rows.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return r.name.toLowerCase().includes(q) || r.username.toLowerCase().includes(q);
  });
  const pageRows = showEntries === 'All' ? filtered : filtered.slice(0, Number(showEntries));

  // Totals
  const totals = filtered.reduce((acc, r) => ({
    balance: acc.balance + r.balance, nsefut: acc.nsefut + r.nsefut, mcxfut: acc.mcxfut + r.mcxfut,
    nseopt: acc.nseopt + r.nseopt, mcxopt: acc.mcxopt + r.mcxopt, nseeqt: acc.nseeqt + r.nseeqt, global: acc.global + r.global,
  }), { balance: 0, nsefut: 0, mcxfut: 0, nseopt: 0, mcxopt: 0, nseeqt: 0, global: 0 });

  const Sel = ({ value, onChange, placeholder, children }) => (
    <div style={{ position: 'relative' }}>
      <select value={value} onChange={e => onChange(e.target.value)} style={S.select}>
        <option value="">{placeholder}</option>
        {children}
      </select>
      <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#888', pointerEvents: 'none', fontSize: 10 }}>▼</span>
    </div>
  );

  return (
    <div style={{ background: '#13131f', minHeight: '100%', color: '#e0e0e0' }}>
      <div style={{ padding: '14px 20px 0', fontWeight: 700, fontSize: 18, color: '#fff', fontFamily: 'var(--font-heading)' }}>
        Margin Management
        <span style={{ marginLeft: 12, fontSize: 12, color: '#888', fontWeight: 400 }}>— Real-time per-market margin from open positions</span>
      </div>

      {/* ── Market Summary Cards ── */}
      <div style={{ padding: '12px 20px 0', display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
        {[
          { label: 'NSEFUT', key: 'nsefut', color: '#17a2b8' },
          { label: 'MCXFUT', key: 'mcxfut', color: '#e87722' },
          { label: 'NSEOPT', key: 'nseopt', color: '#6f42c1' },
          { label: 'MCXOPT', key: 'mcxopt', color: '#fd7e14' },
          { label: 'NSEEQT', key: 'nseeqt', color: '#20c997' },
          { label: 'GLOBAL', key: 'global',  color: '#ffc107' },
        ].map(({ label, key, color }) => (
          <div key={key} style={{ background: '#1a1a2e', border: `1px solid ${color}30`, borderRadius: 6, padding: '10px 14px' }}>
            <div style={{ fontSize: 10, color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)' }}>₹{fmt(totals[key])}</div>
            <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>Total Margin Used</div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div style={{ padding: '12px 20px', background: '#1a1a2e', borderBottom: '1px solid #252535', marginTop: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto auto', gap: 12, alignItems: 'flex-end' }}>
          <div>
            <span style={S.label}>Master</span>
            <Sel value={master} onChange={setMaster} placeholder="All Masters">
              {masters.map(m => <option key={m.id} value={String(m.id)}>{m.full_name || m.username}</option>)}
            </Sel>
          </div>
          <div>
            <span style={S.label}>Client</span>
            <Sel value={client} onChange={setClient} placeholder="All Clients">
              {students.map(s => <option key={s.id} value={s.id}>{s.full_name || s.username} ({s.id})</option>)}
            </Sel>
          </div>
          <div>
            <span style={S.label}>Broker</span>
            <Sel value={broker} onChange={setBroker} placeholder="All Brokers">
              {brokers.map(b => <option key={b.id} value={String(b.id)}>{b.full_name || b.username}</option>)}
            </Sel>
          </div>
          <button onClick={doSubmit} disabled={loading} style={S.btn('#1a1a2e', '#fff')}>
            <span style={{ border: '1px solid #555', borderRadius: 4, padding: '7px 16px', display: 'block', fontWeight: 700 }}>
              {loading ? 'Loading…' : 'SUBMIT'}
            </span>
          </button>
          <button onClick={clearFilter} style={{ ...S.btn('#2a2a3d', '#aaa'), border: '1px solid #444' }}>CLEAR FILTER</button>
        </div>
      </div>

      {/* ── Table area ── */}
      <div style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#888', fontSize: 12 }}>Show</span>
            <select value={showEntries} onChange={e => setShowEntries(e.target.value)} style={{ ...S.select, width: 70, padding: '5px 8px' }}>
              {['10', '25', '50', 'All'].map(v => <option key={v}>{v}</option>)}
            </select>
            <span style={{ color: '#888', fontSize: 12 }}>Entries</span>
            <button onClick={exportCSV} style={{ ...S.btn('#7b5e3b'), fontSize: 11, padding: '5px 12px' }}>CSV</button>
            <button onClick={exportPDF} style={{ ...S.btn('#7b5e3b'), fontSize: 11, padding: '5px 12px' }}>PDF</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#888', fontSize: 12 }}>Search:</span>
            <input value={search} onChange={e => setSearch(e.target.value)} style={{ ...S.input, width: 200, padding: '5px 10px' }} />
          </div>
        </div>

        <div style={{ border: '1px solid #252535', borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
              <thead>
                <tr>
                  <th style={S.thL}>Name / Code</th>
                  <th style={S.th}>Balance</th>
                  <th style={S.th}>Open Pos.</th>
                  {[['NSEFUT','#17a2b8'],['MCXFUT','#e87722'],['NSEOPT','#6f42c1'],['MCXOPT','#fd7e14'],['NSEEQT','#20c997'],['GLOBAL','#ffc107']].map(([label, color]) => (
                    <th key={label} style={{ ...S.th, color }}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} style={{ ...S.tdL, textAlign: 'center', padding: 32, color: '#666' }}>Loading margin data…</td></tr>
                ) : pageRows.length === 0 ? (
                  <tr><td colSpan={9} style={{ ...S.tdL, textAlign: 'center', padding: 32, color: '#666' }}>No data found.</td></tr>
                ) : pageRows.map((r, i) => (
                  <tr key={r.id}
                    onMouseEnter={e => e.currentTarget.style.background = '#1e1e30'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={S.tdL}>
                      <div style={{ fontWeight: 600, fontSize: 12 }}>{r.name}</div>
                    </td>
                    <td style={{ ...S.td, color: '#28a745' }}>₹{fmt2(r.balance)}</td>
                    <td style={{ ...S.td, color: r.openPos > 0 ? '#ffc107' : '#555' }}>{r.openPos}</td>
                    <td style={{ ...S.td, color: r.nsefut > 0 ? '#17a2b8' : '#444' }}>{r.nsefut > 0 ? fmt(r.nsefut) : '—'}</td>
                    <td style={{ ...S.td, color: r.mcxfut > 0 ? '#e87722' : '#444' }}>{r.mcxfut > 0 ? fmt(r.mcxfut) : '—'}</td>
                    <td style={{ ...S.td, color: r.nseopt > 0 ? '#6f42c1' : '#444' }}>{r.nseopt > 0 ? fmt(r.nseopt) : '—'}</td>
                    <td style={{ ...S.td, color: r.mcxopt > 0 ? '#fd7e14' : '#444' }}>{r.mcxopt > 0 ? fmt(r.mcxopt) : '—'}</td>
                    <td style={{ ...S.td, color: r.nseeqt > 0 ? '#20c997' : '#444' }}>{r.nseeqt > 0 ? fmt(r.nseeqt) : '—'}</td>
                    <td style={{ ...S.td, color: '#ffc107', fontWeight: 700 }}>{r.global > 0 ? fmt(r.global) : '—'}</td>
                  </tr>
                ))}

                {/* Totals row */}
                {pageRows.length > 0 && (
                  <tr style={{ background: '#1a1a2e', borderTop: '2px solid #333' }}>
                    <td style={{ ...S.tdL, fontWeight: 800, color: '#fff' }}>TOTAL ({filtered.length} users)</td>
                    <td style={{ ...S.td, color: '#28a745', fontWeight: 700 }}>₹{fmt2(totals.balance)}</td>
                    <td style={S.td}>—</td>
                    <td style={{ ...S.td, color: '#17a2b8', fontWeight: 700 }}>{totals.nsefut > 0 ? fmt(totals.nsefut) : '—'}</td>
                    <td style={{ ...S.td, color: '#e87722', fontWeight: 700 }}>{totals.mcxfut > 0 ? fmt(totals.mcxfut) : '—'}</td>
                    <td style={{ ...S.td, color: '#6f42c1', fontWeight: 700 }}>{totals.nseopt > 0 ? fmt(totals.nseopt) : '—'}</td>
                    <td style={{ ...S.td, color: '#fd7e14', fontWeight: 700 }}>{totals.mcxopt > 0 ? fmt(totals.mcxopt) : '—'}</td>
                    <td style={{ ...S.td, color: '#20c997', fontWeight: 700 }}>{totals.nseeqt > 0 ? fmt(totals.nseeqt) : '—'}</td>
                    <td style={{ ...S.td, color: '#ffc107', fontWeight: 800 }}>{fmt(totals.global)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, color: '#888', fontSize: 12 }}>
          <span>Showing {pageRows.length} of {filtered.length} entries</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button style={{ ...S.btn('#2a2a3d'), color: '#888', padding: '4px 14px', fontSize: 12 }}>Previous</button>
            <button style={{ ...S.btn('#17a2b8'), padding: '4px 12px', fontSize: 12 }}>1</button>
            <button style={{ ...S.btn('#2a2a3d'), color: '#888', padding: '4px 14px', fontSize: 12 }}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
