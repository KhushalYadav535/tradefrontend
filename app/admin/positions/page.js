'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import PageHeader from '@/components/PageHeader';

export default function GlobalPositionsPage() {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPositions = () => {
    api.get('/admin/positions')
      .then(r => setPositions(r.data.positions || []))
      .catch(e => console.error('Failed to fetch positions:', e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPositions();
    const interval = setInterval(fetchPositions, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="text-muted text-sm">Loading…</div>;

  return (
    <div>
      <PageHeader title="Global Active Positions" subtitle="Real-time exposure across all users in the system" />
      
      <div className="card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-surface2/50 text-[10px] uppercase tracking-wider text-muted">
              <th className="p-3 font-semibold">User</th>
              <th className="p-3 font-semibold">Script</th>
              <th className="p-3 font-semibold text-right">Net Qty</th>
              <th className="p-3 font-semibold text-right">Avg Price</th>
              <th className="p-3 font-semibold text-right">LTP</th>
              <th className="p-3 font-semibold text-right">M2M</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {positions.map(p => {
              const netQty = p.buy_qty - p.sell_qty;
              if (netQty === 0) return null; // Only show strictly open positions
              
              const isLong = netQty > 0;
              const avgPrice = isLong ? p.avg_buy_price : p.avg_sell_price;
              const currentPrice = p.current_price || avgPrice; // Fallback
              const m2m = isLong 
                ? (currentPrice - avgPrice) * netQty 
                : (avgPrice - currentPrice) * Math.abs(netQty);

              return (
                <tr key={p.id} className="border-b border-border/50 hover:bg-surface2/30 transition-colors">
                  <td className="p-3 font-medium">{p.username}</td>
                  <td className="p-3">
                    <div className="font-bold">{p.script}</div>
                    <div className="text-[10px] text-muted">{p.exchange}</div>
                  </td>
                  <td className={`p-3 text-right font-bold ${isLong ? 'text-accent' : 'text-red'}`}>
                    {netQty}
                  </td>
                  <td className="p-3 text-right price">₹{Number(avgPrice).toFixed(2)}</td>
                  <td className="p-3 text-right price text-muted">₹{Number(currentPrice).toFixed(2)}</td>
                  <td className={`p-3 text-right font-bold price ${m2m >= 0 ? 'text-green' : 'text-red'}`}>
                    {m2m >= 0 ? '+' : ''}₹{m2m.toFixed(2)}
                  </td>
                </tr>
              );
            })}
            {positions.filter(p => (p.buy_qty - p.sell_qty) !== 0).length === 0 && (
              <tr>
                <td colSpan="6" className="p-6 text-center text-muted">No active positions currently open.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
