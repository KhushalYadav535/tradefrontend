'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import PageHeader from '@/components/PageHeader';

export default function RejectionsPage() {
  const [rejections, setRejections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/rejections')
      .then(r => setRejections(r.data.rejections || []))
      .catch(e => console.error('Failed to fetch rejections:', e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-muted text-sm">Loading…</div>;

  return (
    <div>
      <PageHeader title="Lot Validation & Rejection Logs" subtitle="Review failed trade attempts and validation reasons" />
      
      <div className="card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-surface2/50 text-[10px] uppercase tracking-wider text-muted">
              <th className="p-3 font-semibold">Time</th>
              <th className="p-3 font-semibold">User</th>
              <th className="p-3 font-semibold">Script</th>
              <th className="p-3 font-semibold text-right">Attempted Qty</th>
              <th className="p-3 font-semibold">Reason</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {rejections.map(t => (
              <tr key={t.id} className="border-b border-border/50 hover:bg-surface2/30 transition-colors">
                <td className="p-3 text-muted whitespace-nowrap">{new Date(t.created_at).toLocaleString()}</td>
                <td className="p-3 font-medium">{t.username}</td>
                <td className="p-3">
                  <div className="font-semibold">{t.script}</div>
                  <div className="text-[10px] text-muted">{t.exchange}</div>
                </td>
                <td className="p-3 text-right">
                  <span className={t.trade_type === 'BUY' ? 'text-accent' : 'text-red'}>{t.trade_type}</span> {t.quantity}
                </td>
                <td className="p-3">
                  <span className="text-red font-medium">{t.reject_reason || 'Unknown Error'}</span>
                </td>
              </tr>
            ))}
            {rejections.length === 0 && (
              <tr>
                <td colSpan="5" className="p-6 text-center text-muted">No rejected orders found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
