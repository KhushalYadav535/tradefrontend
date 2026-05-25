'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';

export default function EditLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/trades/editlog')
      .then((r) => setLogs(r.data.logs))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Trade Edit / Delete Log" subtitle="Audit trail of trade modifications" />

      {loading ? (
        <div className="text-muted text-sm">Loading…</div>
      ) : logs.length === 0 ? (
        <EmptyState title="No edits or deletions yet" subtitle="Trade modifications will be recorded here" />
      ) : (
        <div className="card overflow-hidden">
          {/* Mobile Cards */}
          <div className="flex flex-col md:hidden divide-y divide-border/50">
            {logs.map((l, i) => (
              <div key={l.id} className="p-4 flex flex-col gap-3 hover:bg-surface2/30 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="font-bold text-fg">{l.script}</span>
                    <span className="text-[11px] text-muted font-medium mt-0.5">Trade #{l.trade_id}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={l.action === 'EDITED' ? 'badge-warn' : 'badge-bad'}>{l.action}</span>
                    <span className="text-[10px] text-muted">{new Date(l.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 bg-bg/50 p-2 rounded border border-border/30">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase text-muted font-bold tracking-wider">Old Value</span>
                    <span className="text-xs font-mono text-muted break-all">{l.old_values ? JSON.stringify(l.old_values) : '—'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase text-muted font-bold tracking-wider">New Value</span>
                    <span className="text-xs font-mono text-fg break-all">{l.new_values ? JSON.stringify(l.new_values) : '—'}</span>
                  </div>
                </div>

                <div className="text-[10px] text-muted text-right">
                  Done by <span className="font-semibold text-fg/80">{l.done_by || 'system'}</span>
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
                  <th>Trade ID</th>
                  <th>Script</th>
                  <th>Action</th>
                  <th>Old Value</th>
                  <th>New Value</th>
                  <th>Done By</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l, i) => (
                  <tr key={l.id}>
                    <td className="text-muted">{i + 1}</td>
                    <td className="price">#{l.trade_id}</td>
                    <td className="font-semibold">{l.script}</td>
                    <td>
                      <span className={l.action === 'EDITED' ? 'badge-warn' : 'badge-bad'}>{l.action}</span>
                    </td>
                    <td className="text-xs text-muted">{l.old_values ? JSON.stringify(l.old_values) : '—'}</td>
                    <td className="text-xs">{l.new_values ? JSON.stringify(l.new_values) : '—'}</td>
                    <td>{l.done_by || 'system'}</td>
                    <td className="text-muted text-xs">{new Date(l.created_at).toLocaleString()}</td>
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
