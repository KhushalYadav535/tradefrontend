'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/axios';

/* ── Shared Style Object ───────────────────────────── */
const S = {
  label: { fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3, display: 'block' },
  select: { background: '#2a2a3d', border: '1px solid #444', color: '#e0e0e0', borderRadius: 4, padding: '6px 28px 6px 9px', fontSize: 12, width: '100%', outline: 'none', appearance: 'none', cursor: 'pointer' },
  input: { background: '#2a2a3d', border: '1px solid #444', color: '#e0e0e0', borderRadius: 4, padding: '6px 10px', fontSize: 12, width: '100%', outline: 'none' },
  btn: (bg, color = '#fff') => ({ padding: '7px 16px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, color, background: bg }),
  th: { padding: '8px 10px', fontSize: 10, fontWeight: 700, color: '#ccc', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#1a1a2e', borderBottom: '1px solid #333', whiteSpace: 'nowrap', textAlign: 'left' },
  td: { padding: '7px 10px', fontSize: 12, color: '#e0e0e0', borderBottom: '1px solid #252535', whiteSpace: 'nowrap' },
};

const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ── Main Component ─────────────────────────────────── */
export function AccountListPage({ role, title, subtitle, color = '#17a2b8' }) {
  const [accounts, setAccounts]   = useState([]);
  const [masters,  setMasters]    = useState([]);
  const [brokers,  setBrokers]    = useState([]);
  const [loading,  setLoading]    = useState(true);
  const [search,   setSearch]     = useState('');
  const [showEntries, setShowEntries] = useState('All');
  const [filterMaster, setFilterMaster] = useState('');
  const [filterBroker, setFilterBroker] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [editAcc,   setEditAcc]   = useState(null);
  const [creditAcc, setCreditAcc] = useState(null);
  const [toast,    setToast]      = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [accRes, masterRes, brokerRes] = await Promise.all([
        api.get('/admin/students', { params: { role } }),
        api.get('/admin/students', { params: { role: 'master' } }),
        api.get('/admin/students', { params: { role: 'broker' } }),
      ]);
      setAccounts(accRes.data.students || []);
      setMasters(masterRes.data.students || []);
      setBrokers(brokerRes.data.students || []);
    } catch { showToast('Failed to load accounts', 'error'); }
    finally { setLoading(false); }
  }, [role]);

  useEffect(() => { load(); }, [load]);

  const filtered = accounts.filter(a => {
    if (filterMaster && String(a.master_id) !== filterMaster) return false;
    if (filterBroker && String(a.broker_id) !== filterBroker) return false;
    if (filterStatus === 'active' && !a.is_active) return false;
    if (filterStatus === 'inactive' && a.is_active) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return a.username.toLowerCase().includes(q) || (a.full_name || '').toLowerCase().includes(q) || String(a.id).includes(q);
  });
  const pageRows = showEntries === 'All' ? filtered : filtered.slice(0, Number(showEntries));

  const onToggleActive = async (a) => {
    try {
      await api.patch(`/admin/students/${a.id}`, { is_active: !a.is_active });
      showToast(`${a.username} ${a.is_active ? 'deactivated' : 'activated'}`);
      load();
    } catch { showToast('Update failed', 'error'); }
  };

  const onDelete = async (a) => {
    if (!window.confirm(`Delete "${a.username}"? All trades will be removed.`)) return;
    try {
      await api.delete(`/admin/students/${a.id}`);
      showToast(`Deleted ${a.username}`);
      load();
    } catch (err) { showToast(err.response?.data?.error || 'Delete failed', 'error'); }
  };

  const exportCSV = () => {
    const cols = ['ID', 'Username', 'Full Name', 'Balance', 'Trades', 'Brokerage', 'Status', 'Created'];
    const data = filtered.map(a => [a.id, a.username, a.full_name, fmt(a.balance), a.trade_count, `${a.brokerage_value || 0}/${a.brokerage_type}`, a.is_active ? 'Active' : 'Inactive', new Date(a.created_at).toLocaleDateString()]);
    const csv = [cols, ...data].map(r => r.join(',')).join('\n');
    const el = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: `${role}_list.csv` });
    el.click();
  };

  const ROLE_BADGE = { user: { bg: '#1a3a2a', color: '#28a745' }, master: { bg: '#1a2a3a', color: '#17a2b8' }, broker: { bg: '#2a1a3a', color: '#6f42c1' }, admin: { bg: '#3a1a1a', color: '#dc3545' } };
  const rb = ROLE_BADGE[role] || ROLE_BADGE.user;

  return (
    <div style={{ background: '#13131f', minHeight: '100%', color: '#e0e0e0' }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, padding: '10px 20px', borderRadius: 6, fontWeight: 700, fontSize: 13, background: toast.type === 'error' ? '#dc3545' : '#28a745', color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
          {toast.msg}
        </div>
      )}

      {/* ── Page Header ── */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #252535', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18, color: '#fff', fontFamily: 'var(--font-heading)' }}>{title}</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{subtitle}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ background: rb.bg, color: rb.color, border: `1px solid ${rb.color}40`, borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
            {accounts.length} {role}s
          </span>
        </div>
      </div>

      {/* ── Filters ── */}
      <div style={{ padding: '12px 20px', background: '#1a1a2e', borderBottom: '1px solid #252535', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        {role === 'user' && (
          <>
            <div style={{ minWidth: 160 }}>
              <span style={S.label}>Master</span>
              <div style={{ position: 'relative' }}>
                <select value={filterMaster} onChange={e => setFilterMaster(e.target.value)} style={S.select}>
                  <option value="">All Masters</option>
                  {masters.map(m => <option key={m.id} value={String(m.id)}>{m.full_name || m.username}</option>)}
                </select>
                <span style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', color: '#888', pointerEvents: 'none', fontSize: 9 }}>▼</span>
              </div>
            </div>
            <div style={{ minWidth: 160 }}>
              <span style={S.label}>Broker</span>
              <div style={{ position: 'relative' }}>
                <select value={filterBroker} onChange={e => setFilterBroker(e.target.value)} style={S.select}>
                  <option value="">All Brokers</option>
                  {brokers.map(b => <option key={b.id} value={String(b.id)}>{b.full_name || b.username}</option>)}
                </select>
                <span style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', color: '#888', pointerEvents: 'none', fontSize: 9 }}>▼</span>
              </div>
            </div>
          </>
        )}
        <div style={{ minWidth: 130 }}>
          <span style={S.label}>Status</span>
          <div style={{ position: 'relative' }}>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={S.select}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <span style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', color: '#888', pointerEvents: 'none', fontSize: 9 }}>▼</span>
          </div>
        </div>
        <button onClick={() => { setFilterMaster(''); setFilterBroker(''); setFilterStatus(''); setSearch(''); }} style={{ ...S.btn('#3a3a3a', '#aaa'), alignSelf: 'flex-end' }}>
          Clear
        </button>
      </div>

      {/* ── Table area ── */}
      <div style={{ padding: '14px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#888', fontSize: 12 }}>Show</span>
            <select value={showEntries} onChange={e => setShowEntries(e.target.value)} style={{ ...S.select, width: 70, padding: '5px 8px' }}>
              {['10', '25', '50', 'All'].map(v => <option key={v}>{v}</option>)}
            </select>
            <span style={{ color: '#888', fontSize: 12 }}>Entries</span>
            <button onClick={exportCSV} style={{ ...S.btn('#7b5e3b'), fontSize: 11, padding: '4px 12px' }}>CSV</button>
            <button onClick={() => window.print()} style={{ ...S.btn('#7b5e3b'), fontSize: 11, padding: '4px 12px' }}>PDF</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#888', fontSize: 12 }}>Search:</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name / Username / ID" style={{ ...S.input, width: 200, padding: '5px 10px' }} />
          </div>
        </div>

        <div style={{ border: '1px solid #252535', borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
              <thead>
                <tr>
                  {['SR', 'ID', 'Username', 'Full Name', ...(role === 'user' ? ['Master', 'Broker'] : []), 'Balance', 'Trades', 'Brokerage', 'Auto Cut', 'Status', 'Joined', 'Actions'].map(h => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={20} style={{ ...S.td, textAlign: 'center', padding: 32, color: '#666' }}>Loading…</td></tr>
                ) : pageRows.length === 0 ? (
                  <tr><td colSpan={20} style={{ ...S.td, textAlign: 'center', padding: 32, color: '#666' }}>No {role}s found.</td></tr>
                ) : pageRows.map((a, i) => (
                  <tr key={a.id}
                    onMouseEnter={e => e.currentTarget.style.background = '#1e1e30'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ ...S.td, color: '#666' }}>{i + 1}</td>
                    <td style={{ ...S.td, fontFamily: 'var(--font-mono)', color: '#888' }}>{a.id}</td>
                    <td style={{ ...S.td, fontWeight: 700, fontFamily: 'var(--font-mono)', color }}>{a.username}</td>
                    <td style={S.td}>{a.full_name || '—'}</td>
                    {role === 'user' && <>
                      <td style={{ ...S.td, color: '#17a2b8' }}>{a.master_name || '—'}</td>
                      <td style={{ ...S.td, color: '#6f42c1' }}>{a.broker_name || '—'}</td>
                    </>}
                    <td style={{ ...S.td, fontFamily: 'var(--font-mono)', color: '#28a745', fontWeight: 700 }}>₹{fmt(a.balance)}</td>
                    <td style={{ ...S.td, textAlign: 'center' }}>{a.trade_count || 0}</td>
                    <td style={{ ...S.td, fontSize: 11, color: '#888' }}>
                      {Number(a.brokerage_value) > 0
                        ? `₹${Number(a.brokerage_value).toLocaleString('en-IN')}/${a.brokerage_type === 'per_crore' ? 'Cr' : 'Lot'}`
                        : '—'}
                    </td>
                    <td style={{ ...S.td, textAlign: 'center' }}>
                      {a.auto_cut
                        ? <span style={{ background: 'rgba(220,53,69,0.15)', color: '#dc3545', borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>ON</span>
                        : <span style={{ color: '#555', fontSize: 11 }}>Off</span>
                      }
                    </td>
                    <td style={S.td}>
                      <span style={{
                        background: a.is_active ? 'rgba(40,167,69,0.12)' : 'rgba(220,53,69,0.12)',
                        color: a.is_active ? '#28a745' : '#dc3545',
                        border: `1px solid ${a.is_active ? '#28a74530' : '#dc354530'}`,
                        borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 700,
                      }}>
                        {a.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ ...S.td, color: '#666', fontSize: 11 }}>{new Date(a.created_at).toLocaleDateString('en-IN')}</td>
                    <td style={{ ...S.td, whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => setEditAcc(a)} style={{ ...S.btn('#2a2a4a', '#17a2b8'), padding: '3px 10px', fontSize: 11, border: '1px solid #17a2b830' }}>Edit</button>
                        <button onClick={() => setCreditAcc(a)} style={{ ...S.btn('#1a2a1a', '#28a745'), padding: '3px 10px', fontSize: 11, border: '1px solid #28a74530' }}>Credit</button>
                        <button onClick={() => onToggleActive(a)} style={{ ...S.btn(a.is_active ? '#2a1a1a' : '#1a2a1a', a.is_active ? '#dc3545' : '#28a745'), padding: '3px 10px', fontSize: 11 }}>
                          {a.is_active ? 'Disable' : 'Enable'}
                        </button>
                        <button onClick={() => onDelete(a)} style={{ ...S.btn('#2a1a1a', '#dc3545'), padding: '3px 10px', fontSize: 11 }}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, color: '#888', fontSize: 12 }}>
          <span>Showing {pageRows.length} of {filtered.length} entries</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button style={{ ...S.btn('#2a2a3d'), color: '#888', padding: '4px 14px', fontSize: 12 }}>Previous</button>
            <button style={{ ...S.btn(color), padding: '4px 12px', fontSize: 12 }}>1</button>
            <button style={{ ...S.btn('#2a2a3d'), color: '#888', padding: '4px 14px', fontSize: 12 }}>Next</button>
          </div>
        </div>
      </div>

      {/* ── Edit Modal ── */}
      {editAcc && <EditModal acc={editAcc} masters={masters} brokers={brokers} onClose={() => setEditAcc(null)} onSaved={() => { setEditAcc(null); load(); }} showToast={showToast} />}
      {creditAcc && <CreditModal acc={creditAcc} onClose={() => setCreditAcc(null)} onSaved={() => { setCreditAcc(null); load(); }} showToast={showToast} />}
    </div>
  );
}

/* ── Edit Modal ─────────────────────────────────────── */
function EditModal({ acc, masters, brokers, onClose, onSaved, showToast }) {
  const [fullName,      setFullName]      = useState(acc.full_name || '');
  const [balance,       setBalance]       = useState(acc.balance);
  const [phone,         setPhone]         = useState(acc.phone || '');
  const [city,          setCity]          = useState(acc.city || '');
  const [password,      setPassword]      = useState('');
  const [isActive,      setIsActive]      = useState(acc.is_active);
  const [brokerageType, setBrokerageType] = useState(acc.brokerage_type || 'per_lot');
  const [brokerageVal,  setBrokerageVal]  = useState(acc.brokerage_value != null ? String(acc.brokerage_value) : '');
  const [autoCut,       setAutoCut]       = useState(acc.auto_cut || false);
  const [autoCutLimit,  setAutoCutLimit]  = useState(acc.auto_cut_limit != null ? String(acc.auto_cut_limit) : '');
  const [masterId,      setMasterId]      = useState(acc.master_id ? String(acc.master_id) : '');
  const [brokerId,      setBrokerId]      = useState(acc.broker_id ? String(acc.broker_id) : '');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const body = {
        full_name: fullName, balance: Number(balance), is_active: isActive,
        brokerage_type: brokerageType, brokerage_value: Number(brokerageVal) || 0,
        auto_cut: autoCut, auto_cut_limit: autoCut && autoCutLimit ? Number(autoCutLimit) : null,
        phone: phone || null, city: city || null,
        master_id: masterId ? Number(masterId) : null,
        broker_id: brokerId ? Number(brokerId) : null,
      };
      if (password) body.password = password;
      await api.patch(`/admin/students/${acc.id}`, body);
      showToast(`Updated ${acc.username}`);
      onSaved();
    } catch (err) { showToast(err.response?.data?.error || 'Update failed', 'error'); }
    finally { setBusy(false); }
  };

  const F = ({ label, children }) => (
    <div>
      <span style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 3 }}>{label}</span>
      {children}
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: 8, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #252535', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>Edit — {acc.username}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>
        <form onSubmit={submit} style={{ padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <F label="Full Name"><input value={fullName} onChange={e => setFullName(e.target.value)} style={S.input} /></F>
            <F label="Balance (₹)"><input type="number" value={balance} onChange={e => setBalance(e.target.value)} style={S.input} /></F>
            <F label="Phone"><input value={phone} onChange={e => setPhone(e.target.value)} style={S.input} placeholder="+91 ..." /></F>
            <F label="City"><input value={city} onChange={e => setCity(e.target.value)} style={S.input} placeholder="Mumbai" /></F>
            <F label="Reset Password"><input value={password} onChange={e => setPassword(e.target.value)} style={S.input} placeholder="Leave blank to keep" /></F>
            <F label="Status">
              <div style={{ position: 'relative' }}>
                <select value={isActive ? 'active' : 'inactive'} onChange={e => setIsActive(e.target.value === 'active')} style={S.select}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <span style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', color: '#888', pointerEvents: 'none', fontSize: 9 }}>▼</span>
              </div>
            </F>
            {acc.role === 'user' && <>
              <F label="Master">
                <div style={{ position: 'relative' }}>
                  <select value={masterId} onChange={e => setMasterId(e.target.value)} style={S.select}>
                    <option value="">No Master</option>
                    {masters.map(m => <option key={m.id} value={String(m.id)}>{m.full_name || m.username}</option>)}
                  </select>
                  <span style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', color: '#888', pointerEvents: 'none', fontSize: 9 }}>▼</span>
                </div>
              </F>
              <F label="Broker">
                <div style={{ position: 'relative' }}>
                  <select value={brokerId} onChange={e => setBrokerId(e.target.value)} style={S.select}>
                    <option value="">No Broker</option>
                    {brokers.map(b => <option key={b.id} value={String(b.id)}>{b.full_name || b.username}</option>)}
                  </select>
                  <span style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', color: '#888', pointerEvents: 'none', fontSize: 9 }}>▼</span>
                </div>
              </F>
            </>}
          </div>

          {/* Brokerage */}
          <div style={{ border: '1px solid #333', borderRadius: 6, padding: 12, marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: '#17a2b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Brokerage Settings</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <F label="Type">
                <div style={{ position: 'relative' }}>
                  <select value={brokerageType} onChange={e => setBrokerageType(e.target.value)} style={S.select}>
                    <option value="per_lot">Per Lot</option>
                    <option value="per_crore">Per Crore</option>
                  </select>
                  <span style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', color: '#888', pointerEvents: 'none', fontSize: 9 }}>▼</span>
                </div>
              </F>
              <F label={`Rate (₹ per ${brokerageType === 'per_crore' ? 'Crore' : 'Lot'})`}>
                <input type="number" min="0" step="0.01" value={brokerageVal} onChange={e => setBrokerageVal(e.target.value)} style={S.input} placeholder="0.00" />
              </F>
            </div>
          </div>

          {/* Auto Cut */}
          <div style={{ border: '1px solid #333', borderRadius: 6, padding: 12, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: autoCut ? 8 : 0 }}>
              <span style={{ fontSize: 10, color: '#dc3545', fontWeight: 700, textTransform: 'uppercase' }}>Auto Cut</span>
              <button type="button" onClick={() => setAutoCut(!autoCut)} style={{ width: 44, height: 22, borderRadius: 11, background: autoCut ? '#28a745' : '#333', border: 'none', cursor: 'pointer', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 2, left: autoCut ? 22 : 2, width: 18, height: 18, borderRadius: 9, background: '#fff', transition: 'left 150ms' }} />
              </button>
            </div>
            {autoCut && <F label="Limit (₹)"><input type="number" min="0" value={autoCutLimit} onChange={e => setAutoCutLimit(e.target.value)} style={S.input} /></F>}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" onClick={onClose} style={S.btn('#2a2a3d', '#aaa')}>Cancel</button>
            <button type="submit" disabled={busy} style={S.btn('#17a2b8')}>{busy ? 'Saving…' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Credit Modal ───────────────────────────────────── */
function CreditModal({ acc, onClose, onSaved, showToast }) {
  const [amount, setAmount]   = useState('');
  const [desc,   setDesc]     = useState('');
  const [busy,   setBusy]     = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return showToast('Enter a valid amount', 'error');
    setBusy(true);
    try {
      const { data } = await api.post(`/admin/students/${acc.id}/credit`, { amount: Number(amount), description: desc || 'Admin credit' });
      showToast(`₹${Number(amount).toLocaleString('en-IN')} credited. New balance: ₹${Number(data.new_balance).toLocaleString('en-IN')}`);
      onSaved();
    } catch (err) { showToast(err.response?.data?.error || 'Credit failed', 'error'); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: '#1a1a2e', border: '1px solid #28a74550', borderRadius: 8, width: '100%', maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #252535', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#28a745' }}>Credit Account — {acc.username}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>
        <form onSubmit={submit} style={{ padding: 20 }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: '#888' }}>Current Balance:</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#28a745', fontFamily: 'var(--font-mono)' }}>₹{Number(acc.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 3 }}>Amount (₹)</span>
            <input type="number" min="1" step="1000" value={amount} onChange={e => setAmount(e.target.value)} style={{ ...S.input, fontSize: 16, fontWeight: 700 }} placeholder="50000" autoFocus />
          </div>
          <div style={{ marginBottom: 16 }}>
            <span style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 3 }}>Description</span>
            <input value={desc} onChange={e => setDesc(e.target.value)} style={S.input} placeholder="Admin credit — reason" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" onClick={onClose} style={S.btn('#2a2a3d', '#aaa')}>Cancel</button>
            <button type="submit" disabled={busy} style={S.btn('#28a745')}>{busy ? 'Adding…' : '+ Add Credit'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
