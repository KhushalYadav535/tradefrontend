'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';

export default function OpsRevenuePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/ops-revenue')
      .then(r => setData(r.data))
      .catch(e => console.error('Failed to fetch ops data:', e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-muted text-sm">Loading…</div>;
  if (!data) return <div className="text-red text-sm">Failed to load data</div>;

  const { stats, dailyTrades } = data;
  const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  const netPnl = Number(stats.net_pnl);

  return (
    <div>
      <PageHeader title="Ops & Revenue" subtitle="Financial and operational overview of the platform" />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card p-5 border-l-4 border-l-accent">
          <div className="text-xs uppercase tracking-widest text-muted mb-1 font-semibold">Net Platform P&L</div>
          <div className={`heading text-3xl font-bold price ${netPnl >= 0 ? 'text-green' : 'text-red'}`}>
            {netPnl >= 0 ? '+' : ''}₹{fmt(netPnl)}
          </div>
          <div className="text-[10px] text-muted mt-2">Cumulative P&L across all user ledgers</div>
        </div>
        
        <div className="card p-5 border-l-4 border-l-brand">
          <div className="text-xs uppercase tracking-widest text-muted mb-1 font-semibold">Total Trades</div>
          <div className="heading text-3xl font-bold">{stats.total_trades}</div>
          <div className="text-[10px] text-muted mt-2">Lifetime executed trades</div>
        </div>

        <div className="card p-5 border-l-4 border-l-orange">
          <div className="text-xs uppercase tracking-widest text-muted mb-1 font-semibold">Active Traders</div>
          <div className="heading text-3xl font-bold">{stats.active_users}</div>
          <div className="text-[10px] text-muted mt-2">Users with currently open positions</div>
        </div>
      </div>

      <div className="card p-5 max-w-3xl">
        <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted">Trading Activity (Last 7 Days)</h3>
        <div className="h-64 flex items-end gap-2">
          {dailyTrades.length > 0 ? dailyTrades.slice().reverse().map((day, i) => {
            const max = Math.max(...dailyTrades.map(d => Number(d.trade_count))) || 1;
            const height = Math.max((Number(day.trade_count) / max) * 100, 5);
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full bg-brand/20 rounded-t relative hover:bg-brand/40 transition-colors" style={{ height: `${height}%` }}>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface border border-border px-2 py-1 rounded text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {day.trade_count} trades
                  </div>
                </div>
                <div className="text-[10px] text-muted -rotate-45 origin-top-left mt-2 whitespace-nowrap w-4 h-8">
                  {new Date(day.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                </div>
              </div>
            );
          }) : (
            <div className="w-full h-full flex items-center justify-center text-muted text-sm">No recent trading activity</div>
          )}
        </div>
      </div>
    </div>
  );
}
