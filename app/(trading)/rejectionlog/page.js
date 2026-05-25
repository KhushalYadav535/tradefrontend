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
        <div className="card overflow-hidden">
          {/* Mobile Cards */}
          <div className="flex flex-col md:hidden divide-y divide-border/50">
            {trades.map((t, i) => (
              <div key={t.id} className="p-4 flex flex-col gap-2 hover:bg-surface2/30 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className={t.trade_type === 'BUY' ? 'badge-buy' : 'badge-sell'}>{t.trade_type}</span>
                      <span className="font-bold text-fg">{t.script}</span>
                    </div>
                    <span className="text-[10px] text-muted font-medium mt-1">{t.exchange}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs text-muted mt-1">{new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                  </div>
                </div>

                <div className="flex justify-between items-end mt-1 pt-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase text-muted font-bold tracking-wider">Qty @ Price</span>
                    <span className="price font-medium">
                      {t.quantity} <span className="text-muted text-xs mx-0.5">@</span> {Number(t.price).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="mt-2 bg-red/10 border border-red/20 rounded p-2.5">
                  <span className="text-[10px] uppercase text-red/80 font-bold tracking-wider block mb-0.5">Reject Reason</span>
                  <span className="text-sm font-semibold text-red leading-snug">{t.reject_reason}</span>
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
        </div>
      )}
    </div>
  );
}
