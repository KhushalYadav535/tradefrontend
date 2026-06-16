'use client';

import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/axios';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import EmptyState from '@/components/EmptyState';
import useVedpragyaStream from '@/hooks/useVedpragyaStream';

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
    const t = setInterval(load, 5000); // reduced polling since VP stream covers LTP
    return () => clearInterval(t);
  }, []);

  // Build symbol list from open positions for VP stream
  const posSymbols = useMemo(() =>
    [...new Set(positions.map(p => p.script).filter(Boolean))],
  [positions]);

  // Live ticks from Vedpragya for all position symbols
  const { ticks: vpTicks, status: vpStatus } = useVedpragyaStream(posSymbols);

  // Merge live VP LTP into positions and recalculate P&L
  const enrichedPositions = useMemo(() =>
    positions.map(p => {
      const tick = vpTicks[p.script];
      const ltp  = tick?.ltp ?? Number(p.ltp);
      const pnl  = Number(p.net_qty) * (ltp - Number(p.avg_price));
      return { ...p, ltp, pnl: pnl || p.pnl, live: !!tick };
    }),
  [positions, vpTicks]);

  // Recalculate live totals from enriched positions
  const liveTotals = useMemo(() => {
    const open = enrichedPositions.filter(p => p.net_qty !== 0).length;
    const pnl  = enrichedPositions.reduce((s, p) => s + Number(p.pnl || 0), 0);
    return {
      open,
      pnl,
      buy_qty : totals.buy_qty,
      sell_qty: totals.sell_qty,
    };
  }, [enrichedPositions, totals]);

  const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div>
      <PageHeader
        title="Portfolio / Position"
        subtitle={
          vpStatus === 'live'
            ? '🟢 Live P&L · Vedpragya real-time'
            : 'Live P&L · refreshes every 5s'
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <StatCard label="Open Positions" value={liveTotals.open} />
        <StatCard label="Total P&L" value={`₹${fmt(liveTotals.pnl)}`} accent={liveTotals.pnl >= 0 ? 'green' : 'red'} />
        <StatCard label="Buy Qty" value={liveTotals.buy_qty} accent="green" />
        <StatCard label="Sell Qty" value={liveTotals.sell_qty} accent="red" />
      </div>

      {loading ? (
        <div className="text-muted text-sm">Loading…</div>
      ) : enrichedPositions.length === 0 ? (
        <EmptyState title="No open positions" subtitle="Your positions will appear here after you trade" />
      ) : (
        <div className="card overflow-hidden">
          {/* Mobile Cards */}
          <div className="flex flex-col md:hidden divide-y divide-border/50">
            {enrichedPositions.map((p) => (
              <div key={p.id} className="p-4 flex flex-col gap-2 hover:bg-surface2/30 transition-colors">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-fg tracking-tight">{p.script}</span>
                      {/* Live dot — shows if VP tick is active */}
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${p.live ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`}
                        title={p.live ? 'Live · Vedpragya' : 'REST fallback'}
                      />
                    </div>
                    <span className="text-muted text-[11px] font-medium px-1.5 py-0.5 rounded bg-surface2 w-max mt-1">{p.exchange}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`price font-bold text-lg leading-none ${p.pnl >= 0 ? 'text-accent' : 'text-red'}`}>
                      {p.pnl >= 0 ? '+' : ''}₹{fmt(p.pnl)}
                    </div>
                    <div className="text-xs text-muted mt-1">P&L</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-2 bg-bg/50 rounded p-2 border border-border/50">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase text-muted font-bold tracking-wider mb-0.5">Net Qty</span>
                    <span className={`price font-semibold ${p.net_qty > 0 ? 'text-accent' : p.net_qty < 0 ? 'text-red' : ''}`}>{p.net_qty}</span>
                  </div>
                  <div className="flex flex-col items-center border-l border-r border-border/50">
                    <span className="text-[10px] uppercase text-muted font-bold tracking-wider mb-0.5">Avg Price</span>
                    <span className="price">{Number(p.avg_price || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase text-muted font-bold tracking-wider mb-0.5">LTP</span>
                    <span className="price font-semibold text-accent">{Number(p.ltp).toFixed(2)}</span>
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
                {enrichedPositions.map((p) => (
                  <tr key={p.id}>
                    <td className="font-semibold">
                      <div className="flex items-center gap-1.5">
                        {p.script}
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${p.live ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`}
                          title={p.live ? 'Live · Vedpragya' : 'REST fallback'}
                        />
                      </div>
                    </td>
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
        </div>
      )}
    </div>
  );
}
