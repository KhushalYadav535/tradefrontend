'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/axios';

const S = {
  label: { fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3, display: 'block' },
  select: { background: '#2a2a3d', border: '1px solid #444', color: '#e0e0e0', borderRadius: 4, padding: '6px 28px 6px 9px', fontSize: 12, width: '100%', outline: 'none', appearance: 'none', cursor: 'pointer' },
  dateInput: { background: '#2a2a3d', border: '1px solid #444', color: '#e0e0e0', borderRadius: 4, padding: '6px 10px', fontSize: 12, width: '100%', outline: 'none' },
  btn: (bg, color = '#fff') => ({ padding: '7px 14px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, color, background: bg }),
  th: { padding: '7px 8px', fontSize: 10, fontWeight: 700, color: '#ccc', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#1a1a2e', borderBottom: '1px solid #333', whiteSpace: 'nowrap', borderRight: '1px solid #252535', textAlign: 'center' },
  td: { padding: '6px 8px', fontSize: 11, color: '#e0e0e0', borderBottom: '1px solid #252535', borderRight: '1px solid #1e1e30', whiteSpace: 'nowrap', textAlign: 'center' },
};

const fmt2 = (n) => Number(n || 0).toFixed(2);

export default function SummaryReportV2Page() {
  const [students, setStudents] = useState([]);
  const [scripts,  setScripts]  = useState([]);

  const [market,    setMarket]    = useState('');
  const [script,    setScript]    = useState('');
  const [valan,     setValan]     = useState('');
  const [selMaster, setSelMaster] = useState('');
  const [selBroker, setSelBroker] = useState('');
  const [selClient, setSelClient] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate,   setEndDate]   = useState('');

  const [rows, setRows]         = useState([]);
  const [loading, setLoading]   = useState(false);
  const [searched, setSearched] = useState(false);
  const [search, setSearch]     = useState('');
  const [showEntries, setShowEntries] = useState('All');

  useEffect(() => {
    api.get('/admin/students').then(r => setStudents(r.data.students || [])).catch(() => {});
    api.get('/scripts').then(r => setScripts(r.data.scripts || [])).catch(() => {});
  }, []);

  const doSubmit = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.week_start = startDate;
      if (selClient) params.user_id = selClient;
      const { data } = await api.get('/admin/reports/weekly', { params });
      const users = data.users || [];
      setRows(users.map((u, i) => ({
        sr: i + 1,
        name: u.full_name || u.username,
        code: u.user_id,
        all: u.total_trades,
        os: 0,
        woBkg: '📄',
        valan: valan || '—',
        grossMtm: u.net_pnl,
        clientBrok: 0,
        billAmt: u.total_buy_value + u.total_sell_value,
        brokerBrok: 0,
        subBrok1: 0, subBrok2: 0, subBrok3: 0,
        selfBrok: 0,
        downlineMtm: 0,
        uplineMtm: 0,
        selfMtm: u.net_pnl,
        netPos: '📄',
      })));
      setSearched(true);
    } catch {}
    finally { setLoading(false); }
  }, [startDate, selClient, valan]);

  const clearFilter = () => {
    setMarket(''); setScript(''); setValan(''); setSelMaster('');
    setSelBroker(''); setSelClient(''); setStartDate(''); setEndDate('');
    setRows([]); setSearch(''); setSearched(false);
  };

  const exportCSV = () => {
    const cols = ['SR','Name','Code','All','OS','W/O.BKG','VALAN','GROSS MTM','CLIENT BROK','BILL AMT','BROKER BROK','SUB BROK 1','SUB BROK 2','SUB BROK 3','SELF BROK','DOWNLINE MTM','UPLINE MTM','SELF MTM','NET POS'];
    const data = filtered.map(r => [r.sr,r.name,r.code,r.all,r.os,'',r.valan,fmt2(r.grossMtm),fmt2(r.clientBrok),fmt2(r.billAmt),fmt2(r.brokerBrok),fmt2(r.subBrok1),fmt2(r.subBrok2),fmt2(r.subBrok3),fmt2(r.selfBrok),fmt2(r.downlineMtm),fmt2(r.uplineMtm),fmt2(r.selfMtm),'']);
    const csv = [cols,...data].map(r=>r.join(',')).join('\n');
    const a = Object.assign(document.createElement('a'),{href:URL.createObjectURL(new Blob([csv],{type:'text/csv'})),download:'summary_v2.csv'});
    a.click();
  };

  const filtered = rows.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return r.name.toLowerCase().includes(q) || String(r.code).includes(q);
  });
  const pageRows = showEntries === 'All' ? filtered : filtered.slice(0, Number(showEntries));

  const markets  = [...new Set(scripts.map(s => s.exchange).filter(Boolean))];
  const expiries = [...new Set(scripts.map(s => s.expiry).filter(Boolean))];

  const Sel = ({ value, onChange, placeholder, options }) => (
    <div style={{ position: 'relative' }}>
      <select value={value} onChange={e => onChange(e.target.value)} style={S.select}>
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o.val ?? o} value={o.val ?? o}>{o.label ?? o}</option>)}
      </select>
      <span style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', color: '#888', pointerEvents: 'none', fontSize: 9 }}>▼</span>
    </div>
  );

  const TABLE_HEADERS = [
    'SR No.', 'Name', 'Code', 'All', 'OS.', 'W/O.BKG.', 'VALAN',
    'GROSS MTM', 'CLIENT BROK.', 'BILL AMOUNT', 'BROKER BROK.',
    'SUB BROK 1.', 'SUB BROK 2.', 'SUB BROK 3.', 'SELF BROK.',
    'DOWNLINE MTM', 'UPLINE MTM', 'SELF MTM', 'NET POSITION',
  ];

  return (
    <div style={{ background: '#13131f', minHeight: '100%', color: '#e0e0e0' }}>
      {/* ── Filter Panel ── */}
      <div style={{ padding: '14px 20px', background: '#1a1a2e', borderBottom: '1px solid #252535' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 10, marginBottom: 10 }}>
          <div><span style={S.label}>Select Market</span><Sel value={market} onChange={setMarket} placeholder="Select Mar..." options={markets} /></div>
          <div><span style={S.label}>Select Script</span><Sel value={script} onChange={setScript} placeholder="Select Scri..." options={scripts.map(s => s.name)} /></div>
          <div><span style={S.label}>Select Valan</span><Sel value={valan} onChange={setValan} placeholder="Select Val..." options={expiries} /></div>
          <div><span style={S.label}>Select Master</span><Sel value={selMaster} onChange={setSelMaster} placeholder="Select Ma..." options={[]} /></div>
          <div><span style={S.label}>Select Broker</span><Sel value={selBroker} onChange={setSelBroker} placeholder="Select Bro..." options={[]} /></div>
          <div><span style={S.label}>Select Client</span>
            <Sel value={selClient} onChange={setSelClient} placeholder="Select Clie..." options={students.map(s => ({ val: s.id, label: s.full_name || s.username }))} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ minWidth: 150 }}>
            <span style={S.label}>Start Date</span>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={S.dateInput} />
          </div>
          <div style={{ minWidth: 150 }}>
            <span style={S.label}>End Date</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={S.dateInput} />
          </div>
          <button onClick={doSubmit} disabled={loading} style={S.btn('#1a1a1a')}>
            <span style={{ border: '1px solid #555', borderRadius: 3, padding: '5px 14px', display: 'block' }}>{loading ? '…' : 'SUBMIT'}</span>
          </button>
          <button onClick={clearFilter} style={S.btn('#3a3a3a', '#aaa')}>CLEAR FILTER</button>
          <button style={S.btn('#6f42c1')}>SCRIPT WISE SUMMARY</button>
          <button style={S.btn('#28a745')}>BUY/SELL TURNOVER</button>
        </div>
      </div>

      {/* ── Table area ── */}
      <div style={{ padding: '14px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#888', fontSize: 12 }}>Show</span>
            <select value={showEntries} onChange={e => setShowEntries(e.target.value)} style={{ ...S.select, width: 70, padding: '4px 8px' }}>
              {['10', '25', '50', 'All'].map(v => <option key={v}>{v}</option>)}
            </select>
            <span style={{ color: '#888', fontSize: 12 }}>Entries</span>
            <button onClick={exportCSV} style={{ ...S.btn('#7b5e3b'), fontSize: 11, padding: '4px 12px' }}>CSV</button>
            <button style={{ ...S.btn('#7b5e3b'), fontSize: 11, padding: '4px 12px' }}>PDF</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#888', fontSize: 12 }}>Search:</span>
            <input value={search} onChange={e => setSearch(e.target.value)} style={{ ...S.dateInput, width: 180, padding: '4px 10px' }} />
          </div>
        </div>

        <div style={{ border: '1px solid #252535', borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1400 }}>
              <thead>
                <tr>
                  {TABLE_HEADERS.map(h => <th key={h} style={S.th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={TABLE_HEADERS.length} style={{ ...S.td, padding: 32, color: '#666' }}>Generating…</td></tr>
                ) : pageRows.length === 0 ? (
                  <tr><td colSpan={TABLE_HEADERS.length} style={{ ...S.td, padding: 32, color: '#666' }}>
                    {searched ? 'No data.' : 'Select filters and click SUBMIT.'}
                  </td></tr>
                ) : pageRows.map((r, i) => (
                  <tr key={i}
                    onMouseEnter={e => e.currentTarget.style.background = '#1e1e30'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={S.td}>{r.sr}</td>
                    <td style={{ ...S.td, textAlign: 'left', fontWeight: 600 }}>{r.name}</td>
                    <td style={{ ...S.td, fontFamily: 'var(--font-mono)' }}>{r.code}</td>
                    <td style={S.td}>📄</td>
                    <td style={S.td}>📄</td>
                    <td style={S.td}>📄</td>
                    <td style={S.td}>{r.valan}</td>
                    <td style={{ ...S.td, fontFamily: 'var(--font-mono)', color: r.grossMtm >= 0 ? '#28a745' : '#dc3545', fontWeight: 700 }}>{fmt2(r.grossMtm)}</td>
                    <td style={{ ...S.td, fontFamily: 'var(--font-mono)' }}>{fmt2(r.clientBrok)}</td>
                    <td style={{ ...S.td, fontFamily: 'var(--font-mono)' }}>{fmt2(r.billAmt)}</td>
                    <td style={{ ...S.td, fontFamily: 'var(--font-mono)' }}>{fmt2(r.brokerBrok)}</td>
                    <td style={{ ...S.td, fontFamily: 'var(--font-mono)' }}>{fmt2(r.subBrok1)}</td>
                    <td style={{ ...S.td, fontFamily: 'var(--font-mono)' }}>{fmt2(r.subBrok2)}</td>
                    <td style={{ ...S.td, fontFamily: 'var(--font-mono)' }}>{fmt2(r.subBrok3)}</td>
                    <td style={{ ...S.td, fontFamily: 'var(--font-mono)' }}>{fmt2(r.selfBrok)}</td>
                    <td style={{ ...S.td, fontFamily: 'var(--font-mono)' }}>{fmt2(r.downlineMtm)}</td>
                    <td style={{ ...S.td, fontFamily: 'var(--font-mono)' }}>{fmt2(r.uplineMtm)}</td>
                    <td style={{ ...S.td, fontFamily: 'var(--font-mono)', color: r.selfMtm >= 0 ? '#28a745' : '#dc3545', fontWeight: 700 }}>{fmt2(r.selfMtm)}</td>
                    <td style={S.td}>📄</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, color: '#888', fontSize: 12 }}>
          <span>Showing {pageRows.length > 0 ? 1 : 0} to {pageRows.length} of {filtered.length} entries</span>
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
