'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import PageHeader from '@/components/PageHeader';

export default function ScriptMasterPage() {
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [filterExchange, setFilterExchange] = useState('');

  const fetchScripts = () => {
    api.get('/admin/script-master')
      .then(r => setScripts(r.data.scripts || []))
      .catch(e => console.error('Failed to fetch scripts:', e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchScripts();
  }, []);

  const handleToggle = async (id, currentStatus) => {
    setSaving(id);
    try {
      const result = await api.patch(`/admin/script-master/${id}`, { is_active: !currentStatus });
      setScripts(scripts.map(s => s.id === id ? result.data.script : s));
    } catch (e) {
      console.error('Failed to update script:', e);
      alert('Failed to update. Check console for details.');
    } finally {
      setSaving(null);
    }
  };

  const exchanges = ['', ...new Set(scripts.map(s => s.exchange))];
  const filtered = filterExchange 
    ? scripts.filter(s => s.exchange === filterExchange)
    : scripts;

  const activeCount = scripts.filter(s => s.is_active).length;
  const disabledCount = scripts.filter(s => !s.is_active).length;

  if (loading) return <div className="text-muted text-sm">Loading…</div>;

  return (
    <div>
      <PageHeader 
        title="Script Master" 
        subtitle="Enable or disable stocks for trading. Only enabled scripts will be available for traders to trade." 
      />
      
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="card p-4 text-center">
          <div className="text-[10px] uppercase tracking-wider text-muted mb-1">Total Scripts</div>
          <div className="text-2xl font-bold">{scripts.length}</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-[10px] uppercase tracking-wider text-muted mb-1">Enabled</div>
          <div className="text-2xl font-bold text-green">{activeCount}</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-[10px] uppercase tracking-wider text-muted mb-1">Disabled</div>
          <div className="text-2xl font-bold text-red">{disabledCount}</div>
        </div>
      </div>

      <div className="card p-4 mb-4">
        <label className="text-sm text-muted mb-2 block">Filter by Exchange</label>
        <select 
          value={filterExchange} 
          onChange={(e) => setFilterExchange(e.target.value)}
          className="input w-full md:w-48"
        >
          {exchanges.map(ex => (
            <option key={ex || 'all'} value={ex}>
              {ex || 'All Exchanges'}
            </option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-surface2/50 text-[10px] uppercase tracking-wider text-muted">
              <th className="p-3 font-semibold">Script Name</th>
              <th className="p-3 font-semibold">Exchange</th>
              <th className="p-3 font-semibold text-right">Current Price</th>
              <th className="p-3 font-semibold text-right">Lot Size</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 font-semibold text-center">Action</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {filtered.map(s => (
              <tr 
                key={s.id} 
                className={`border-b border-border/50 hover:bg-surface2/30 transition-colors ${
                  s.is_banned ? 'opacity-50' : ''
                }`}
              >
                <td className="p-3">
                  <div className="font-bold">{s.name}</div>
                  {s.is_banned && <div className="text-[10px] text-red">Banned</div>}
                </td>
                <td className="p-3">
                  <span className="bg-surface2/50 px-2 py-1 rounded text-xs font-mono">{s.exchange}</span>
                </td>
                <td className="p-3 text-right font-mono">₹{Number(s.current_price || 0).toFixed(2)}</td>
                <td className="p-3 text-right">{s.lot_size}</td>
                <td className="p-3">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                    s.is_active 
                      ? 'bg-green/20 text-green' 
                      : 'bg-muted/20 text-muted'
                  }`}>
                    {s.is_active ? '✓ Enabled' : '✗ Disabled'}
                  </span>
                </td>
                <td className="p-3 text-center">
                  <button 
                    onClick={() => handleToggle(s.id, s.is_active)}
                    disabled={saving === s.id || s.is_banned}
                    className={`py-1 px-4 rounded text-xs font-semibold transition-colors ${
                      s.is_banned
                        ? 'opacity-50 cursor-not-allowed'
                        : s.is_active
                        ? 'btn-ghost text-red border border-red/30 hover:bg-red/10'
                        : 'btn-primary'
                    }`}
                  >
                    {saving === s.id ? 'Saving...' : (s.is_active ? 'Disable' : 'Enable')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {!filtered.length && (
          <div className="p-8 text-center text-muted">
            {scripts.length === 0 ? 'No scripts found' : 'No scripts match the selected filter'}
          </div>
        )}
      </div>
    </div>
  );
}
