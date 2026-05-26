'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import PageHeader from '@/components/PageHeader';

const COMMON_INDICES = [
  { name: 'NSE', display_name: 'NSE - National Stock Exchange' },
  { name: 'NSEFUT', display_name: 'NSE Futures' },
  { name: 'NSEOPT', display_name: 'NSE Options' },
  { name: 'BSE', display_name: 'BSE - Bombay Stock Exchange' },
  { name: 'BSEFUT', display_name: 'BSE Futures' },
  { name: 'MCX', display_name: 'MCX - Multi Commodity Exchange' },
  { name: 'MCXFUT', display_name: 'MCX Futures' },
];

export default function IndicesMasterPage() {
  const [indices, setIndices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', display_name: '' });
  const [formError, setFormError] = useState('');
  const [formSaving, setFormSaving] = useState(false);

  const fetchIndices = () => {
    api.get('/admin/indices')
      .then(r => setIndices(r.data.indices || []))
      .catch(e => console.error('Failed to fetch indices:', e))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchIndices(); }, []);

  const handleToggle = async (id, currentStatus) => {
    setSaving(id);
    try {
      const result = await api.patch(`/admin/indices/${id}`, { is_active: !currentStatus });
      setIndices(prev => prev.map(idx => idx.id === id ? result.data.index : idx));
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to update');
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete index "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await api.delete(`/admin/indices/${id}`);
      setIndices(prev => prev.filter(idx => idx.id !== id));
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  const handleQuickAdd = (item) => {
    setForm({ name: item.name, display_name: item.display_name });
    setFormError('');
    setShowForm(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.name.trim() || !form.display_name.trim()) {
      setFormError('Both fields are required');
      return;
    }
    setFormSaving(true);
    try {
      const result = await api.post('/admin/indices', form);
      setIndices(prev => [...prev, result.data.index]);
      setForm({ name: '', display_name: '' });
      setShowForm(false);
    } catch (e) {
      setFormError(e.response?.data?.error || 'Failed to create index');
    } finally {
      setFormSaving(false);
    }
  };

  const existingNames = new Set(indices.map(i => i.name));
  const remaining = COMMON_INDICES.filter(c => !existingNames.has(c.name));

  if (loading) return <div className="text-muted text-sm">Loading…</div>;

  return (
    <div>
      <PageHeader
        title="Indices Master"
        subtitle="Enable or disable trading segments. Only enabled indices will be visible to traders."
      />

      {/* Quick Add Buttons */}
      {remaining.length > 0 && (
        <div className="card p-4 mb-4">
          <div className="text-[10px] uppercase tracking-wider text-muted mb-3 font-semibold">
            Quick Add — Common Exchanges
          </div>
          <div className="flex flex-wrap gap-2">
            {remaining.map(item => (
              <button
                key={item.name}
                onClick={() => handleQuickAdd(item)}
                className="btn-ghost py-1.5 px-3 text-xs font-mono border border-border hover:border-brand hover:text-brand transition-colors"
              >
                + {item.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add Index Form */}
      {showForm && (
        <div className="card p-4 mb-4 border border-brand/30">
          <div className="text-sm font-semibold mb-3 text-brand-2">Add New Index</div>
          <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3 items-start">
            <div className="flex-1">
              <label className="text-[10px] uppercase tracking-wider text-muted mb-1 block">Index Name (e.g. NSE, NSEFUT)</label>
              <input
                className="input w-full font-mono uppercase"
                placeholder="NSE"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value.toUpperCase() }))}
                maxLength={30}
                autoFocus
              />
            </div>
            <div className="flex-[2]">
              <label className="text-[10px] uppercase tracking-wider text-muted mb-1 block">Display Name</label>
              <input
                className="input w-full"
                placeholder="NSE - National Stock Exchange"
                value={form.display_name}
                onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
                maxLength={100}
              />
            </div>
            <div className="flex gap-2 pt-5">
              <button
                type="submit"
                disabled={formSaving}
                className="btn-primary py-2 px-4 text-xs"
              >
                {formSaving ? 'Adding…' : 'Add Index'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setFormError(''); setForm({ name: '', display_name: '' }); }}
                className="btn-ghost py-2 px-4 text-xs"
              >
                Cancel
              </button>
            </div>
          </form>
          {formError && (
            <div className="mt-2 text-xs text-red">{formError}</div>
          )}
        </div>
      )}

      {/* Add Button */}
      {!showForm && (
        <div className="mb-4">
          <button
            onClick={() => { setShowForm(true); setFormError(''); }}
            className="btn-primary py-2 px-4 text-sm"
          >
            + Add Index
          </button>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-surface2/50 text-[10px] uppercase tracking-wider text-muted">
              <th className="p-3 font-semibold">Index Name</th>
              <th className="p-3 font-semibold">Display Name</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 font-semibold text-center">Enable / Disable</th>
              <th className="p-3 font-semibold text-center">Delete</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {indices.map(idx => (
              <tr key={idx.id} className="border-b border-border/50 hover:bg-surface2/30 transition-colors">
                <td className="p-3 font-mono font-semibold">{idx.name}</td>
                <td className="p-3 text-muted">{idx.display_name}</td>
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
                <td className="p-3 text-center">
                  <button
                    onClick={() => handleDelete(idx.id, idx.name)}
                    disabled={deleting === idx.id}
                    className="py-1 px-3 rounded text-xs font-semibold text-red border border-red/20 hover:bg-red/10 transition-colors disabled:opacity-40"
                  >
                    {deleting === idx.id ? '…' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!indices.length && (
          <div className="p-10 text-center">
            <div className="text-muted text-sm mb-1">No indices found</div>
            <div className="text-muted/60 text-xs">Use the quick-add buttons above to add NSE, NSEFUT, BSE etc.</div>
          </div>
        )}
      </div>
    </div>
  );
}
