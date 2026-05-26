'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import PageHeader from '@/components/PageHeader';

const EMPTY_FORM = {
  name: '',
  exchange: '',
  expiry: '',
  lot_size: '1',
  max_lots: '100',
  margin_per_lot: '',
  current_price: '',
};

const COMMON_SCRIPTS = [
  { name: 'NIFTY',      exchange: 'NSE',    lot_size: '50' },
  { name: 'BANKNIFTY',  exchange: 'NSE',    lot_size: '15' },
  { name: 'FINNIFTY',   exchange: 'NSE',    lot_size: '40' },
  { name: 'SENSEX',     exchange: 'BSE',    lot_size: '10' },
  { name: 'RELIANCE',   exchange: 'NSE',    lot_size: '250' },
  { name: 'TCS',        exchange: 'NSE',    lot_size: '150' },
  { name: 'INFY',       exchange: 'NSE',    lot_size: '300' },
  { name: 'HDFCBANK',   exchange: 'NSE',    lot_size: '550' },
  { name: 'CRUDEOIL',   exchange: 'MCX',    lot_size: '100' },
  { name: 'GOLD',       exchange: 'MCX',    lot_size: '100' },
  { name: 'SILVER',     exchange: 'MCX',    lot_size: '30' },
];

export default function ScriptMasterPage() {
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [filterExchange, setFilterExchange] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [formSaving, setFormSaving] = useState(false);

  const fetchScripts = () => {
    api.get('/admin/script-master')
      .then(r => setScripts(r.data.scripts || []))
      .catch(e => console.error('Failed to fetch scripts:', e))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchScripts(); }, []);

  const handleToggle = async (id, currentStatus) => {
    setSaving(id);
    try {
      const result = await api.patch(`/admin/script-master/${id}`, { is_active: !currentStatus });
      setScripts(prev => prev.map(s => s.id === id ? result.data.script : s));
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to update');
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete script "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await api.delete(`/admin/script-master/${id}`);
      setScripts(prev => prev.filter(s => s.id !== id));
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  const handleQuickAdd = (item) => {
    setForm({ ...EMPTY_FORM, name: item.name, exchange: item.exchange, lot_size: item.lot_size });
    setFormError('');
    setShowForm(true);
    setTimeout(() => document.getElementById('script-price-input')?.focus(), 100);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.name.trim() || !form.exchange.trim()) {
      setFormError('Script name and Exchange are required');
      return;
    }
    setFormSaving(true);
    try {
      const result = await api.post('/admin/script-master', {
        name: form.name.trim().toUpperCase(),
        exchange: form.exchange.trim().toUpperCase(),
        expiry: form.expiry || undefined,
        lot_size: form.lot_size,
        max_lots: form.max_lots,
        margin_per_lot: form.margin_per_lot || undefined,
        current_price: form.current_price || undefined,
      });
      setScripts(prev => [...prev, result.data.script]);
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch (e) {
      setFormError(e.response?.data?.error || 'Failed to create script');
    } finally {
      setFormSaving(false);
    }
  };

  // Filtering
  const existingKeys = new Set(scripts.map(s => `${s.name}__${s.exchange}`));
  const quickSuggestions = COMMON_SCRIPTS.filter(c => !existingKeys.has(`${c.name}__${c.exchange}`));

  const exchanges = ['', ...new Set(scripts.map(s => s.exchange))];
  const filtered = scripts
    .filter(s => !filterExchange || s.exchange === filterExchange)
    .filter(s => !filterStatus || (filterStatus === 'active' ? s.is_active : !s.is_active))
    .filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()));

  const activeCount = scripts.filter(s => s.is_active).length;
  const disabledCount = scripts.filter(s => !s.is_active).length;

  if (loading) return <div className="text-muted text-sm">Loading…</div>;

  return (
    <div>
      <PageHeader
        title="Script Master"
        subtitle="Manage stocks and scripts available for trading. Only enabled scripts appear for traders."
      />

      {/* Stats */}
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

      {/* Quick Add Suggestions */}
      {quickSuggestions.length > 0 && (
        <div className="card p-4 mb-4">
          <div className="text-[10px] uppercase tracking-wider text-muted mb-3 font-semibold">
            Quick Add — Common Scripts
          </div>
          <div className="flex flex-wrap gap-2">
            {quickSuggestions.map(item => (
              <button
                key={`${item.name}-${item.exchange}`}
                onClick={() => handleQuickAdd(item)}
                className="btn-ghost py-1.5 px-3 text-xs font-mono border border-border hover:border-brand hover:text-brand transition-colors"
              >
                + {item.name}
                <span className="ml-1 text-muted">({item.exchange})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add Script Form */}
      {showForm && (
        <div className="card p-5 mb-4 border border-brand/30">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-brand-2">Add New Script</div>
            <button onClick={() => { setShowForm(false); setFormError(''); setForm(EMPTY_FORM); }}
              className="text-muted hover:text-fg text-lg leading-none">✕</button>
          </div>
          <form onSubmit={handleCreate}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted mb-1 block">
                  Script Name <span className="text-red">*</span>
                </label>
                <input
                  className="input w-full font-mono uppercase"
                  placeholder="NIFTY"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value.toUpperCase() }))}
                  maxLength={50}
                  required
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted mb-1 block">
                  Exchange <span className="text-red">*</span>
                </label>
                <select
                  className="input w-full"
                  value={form.exchange}
                  onChange={e => setForm(f => ({ ...f, exchange: e.target.value }))}
                  required
                >
                  <option value="">Select Exchange</option>
                  <option value="NSE">NSE</option>
                  <option value="NSEFUT">NSEFUT</option>
                  <option value="NSEOPT">NSEOPT</option>
                  <option value="BSE">BSE</option>
                  <option value="BSEFUT">BSEFUT</option>
                  <option value="MCX">MCX</option>
                  <option value="MCXFUT">MCXFUT</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted mb-1 block">Expiry (optional)</label>
                <input
                  className="input w-full font-mono"
                  placeholder="27-JUN-2025"
                  value={form.expiry}
                  onChange={e => setForm(f => ({ ...f, expiry: e.target.value }))}
                  maxLength={20}
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted mb-1 block">Lot Size</label>
                <input
                  id="script-price-input"
                  type="number"
                  min="1"
                  className="input w-full"
                  placeholder="50"
                  value={form.lot_size}
                  onChange={e => setForm(f => ({ ...f, lot_size: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted mb-1 block">Max Lots</label>
                <input
                  type="number"
                  min="1"
                  className="input w-full"
                  placeholder="100"
                  value={form.max_lots}
                  onChange={e => setForm(f => ({ ...f, max_lots: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted mb-1 block">Current Price (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input w-full"
                  placeholder="0.00"
                  value={form.current_price}
                  onChange={e => setForm(f => ({ ...f, current_price: e.target.value }))}
                />
              </div>
            </div>

            {formError && (
              <div className="mb-3 text-xs text-red bg-red/10 border border-red/20 rounded px-3 py-2">
                {formError}
              </div>
            )}

            <div className="flex gap-2">
              <button type="submit" disabled={formSaving} className="btn-primary py-2 px-5 text-sm">
                {formSaving ? 'Adding…' : 'Add Script'}
              </button>
              <button type="button"
                onClick={() => { setShowForm(false); setFormError(''); setForm(EMPTY_FORM); }}
                className="btn-ghost py-2 px-4 text-sm">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Toolbar */}
      <div className="card p-3 mb-4 flex flex-wrap gap-3 items-center">
        {!showForm && (
          <button onClick={() => { setShowForm(true); setFormError(''); setForm(EMPTY_FORM); }}
            className="btn-primary py-2 px-4 text-sm shrink-0">
            + Add Script
          </button>
        )}
        <input
          className="input py-2 text-sm flex-1 min-w-[160px]"
          placeholder="Search script name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select value={filterExchange} onChange={e => setFilterExchange(e.target.value)} className="input py-2 text-sm w-40">
          {exchanges.map(ex => (
            <option key={ex || 'all'} value={ex}>{ex || 'All Exchanges'}</option>
          ))}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input py-2 text-sm w-36">
          <option value="">All Status</option>
          <option value="active">Enabled</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-surface2/50 text-[10px] uppercase tracking-wider text-muted">
              <th className="p-3 font-semibold">Script</th>
              <th className="p-3 font-semibold">Exchange</th>
              <th className="p-3 font-semibold text-right">Price</th>
              <th className="p-3 font-semibold text-right">Lot</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 font-semibold text-center">Enable/Disable</th>
              <th className="p-3 font-semibold text-center">Delete</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {filtered.map(s => (
              <tr key={s.id}
                className={`border-b border-border/50 hover:bg-surface2/30 transition-colors ${s.is_banned ? 'opacity-50' : ''}`}>
                <td className="p-3">
                  <div className="font-bold font-mono">{s.name}</div>
                  {s.is_banned && <div className="text-[10px] text-red">Banned</div>}
                </td>
                <td className="p-3">
                  <span className="bg-surface2/50 px-2 py-1 rounded text-xs font-mono">{s.exchange}</span>
                </td>
                <td className="p-3 text-right font-mono">₹{Number(s.current_price || 0).toFixed(2)}</td>
                <td className="p-3 text-right">{s.lot_size}</td>
                <td className="p-3">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                    s.is_active ? 'bg-green/20 text-green' : 'bg-muted/20 text-muted'
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
                        ? 'opacity-40 cursor-not-allowed'
                        : s.is_active
                        ? 'btn-ghost text-red border border-red/30 hover:bg-red/10'
                        : 'btn-primary'
                    }`}
                  >
                    {saving === s.id ? '…' : (s.is_active ? 'Disable' : 'Enable')}
                  </button>
                </td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => handleDelete(s.id, s.name)}
                    disabled={deleting === s.id}
                    className="py-1 px-3 rounded text-xs font-semibold text-red border border-red/20 hover:bg-red/10 transition-colors disabled:opacity-40"
                  >
                    {deleting === s.id ? '…' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!filtered.length && (
          <div className="p-10 text-center">
            <div className="text-muted text-sm mb-1">
              {scripts.length === 0 ? 'No scripts found' : 'No scripts match the filter'}
            </div>
            {scripts.length === 0 && (
              <div className="text-muted/60 text-xs mt-1">
                Use quick-add buttons above to add NIFTY, BANKNIFTY etc.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
