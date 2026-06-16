'use client';

import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/axios';
import PageHeader from '@/components/PageHeader';
import useVedpragyaStream from '@/hooks/useVedpragyaStream';

export default function MarketDataPage() {
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Initial load + periodic REST refresh (for script metadata, not price)
  const fetchScripts = () => {
    api.get('/scripts')
      .then(r => {
        setScripts(r.data.scripts || []);
        setLastUpdate(new Date());
      })
      .catch(e => console.error('Failed to fetch scripts:', e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchScripts();
    // Refresh metadata every 30s — VP stream handles live price updates
    const interval = setInterval(fetchScripts, 30000);
    return () => clearInterval(interval);
  }, []);

  // Build symbol list for VP stream
  const symbols = useMemo(() => scripts.map(s => s.name), [scripts]);

  // ── Live Vedpragya WebSocket stream ──────────────────────────────────────
  const { ticks: vpTicks, status: vpStatus } = useVedpragyaStream(symbols);

  // Merge live VP ticks into scripts
  const enriched = useMemo(() =>
    scripts.map(s => {
      const tick = vpTicks[s.name];
      if (!tick) return s; // no tick yet — use REST data (VP search snapshot)

      const ltp    = tick.ltp ?? s.ltp ?? s.current_price;
      const prev   = s.prev_close || ltp;
      const diff   = ltp - prev;
      const pct    = prev ? (diff / prev) * 100 : 0;
      const spread = Math.max(0.05, ltp * 0.0005);
      return {
        ...s,
        ltp,
        current_price: ltp,
        bid: tick.bid ?? Number((ltp - spread).toFixed(4)),
        ask: tick.ask ?? Number((ltp + spread).toFixed(4)),
        net_change : Number(diff.toFixed(2)),
        change_pct : Number(pct.toFixed(2)),
        open : tick.ohlc?.o ?? s.open,
        high : tick.ohlc?.h ?? s.high,
        low  : tick.ohlc?.l ?? s.low,
        close: tick.ohlc?.c ?? prev,
        source: 'vedpragya', // live tick
      };
    }),
  [scripts, vpTicks]);

  const fmt = (n) =>
    n != null
      ? Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : '—';

  if (loading) return <div className="text-muted text-sm">Loading…</div>;

  return (
    <div>
      <div className="flex flex-wrap justify-between items-end gap-3 mb-6">
        <PageHeader
          title="Market Data Stream"
          subtitle={
            vpStatus === 'live'
              ? '🟢 Live · Vedpragya real-time WebSocket'
              : vpStatus === 'connecting'
              ? '🟡 Connecting to Vedpragya…'
              : '⚪ REST snapshot · refreshes every 30s'
          }
        />
        <div className="flex items-center gap-3">
          {/* VP stream badge */}
          <div className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
            vpStatus === 'live'
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : vpStatus === 'connecting'
              ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
              : 'bg-surface2 border-border text-muted'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              vpStatus === 'live' ? 'bg-green-400 animate-pulse' :
              vpStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' :
              'bg-muted'
            }`} />
            VP {vpStatus === 'live' ? 'LIVE' : vpStatus === 'connecting' ? 'CONNECTING' : 'OFFLINE'}
          </div>
          <div className="text-[10px] text-muted flex items-center gap-2 bg-surface2 px-3 py-1.5 rounded-full border border-border">
            <div className="w-2 h-2 rounded-full bg-green animate-pulse" />
            Metadata: {lastUpdate?.toLocaleTimeString() || 'Waiting…'}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface2/50 text-[10px] uppercase tracking-wider text-muted">
                <th className="p-3 font-semibold">Script</th>
                <th className="p-3 font-semibold">Exchange</th>
                <th className="p-3 font-semibold text-right">Bid</th>
                <th className="p-3 font-semibold text-right">Ask</th>
                <th className="p-3 font-semibold text-right">LTP (₹)</th>
                <th className="p-3 font-semibold text-right">Change %</th>
                <th className="p-3 font-semibold text-right">High</th>
                <th className="p-3 font-semibold text-right">Low</th>
                <th className="p-3 font-semibold text-right">Prev Close</th>
                <th className="p-3 font-semibold text-center">Source</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {enriched.map(s => {
                const ltp  = Number((s.ltp ?? s.current_price) || 0);
                const prev = Number(s.prev_close || ltp);
                const diff = ltp - prev;
                const pct  = (s.change_pct != null) ? s.change_pct : (prev ? (diff / prev) * 100 : 0);
                const isUp = diff >= 0;
                const src  = s.source || 'sim';

                return (
                  <tr key={s.id} className="border-b border-border/50 hover:bg-surface2/30 transition-colors">
                    <td className="p-3 font-bold">
                      <div className="flex items-center gap-1.5">
                        {s.name}
                        {s.expiry && (
                          <span className="text-[8px] text-muted font-normal">{s.expiry}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-muted text-[10px] uppercase font-semibold">{s.exchange}</td>

                    {/* Bid */}
                    <td className="p-3 text-right text-muted price text-xs">
                      {s.bid ? fmt(s.bid) : '—'}
                    </td>

                    {/* Ask */}
                    <td className="p-3 text-right text-muted price text-xs">
                      {s.ask ? fmt(s.ask) : '—'}
                    </td>

                    {/* LTP */}
                    <td className={`p-3 text-right font-bold price ${isUp ? 'text-accent' : 'text-red'}`}>
                      {fmt(ltp)}
                    </td>

                    {/* Change % */}
                    <td className="p-3 text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isUp ? 'bg-green/10 text-accent' : 'bg-red/10 text-red'
                      }`}>
                        {isUp ? '+' : ''}{Number(pct).toFixed(2)}%
                      </span>
                    </td>

                    {/* High / Low */}
                    <td className="p-3 text-right price text-accent text-xs">{s.high ? fmt(s.high) : '—'}</td>
                    <td className="p-3 text-right price text-red text-xs">{s.low ? fmt(s.low) : '—'}</td>

                    {/* Prev Close */}
                    <td className="p-3 text-right text-muted price text-xs">{fmt(prev)}</td>

                    {/* Source badge */}
                    <td className="p-3 text-center">
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        src === 'vedpragya' ? 'bg-green-500/15 text-green-400' :
                        src === 'nse'       ? 'bg-orange-500/15 text-orange-400' :
                        src === 'yahoo'     ? 'bg-blue-500/15 text-blue-400' :
                        'bg-red/10 text-red'  // SIM
                      }`}>
                        {src === 'vedpragya' ? 'VP LIVE' : src === 'sim' ? 'SIM' : src.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {enriched.length === 0 && (
            <div className="p-8 text-center text-muted text-sm">No active scripts found</div>
          )}
        </div>
      </div>
    </div>
  );
}
