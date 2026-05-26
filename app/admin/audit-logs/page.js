'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import PageHeader from '@/components/PageHeader';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/trade-logs')
      .then(r => setLogs(r.data.logs || []))
      .catch(e => console.error('Failed to fetch audit logs:', e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-muted text-sm">Loading…</div>;

  return (
    <div>
      <PageHeader title="Trade Audit Logs" subtitle="Tracking manual modifications, deletions, and administrative actions on trades" />
      
      <div className="card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-surface2/50 text-[10px] uppercase tracking-wider text-muted">
              <th className="p-3 font-semibold">Date & Time</th>
              <th className="p-3 font-semibold">Action</th>
              <th className="p-3 font-semibold">Trade Details</th>
              <th className="p-3 font-semibold">Target User</th>
              <th className="p-3 font-semibold">Done By</th>
              <th className="p-3 font-semibold">Changes</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {logs.map(log => {
              const oldV = log.old_values || {};
              const newV = log.new_values || {};
              return (
                <tr key={log.id} className="border-b border-border/50 hover:bg-surface2/30 transition-colors">
                  <td className="p-3 text-muted whitespace-nowrap text-xs">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.action === 'UPDATE' ? 'bg-orange/10 text-orange' : 
                      log.action === 'DELETE' ? 'bg-red/10 text-red' : 'bg-surface2 text-muted'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 text-xs">
                    <div className="font-semibold">{log.script}</div>
                    <div className={log.trade_type === 'BUY' ? 'text-accent' : 'text-red'}>{log.trade_type}</div>
                  </td>
                  <td className="p-3 font-medium">{log.target_user}</td>
                  <td className="p-3 font-medium">{log.done_by_user}</td>
                  <td className="p-3 text-[11px] font-mono whitespace-pre-wrap text-muted">
                    {Object.keys(newV).map(k => (
                      <div key={k}>
                        {k}: <span className="line-through opacity-70">{oldV[k]}</span> → <span className="text-fg font-semibold">{newV[k]}</span>
                      </div>
                    ))}
                    {Object.keys(newV).length === 0 && 'No changed fields recorded'}
                  </td>
                </tr>
              );
            })}
            {logs.length === 0 && (
              <tr>
                <td colSpan="6" className="p-6 text-center text-muted">No audit logs found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
