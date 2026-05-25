'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';

export default function BannedPage() {
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/scripts/banned')
      .then((r) => setScripts(r.data.scripts))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Banned / Blocked Scripts" subtitle="Scripts currently restricted from trading" />

      {loading ? (
        <div className="text-muted text-sm">Loading…</div>
      ) : scripts.length === 0 ? (
        <EmptyState title="No banned scripts" subtitle="All scripts are open for trading" />
      ) : (
        <div className="card overflow-hidden">
          {/* Mobile Cards */}
          <div className="flex flex-col md:hidden divide-y divide-border/50">
            {scripts.map((s, i) => (
              <div key={s.id} className="p-4 flex flex-col gap-2 hover:bg-surface2/30 transition-colors">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-fg">{s.name}</span>
                    <span className="text-[10px] text-muted font-medium bg-surface2 px-1.5 py-0.5 rounded">{s.exchange}</span>
                  </div>
                  <span className="badge-bad">Blocked</span>
                </div>
                <div className="flex flex-col mt-1">
                  <span className="text-[11px] text-muted font-semibold uppercase tracking-wider">Reason</span>
                  <span className="text-sm text-fg mt-0.5">{s.ban_reason}</span>
                </div>
                <div className="text-xs text-muted mt-2 border-t border-border/30 pt-2">
                  Banned On: {new Date(s.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Script</th>
                  <th>Exchange</th>
                  <th>Reason</th>
                  <th>Banned On</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {scripts.map((s, i) => (
                  <tr key={s.id}>
                    <td className="text-muted">{i + 1}</td>
                    <td className="font-semibold">{s.name}</td>
                    <td className="text-muted text-xs">{s.exchange}</td>
                    <td>{s.ban_reason}</td>
                    <td className="text-muted text-xs">{new Date(s.created_at).toLocaleDateString()}</td>
                    <td><span className="badge-bad">Blocked</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
