'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import PageHeader from '@/components/PageHeader';

export default function RiskManagementPage() {
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  const fetchScripts = () => {
    api.get('/scripts')
      .then(r => setScripts(r.data.scripts || []))
      .catch(e => console.error('Failed to fetch scripts:', e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchScripts();
  }, []);

  const toggleBan = async (script) => {
    const isBanned = !script.is_banned;
    let reason = '';
    if (isBanned) {
      reason = prompt('Enter ban reason (e.g., High Volatility):', 'High Volatility');
      if (reason === null) return; // User cancelled
    }
    
    setSaving(script.id);
    try {
      await api.patch(`/admin/scripts/${script.id}`, {
        is_banned: isBanned,
        ban_reason: isBanned ? reason : null
      });
      fetchScripts();
    } catch (e) {
      console.error('Failed to update ban status:', e);
      alert('Failed to update. Check console for details.');
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <div className="text-muted text-sm">Loading…</div>;

  return (
    <div>
      <PageHeader title="Risk Management" subtitle="Control script bans and trading halts" />
      
      <div className="card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-surface2/50 text-[10px] uppercase tracking-wider text-muted">
              <th className="p-3 font-semibold">Script</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 font-semibold">Reason</th>
              <th className="p-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {scripts.map(s => {
              const isBanned = s.is_banned;
              return (
                <tr key={s.id} className={`border-b border-border/50 hover:bg-surface2/30 transition-colors ${isBanned ? 'bg-red/5' : ''}`}>
                  <td className="p-3">
                    <div className="font-bold">{s.name}</div>
                    <div className="text-[10px] text-muted uppercase">{s.exchange} | Exp: {s.expiry}</div>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isBanned ? 'bg-red/10 text-red' : 'bg-green/10 text-green'}`}>
                      {isBanned ? 'BANNED' : 'ACTIVE'}
                    </span>
                  </td>
                  <td className="p-3 text-muted">
                    {isBanned ? s.ban_reason : '—'}
                  </td>
                  <td className="p-3 text-right">
                    <button 
                      onClick={() => toggleBan(s)} 
                      disabled={saving === s.id}
                      className={`btn-ghost py-1 px-3 text-xs border ${
                        isBanned 
                          ? 'text-green border-green/30 hover:bg-green/10' 
                          : 'text-red border-red/30 hover:bg-red/10'
                      }`}
                    >
                      {saving === s.id ? 'Saving…' : (isBanned ? 'Unban' : 'Ban')}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
