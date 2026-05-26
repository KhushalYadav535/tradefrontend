'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import PageHeader from '@/components/PageHeader';

const DEFAULT_FLAGS = [
  { key: 'allow_trading', label: 'Allow Trading', description: 'Master switch to allow or block all incoming trades.' },
  { key: 'maintenance_mode', label: 'Maintenance Mode', description: 'Show a maintenance screen to non-admin users.' },
  { key: 'market_open', label: 'Market Open Status', description: 'Simulate market open/close for testing.' }
];

export default function FeatureFlagsPage() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = () => {
    api.get('/admin/settings')
      .then(r => setSettings(r.data.settings || {}))
      .catch(e => console.error('Failed to fetch settings:', e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const toggleFlag = (key) => {
    const newVal = !settings[key];
    setSettings(prev => ({ ...prev, [key]: newVal }));
    setSaving(true);
    api.post('/admin/settings', { [key]: newVal })
      .catch(e => {
        console.error('Failed to update flag:', e);
        // Revert on failure
        setSettings(prev => ({ ...prev, [key]: !newVal }));
      })
      .finally(() => setSaving(false));
  };

  if (loading) return <div className="text-muted text-sm">Loading…</div>;

  return (
    <div>
      <PageHeader title="Feature Flags" subtitle="Toggle platform features and global settings" />
      
      <div className="card p-6 max-w-2xl">
        <div className="space-y-6">
          {DEFAULT_FLAGS.map(flag => (
            <div key={flag.key} className="flex items-center justify-between border-b border-border/50 pb-6 last:border-0 last:pb-0">
              <div>
                <div className="font-semibold text-base">{flag.label}</div>
                <div className="text-sm text-muted">{flag.description}</div>
              </div>
              <button
                onClick={() => toggleFlag(flag.key)}
                disabled={saving}
                className={`w-14 h-7 rounded-full relative transition-colors duration-200 focus:outline-none ${
                  settings[flag.key] ? 'bg-accent' : 'bg-surface2 border border-border'
                } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
                  settings[flag.key] ? 'translate-x-7' : 'translate-x-0 bg-muted'
                }`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
