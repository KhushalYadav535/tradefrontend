'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import EmptyState from '@/components/EmptyState';

export default function PortfolioPage() {
  const [positions, setPositions] = useState([]);
  const [totals, setTotals] = useState({ pnl: 0, buy_qty: 0, sell_qty: 0, open: 0 });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await api.get('/positions');
      setPositions(data.positions);
      setTotals(data.totals);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 2500);
    return () => clearInterval(t);
  }, []);

  const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div>
      <PageHeader title="Portfolio / Position" subtitle="Live P&L · refreshes every 2.5s" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <StatCard label="Open Positions" value={totals.open} />
        <StatCard label="Total P&L" value={`₹${fmt(totals.pnl)}`} accent={totals.pnl >= 0 ? 'green' : 'red'} />
        <StatCard label="Buy Qty" value={totals.buy_qty} accent="green" />
        <StatCard label="Sell Qty" value={totals.sell_qty} accent="red" />
      </div>

      {loading ? (
        <div className="text-muted text-sm">Loading…</div>
      ) : positions.length === 0 ? (
        <EmptyState title="No open positions" subtitle="Your positions will appear here after you trade" />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Script</th>
                <th>Exchange</th>
                <th className="text-right">Buy Qty</th>
                <th className="text-right">Sell Qty</th>
                <th className="text-right">Net Qty</th>
                <th className="text-right">Avg Price</th>
                <th className="text-right">LTP</th>
                <th className="text-right">P&L</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => (
                <tr key={p.id}>
                  <td className="font-semibold">{p.script}</td>
                  <td className="text-muted text-xs">{p.exchange}</td>
                  <td className="price text-right text-accent">{p.buy_qty}</td>
                  <td className="price text-right text-red">{p.sell_qty}</td>
                  <td className={`price text-right font-semibold ${p.net_qty > 0 ? 'text-accent' : p.net_qty < 0 ? 'text-red' : ''}`}>
                    {p.net_qty}
                  </td>
                  <td className="price text-right">{Number(p.avg_price || 0).toFixed(2)}</td>
                  <td className="price text-right">{Number(p.ltp).toFixed(2)}</td>
                  <td className={`price text-right font-semibold ${p.pnl >= 0 ? 'text-accent' : 'text-red'}`}>
                    {p.pnl >= 0 ? '+' : ''}₹{fmt(p.pnl)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
