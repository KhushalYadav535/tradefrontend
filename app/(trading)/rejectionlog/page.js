'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';

export default function RejectionLogPage() {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/trades/rejectionlog')
      .then((r) => setTrades(r.data.trades))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Rejection Log" subtitle="Orders that failed validation" />

      {loading ? (
        <div className="text-muted text-sm">Loading…</div>
      ) : trades.length === 0 ? (
        <EmptyState title="No rejections" subtitle="All your orders went through" />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Script</th>
                <th>Type</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Price</th>
                <th>Reason</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((t, i) => (
                <tr key={t.id}>
                  <td className="text-muted">{i + 1}</td>
                  <td>
                    <div className="font-semibold">{t.script}</div>
                    <div className="text-[10px] text-muted">{t.exchange}</div>
                  </td>
                  <td><span className={t.trade_type === 'BUY' ? 'badge-buy' : 'badge-sell'}>{t.trade_type}</span></td>
                  <td className="price text-right">{t.quantity}</td>
                  <td className="price text-right">{Number(t.price).toFixed(2)}</td>
                  <td className="text-red text-xs">{t.reject_reason}</td>
                  <td className="text-muted text-xs">{new Date(t.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
