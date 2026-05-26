'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import PageHeader from '@/components/PageHeader';

export default function MarketDataPage() {
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchMarketData = () => {
    api.get('/scripts')
      .then(r => {
        setScripts(r.data.scripts || []);
        setLastUpdate(new Date());
      })
      .catch(e => console.error('Failed to fetch market data:', e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 2000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="text-muted text-sm">Loading…</div>;

  return (
    <div>
      <div className="flex justify-between items-end mb-6">
        <PageHeader title="Market Data Stream" subtitle="Live feed of script prices and market status" />
        <div className="text-[10px] text-muted flex items-center gap-2 bg-surface2 px-3 py-1.5 rounded-full border border-border">
          <div className="w-2 h-2 rounded-full bg-green animate-pulse" />
          Last update: {lastUpdate?.toLocaleTimeString() || 'Waiting...'}
        </div>
      </div>
      
      <div className="card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-surface2/50 text-[10px] uppercase tracking-wider text-muted">
              <th className="p-3 font-semibold">Script</th>
              <th className="p-3 font-semibold">Exchange</th>
              <th className="p-3 font-semibold text-right">LTP (₹)</th>
              <th className="p-3 font-semibold text-right">Prev Close (₹)</th>
              <th className="p-3 font-semibold text-right">Change (%)</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {scripts.map(s => {
              const ltp = Number(s.current_price || 0);
              const prev = Number(s.prev_close || 1); // fallback to 1 to avoid /0
              const diff = ltp - prev;
              const pct = (diff / prev) * 100;
              const isUp = diff >= 0;
              
              return (
                <tr key={s.id} className="border-b border-border/50 hover:bg-surface2/30 transition-colors">
                  <td className="p-3 font-bold">{s.name}</td>
                  <td className="p-3 text-muted text-[10px] uppercase font-semibold">{s.exchange}</td>
                  <td className={`p-3 text-right font-bold price ${isUp ? 'text-green' : 'text-red'}`}>
                    {ltp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-right text-muted price">
                    {prev.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isUp ? 'bg-green/10 text-green' : 'bg-red/10 text-red'
                    }`}>
                      {isUp ? '+' : ''}{pct.toFixed(2)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
