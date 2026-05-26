'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import PageHeader from '@/components/PageHeader';

export default function IndicesMasterPage() {
  const [indices, setIndices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  const fetchIndices = () => {
    api.get('/admin/indices')
      .then(r => setIndices(r.data.indices || []))
      .catch(e => console.error('Failed to fetch indices:', e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchIndices();
  }, []);

  const handleToggle = async (id, currentStatus) => {
    setSaving(id);
    try {
      const result = await api.patch(`/admin/indices/${id}`, { is_active: !currentStatus });
      setIndices(indices.map(idx => idx.id === id ? result.data.index : idx));
    } catch (e) {
      console.error('Failed to update index:', e);
      alert('Failed to update. Check console for details.');
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <div className="text-muted text-sm">Loading…</div>;

  return (
    <div>
      <PageHeader 
        title="Indices Master" 
        subtitle="Enable or disable trading for different indices. Only enabled indices will be visible to traders." 
      />
      
      <div className="card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-surface2/50 text-[10px] uppercase tracking-wider text-muted">
              <th className="p-3 font-semibold">Index Name</th>
              <th className="p-3 font-semibold">Display Name</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 font-semibold text-center">Action</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {indices.map(idx => (
              <tr key={idx.id} className="border-b border-border/50 hover:bg-surface2/30 transition-colors">
                <td className="p-3 font-mono font-semibold">{idx.name}</td>
                <td className="p-3">{idx.display_name}</td>
                <td className="p-3">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                    idx.is_active 
                      ? 'bg-green/20 text-green' 
                      : 'bg-muted/20 text-muted'
                  }`}>
                    {idx.is_active ? '✓ Enabled' : '✗ Disabled'}
                  </span>
                </td>
                <td className="p-3 text-center">
                  <button 
                    onClick={() => handleToggle(idx.id, idx.is_active)}
                    disabled={saving === idx.id}
                    className={`py-1 px-4 rounded text-xs font-semibold transition-colors ${
                      idx.is_active
                        ? 'btn-ghost text-red border border-red/30 hover:bg-red/10'
                        : 'btn-primary'
                    }`}
                  >
                    {saving === idx.id ? 'Saving...' : (idx.is_active ? 'Disable' : 'Enable')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {!indices.length && (
          <div className="p-8 text-center text-muted">
            No indices found
          </div>
        )}
      </div>
    </div>
  );
}
