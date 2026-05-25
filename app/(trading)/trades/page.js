'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';

export default function TradesPage() {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      const { data } = await api.get('/trades');
      setTrades(data.trades);
      setError(null);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load trades');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div>
      <PageHeader title="Trades" subtitle="Today's executed and rejected orders" />

      {loading ? (
        <div className="text-muted text-sm">Loading…</div>
      ) : error ? (
        <div className="card p-6 text-red">{error}</div>
      ) : trades.length === 0 ? (
        <EmptyState title="No trades yet" subtitle="Place an order from the Watchlist to see it here" />
      ) : (
        <div className="card overflow-hidden">
          {/* Mobile Cards */}
          <div className="flex flex-col md:hidden divide-y divide-border/50">
            {trades.map((t) => (
              <div key={t.id} className="p-4 flex flex-col gap-2 hover:bg-surface2/30 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className={t.trade_type === 'BUY' ? 'badge-buy' : 'badge-sell'}>{t.trade_type}</span>
                      <span className="font-bold text-fg tracking-tight">{t.script}</span>
                    </div>
                    <div className="text-muted text-[11px] font-medium mt-1">
                      {t.exchange} · {t.product_type}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={
                      t.status === 'EXECUTED' ? 'badge-ok' :
                      t.status === 'REJECTED' ? 'badge-bad' : 'badge-warn'
                    }>{t.status}</span>
                    <div className="text-xs text-muted mt-1">{new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                  </div>
                </div>
                
                <div className="flex justify-between items-end mt-1 pt-2 border-t border-border/30">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase text-muted font-bold tracking-wider">Qty @ Price</span>
                    <span className="price font-medium">
                      {t.quantity} <span className="text-muted text-xs mx-0.5">@</span> {Number(t.price).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] uppercase text-muted font-bold tracking-wider">Total Value</span>
                    <span className="price font-semibold">₹{Number(t.total_value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  </div>
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
                  <th className="text-right">Total</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((t, i) => (
                  <tr key={t.id}>
                    <td className="text-muted">{i + 1}</td>
                    <td>
                      <div className="font-semibold">{t.script}</div>
                      <div className="text-[10px] text-muted">{t.exchange} · {t.product_type}</div>
                    </td>
                    <td><span className={t.trade_type === 'BUY' ? 'badge-buy' : 'badge-sell'}>{t.trade_type}</span></td>
                    <td className="price text-right">{t.quantity}</td>
                    <td className="price text-right">{Number(t.price).toFixed(2)}</td>
                    <td className="price text-right">₹{Number(t.total_value || 0).toLocaleString('en-IN')}</td>
                    <td className="text-muted text-xs">{new Date(t.created_at).toLocaleTimeString()}</td>
                    <td>
                      <span className={
                        t.status === 'EXECUTED' ? 'badge-ok' :
                        t.status === 'REJECTED' ? 'badge-bad' : 'badge-warn'
                      }>{t.status}</span>
                    </td>
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
