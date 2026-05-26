'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import PageHeader from '@/components/PageHeader';

export default function LotMasterPage() {
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const fetchScripts = () => {
    api.get('/scripts')
      .then(r => setScripts(r.data.scripts || []))
      .catch(e => console.error('Failed to fetch scripts:', e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchScripts();
  }, []);

  const handleEdit = (script) => {
    setEditingId(script.id);
    setEditForm({
      lot_size: script.lot_size,
      max_lots: script.max_lots,
      margin_per_lot: script.margin_per_lot
    });
  };

  const handleSave = async (id) => {
    setSaving(true);
    try {
      await api.patch(`/admin/scripts/${id}`, editForm);
      setEditingId(null);
      fetchScripts();
    } catch (e) {
      console.error('Failed to update script:', e);
      alert('Failed to update. Check console for details.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-muted text-sm">Loading…</div>;

  return (
    <div>
      <PageHeader title="Lot Master" subtitle="Manage script lot sizes, maximum lots allowed, and margin requirements" />
      
      <div className="card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-surface2/50 text-[10px] uppercase tracking-wider text-muted">
              <th className="p-3 font-semibold">Script</th>
              <th className="p-3 font-semibold text-right">Lot Size</th>
              <th className="p-3 font-semibold text-right">Max Lots</th>
              <th className="p-3 font-semibold text-right">Margin Per Lot (₹)</th>
              <th className="p-3 font-semibold text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {scripts.map(s => {
              const isEditing = editingId === s.id;
              return (
                <tr key={s.id} className={`border-b border-border/50 hover:bg-surface2/30 transition-colors ${isEditing ? 'bg-surface2/30' : ''}`}>
                  <td className="p-3">
                    <div className="font-bold">{s.name}</div>
                    <div className="text-[10px] text-muted uppercase">{s.exchange} | Exp: {s.expiry}</div>
                  </td>
                  
                  {isEditing ? (
                    <>
                      <td className="p-3 text-right">
                        <input type="number" className="input text-right w-24 py-1 px-2 h-auto text-sm" value={editForm.lot_size} onChange={e => setEditForm({...editForm, lot_size: Number(e.target.value)})} />
                      </td>
                      <td className="p-3 text-right">
                        <input type="number" className="input text-right w-24 py-1 px-2 h-auto text-sm" value={editForm.max_lots} onChange={e => setEditForm({...editForm, max_lots: Number(e.target.value)})} />
                      </td>
                      <td className="p-3 text-right">
                        <input type="number" className="input text-right w-32 py-1 px-2 h-auto text-sm" value={editForm.margin_per_lot} onChange={e => setEditForm({...editForm, margin_per_lot: Number(e.target.value)})} />
                      </td>
                      <td className="p-3 text-center space-x-2">
                        <button onClick={() => handleSave(s.id)} disabled={saving} className="btn-primary py-1 px-3 text-xs">Save</button>
                        <button onClick={() => setEditingId(null)} disabled={saving} className="btn-ghost py-1 px-3 text-xs">Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-3 text-right font-medium">{s.lot_size}</td>
                      <td className="p-3 text-right font-medium">{s.max_lots}</td>
                      <td className="p-3 text-right font-medium price">₹{Number(s.margin_per_lot).toLocaleString('en-IN')}</td>
                      <td className="p-3 text-center">
                        <button onClick={() => handleEdit(s)} className="btn-ghost py-1 px-3 text-xs text-accent border border-accent/30 hover:bg-accent/10">Edit</button>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
