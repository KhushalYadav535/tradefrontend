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
        <div className="table-wrap">
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
      )}
    </div>
  );
}
