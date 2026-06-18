'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';
import { LogPage, S, fmt2 } from '@/components/LogViewerShared';

const EXCHANGES_LIST = ['NSEFUT', 'NSEOPTION', 'MCXFUT', 'MCXOPTION', 'BSEFUT', 'BSEOPTION'];

export default function MasterQtySettingsPage() {
  const [scripts,   setScripts]   = useState([]);
  const [exchSum,   setExchSum]   = useState([]);
  const [exchange,  setExchange]  = useState('');
  const [search,    setSearch]    = useState('');
  const [loading,   setLoading]   = useState(true);
  const [edits,     setEdits]     = useState({}); // scriptId → { max_lots, margin_per_lot }
  const [saving,    setSaving]    = useState(false);
  const [toast,     setToast]     = useState(null);
  // Bulk by exchange
  const [bulkEx,    setBulkEx]    = useState('');
  const [bulkLots,  setBulkLots]  = useState('');
  const [bulkMargin,setBulkMargin]= useState('');

  const showToast = (msg, ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),3500); };

  useEffect(() => { load(); }, [exchange]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/settings/master-qty', { params: { exchange: exchange || undefined } });
      setScripts(data.scripts || []);
      setExchSum(data.exchange_summary || []);
      setEdits({});
    } catch {} finally { setLoading(false); }
  }, [exchange]);

  const setEdit = (id, key, val) => setEdits(prev => ({ ...prev, [id]: { ...(prev[id]||{}), [key]: val } }));
  const hasEdits = Object.keys(edits).length > 0;

  const saveAll = async () => {
    const updates = Object.entries(edits).map(([id, vals]) => ({ id: Number(id), ...vals }));
    if (!updates.length) return;
    setSaving(true);
    try {
      await api.post('/admin/settings/master-qty', { updates });
      showToast(`${updates.length} script(s) updated!`);
      load();
    } catch (err) { showToast(err.response?.data?.error||'Failed',false); } finally { setSaving(false); }
  };

  const saveBulk = async () => {
    if (!bulkEx || !bulkLots) return showToast('Select exchange and set lots', false);
    if (!window.confirm(`Set max lots = ${bulkLots} for ALL active ${bulkEx} scripts?`)) return;
    setSaving(true);
    try {
      const { data } = await api.post('/admin/settings/master-qty/bulk', { exchange: bulkEx, max_lots: Number(bulkLots), margin_per_lot: bulkMargin ? Number(bulkMargin) : undefined });
      showToast(`Updated ${data.updated} ${bulkEx} scripts → Max Lots: ${bulkLots}`);
      load();
    } catch (err) { showToast('Bulk update failed', false); } finally { setSaving(false); }
  };

  const filtered = scripts.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <LogPage title="Master Qty Settings" subtitle="Set per-script max lots and margin requirements" color="#6f42c1">
      {toast && <div style={{ position:'fixed',top:20,right:20,zIndex:9999,padding:'12px 20px',borderRadius:6,fontWeight:700,fontSize:13,background:toast.ok?'#28a745':'#dc3545',color:'#fff',boxShadow:'0 4px 20px rgba(0,0,0,0.5)' }}>{toast.ok?'✅ ':'❌ '}{toast.msg}</div>}

      {/* Exchange Summary Cards */}
      {exchSum.length > 0 && (
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))',gap:10,marginBottom:16 }}>
          {exchSum.map(e=>(
            <div key={e.exchange} style={{ background:'#1a1a2e',border:'1px solid #6f42c120',borderRadius:6,padding:'10px 14px',cursor:'pointer' }} onClick={()=>setExchange(e.exchange===exchange?'':e.exchange)}>
              <div style={{ fontSize:11,fontWeight:700,color:'#6f42c1' }}>{e.exchange}</div>
              <div style={{ fontSize:12,color:'#888',marginTop:2 }}>{e.count} scripts</div>
              <div style={{ fontSize:11,color:'#aaa' }}>Avg lots: {Number(e.avg_max_lots||0).toFixed(0)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Bulk setter */}
      <div style={{ background:'#1a1a2e',border:'1px solid #6f42c130',borderRadius:8,padding:16,marginBottom:16 }}>
        <div style={{ fontSize:11,fontWeight:700,color:'#6f42c1',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12 }}>Bulk Set by Exchange</div>
        <div style={{ display:'flex',gap:10,alignItems:'flex-end',flexWrap:'wrap' }}>
          <div style={{ minWidth:160 }}>
            <span style={S.label}>Exchange</span>
            <div style={{ position:'relative' }}>
              <select value={bulkEx} onChange={e=>setBulkEx(e.target.value)} style={S.select}>
                <option value="">Select Exchange</option>
                {EXCHANGES_LIST.map(e=><option key={e}>{e}</option>)}
              </select>
              <span style={{ position:'absolute',right:6,top:'50%',transform:'translateY(-50%)',color:'#666',pointerEvents:'none',fontSize:9 }}>▼</span>
            </div>
          </div>
          <div style={{ minWidth:130 }}>
            <span style={S.label}>Max Lots *</span>
            <input type="number" min="1" value={bulkLots} onChange={e=>setBulkLots(e.target.value)} style={S.input} placeholder="e.g. 50" />
          </div>
          <div style={{ minWidth:150 }}>
            <span style={S.label}>Margin / Lot (₹)</span>
            <input type="number" min="0" value={bulkMargin} onChange={e=>setBulkMargin(e.target.value)} style={S.input} placeholder="Optional" />
          </div>
          <button onClick={saveBulk} disabled={saving} style={S.btn('#6f42c1')}>⚡ Apply to All {bulkEx||'—'} Scripts</button>
        </div>
      </div>

      {/* Filter + save */}
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10,flexWrap:'wrap',gap:8 }}>
        <div style={{ display:'flex',gap:8,alignItems:'center' }}>
          <div style={{ position:'relative',width:150 }}>
            <select value={exchange} onChange={e=>setExchange(e.target.value)} style={S.select}>
              <option value="">All Exchanges</option>
              {EXCHANGES_LIST.map(e=><option key={e}>{e}</option>)}
            </select>
            <span style={{ position:'absolute',right:6,top:'50%',transform:'translateY(-50%)',color:'#666',pointerEvents:'none',fontSize:9 }}>▼</span>
          </div>
          <input value={search} onChange={e=>setSearch(e.target.value)} style={{...S.input,width:200}} placeholder="Search script…" />
          <span style={{ color:'#666',fontSize:12 }}>{filtered.length} scripts</span>
        </div>
        {hasEdits && (
          <button onClick={saveAll} disabled={saving} style={{...S.btn('#6f42c1'),padding:'8px 24px'}}>
            {saving?'⏳ Saving…':`💾 Save ${Object.keys(edits).length} changes`}
          </button>
        )}
      </div>

      {/* Scripts table */}
      <div style={{ border:'1px solid #252540',borderRadius:6,overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%',borderCollapse:'collapse',minWidth:700 }}>
            <thead>
              <tr>
                {['Script','Exchange','Expiry','Lot Size','Max Lots','Margin/Lot (₹)','LTP (₹)','Trades'].map(h=>(
                  <th key={h} style={{ ...S.th,textAlign:['Max Lots','Margin/Lot (₹)','LTP (₹)'].includes(h)?'right':'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{...S.td,textAlign:'center',padding:32,color:'#555'}}>Loading…</td></tr>
              ) : filtered.length===0 ? (
                <tr><td colSpan={8} style={{...S.td,textAlign:'center',padding:32,color:'#555'}}>No scripts found.</td></tr>
              ) : filtered.map(s => {
                const ed = edits[s.id] || {};
                const maxLots = ed.max_lots !== undefined ? ed.max_lots : (s.max_lots||'');
                const margin  = ed.margin_per_lot !== undefined ? ed.margin_per_lot : (s.margin_per_lot||'');
                const changed = ed.max_lots !== undefined || ed.margin_per_lot !== undefined;
                return (
                  <tr key={s.id} style={{ background: changed?'rgba(111,66,193,0.08)':undefined }}
                    onMouseEnter={e=>e.currentTarget.style.background=changed?'rgba(111,66,193,0.12)':'#1e1e34'}
                    onMouseLeave={e=>e.currentTarget.style.background=changed?'rgba(111,66,193,0.08)':'transparent'}>
                    <td style={{...S.td,fontWeight:600}}>{s.name}</td>
                    <td style={{...S.td,color:'#17a2b8',fontSize:11}}>{s.exchange}</td>
                    <td style={{...S.td,color:'#888',fontSize:11}}>{s.expiry||'—'}</td>
                    <td style={{...S.td,textAlign:'right',color:'#aaa'}}>{s.lot_size}</td>
                    <td style={{...S.td,textAlign:'right'}}>
                      <input type="number" min="1" value={maxLots} onChange={e=>setEdit(s.id,'max_lots',e.target.value)}
                        style={{...S.input,width:80,textAlign:'right',background:changed?'rgba(111,66,193,0.15)':'#1e1e30'}} />
                    </td>
                    <td style={{...S.td,textAlign:'right'}}>
                      <input type="number" min="0" step="0.01" value={margin} onChange={e=>setEdit(s.id,'margin_per_lot',e.target.value)}
                        style={{...S.input,width:100,textAlign:'right',background:changed?'rgba(111,66,193,0.15)':'#1e1e30'}} />
                    </td>
                    <td style={{...S.td,textAlign:'right',fontFamily:'var(--font-mono)',color:'#ffc107'}}>₹{Number(s.current_price||0).toLocaleString('en-IN')}</td>
                    <td style={{...S.td,textAlign:'right',color:'#888'}}>{s.total_trades}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {hasEdits && (
        <div style={{ marginTop:12,display:'flex',justifyContent:'flex-end' }}>
          <button onClick={saveAll} disabled={saving} style={{...S.btn('#6f42c1'),padding:'10px 32px',fontSize:14}}>
            {saving?'⏳ Saving…':`💾 Save ${Object.keys(edits).length} Script Changes`}
          </button>
        </div>
      )}
    </LogPage>
  );
}
