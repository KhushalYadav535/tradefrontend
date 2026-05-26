'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import PageHeader from '@/components/PageHeader';

export default function LiveOrdersPage() {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = () => {
    api.get('/admin/all-trades')
      .then(r => setTrades(r.data.trades || []))
      .catch(e => console.error('Failed to fetch orders:', e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="text-muted text-sm">Loading…</div>;

  return (
    <div>
      <PageHeader title="Live Order Monitoring" subtitle="Real-time view of all user trades across the platform" />
      
      <div className="card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-surface2/50 text-[10px] uppercase tracking-wider text-muted">
              <th className="p-3 font-semibold">Time</th>
              <th className="p-3 font-semibold">User</th>
              <th className="p-3 font-semibold">Script</th>
              <th className="p-3 font-semibold text-right">Type</th>
              <th className="p-3 font-semibold text-right">Qty</th>
              <th className="p-3 font-semibold text-right">Price</th>
              <th className="p-3 font-semibold text-center">Status</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {trades.map(t => (
              <tr key={t.id} className="border-b border-border/50 hover:bg-surface2/30 transition-colors">
                <td className="p-3 text-muted">{new Date(t.created_at).toLocaleTimeString()}</td>
                <td className="p-3 font-medium">{t.username}</td>
                <td className="p-3">
                  <div className="font-semibold">{t.script}</div>
                  <div className="text-[10px] text-muted">{t.exchange}</div>
                </td>
                <td className={`p-3 text-right font-bold ${t.trade_type === 'BUY' ? 'text-accent' : 'text-red'}`}>
                  {t.trade_type}
                </td>
                <td className="p-3 text-right">{t.quantity}</td>
                <td className="p-3 text-right price">₹{Number(t.price).toFixed(2)}</td>
                <td className="p-3 text-center">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    t.status === 'EXECUTED' ? 'bg-green/10 text-green' :
                    t.status === 'REJECTED' ? 'bg-red/10 text-red' : 'bg-orange/10 text-orange'
                  }`}>
                    {t.status}
                  </span>
                </td>
              </tr>
            ))}
            {trades.length === 0 && (
              <tr>
                <td colSpan="7" className="p-6 text-center text-muted">No recent orders found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
