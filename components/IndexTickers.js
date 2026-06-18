'use client';

import useVedpragyaStream from '@/hooks/useVedpragyaStream';
import usePrices from '@/hooks/usePrices';

const INDEX_SYMBOLS = ['NIFTY', 'BANKNIFTY', 'RELIANCE'];

export default function IndexTickers() {
  // Primary: real-time Socket.IO ticks from Vedpragya
  const { ticks: vpTicks, status } = useVedpragyaStream(INDEX_SYMBOLS);

  // Fallback: REST polling for change% data when socket isn't live yet
  const { scripts } = usePrices(5000);
  const fallback = (name) => scripts.find((s) => s.name === name);

  const items = INDEX_SYMBOLS
    .map((sym) => {
      const tick = vpTicks[sym];
      const fb   = fallback(sym);

      const ltp    = tick?.ltp      ?? fb?.ltp       ?? null;
      const change = tick?.change   ?? fb?.net_change ?? null;
      const pct    = tick?.pchange  ?? fb?.change_pct ?? null;
      if (!ltp) return null;

      return {
        label    : sym === 'BANKNIFTY' ? 'BANK' : sym === 'RELIANCE' ? 'RELI' : sym,
        fullName : sym,
        ltp, change, pct,
        live     : !!tick,
      };
    })
    .filter(Boolean);

  if (!items.length) return <div className="flex-1" />;

  return (
    <div className="flex items-center gap-4 px-3 overflow-hidden min-w-0">
      {items.map(({ label, fullName, ltp, change, pct, live }) => {
        const up = (change ?? 0) >= 0;
        return (
          <div key={label} className="flex items-center gap-1.5 text-sm" title={fullName}>
            {/* Live dot — green pulse when Socket.IO tick, yellow for REST fallback */}
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${live ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`}
              title={live ? 'Live · Vedpragya Stream' : 'REST fallback'}
            />
            <span className="text-muted font-semibold text-[11px]">{label}</span>
            <span className="price font-bold">
              {Number(ltp).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            {change != null && (
              <span className={`price text-[11px] ${up ? 'text-accent' : 'text-red'}`}>
                {up ? '▲' : '▼'} {Math.abs(change).toFixed(2)}
                {pct != null && <span className="opacity-70 ml-0.5">({Math.abs(pct).toFixed(1)}%)</span>}
              </span>
            )}
          </div>
        );
      })}

      {/* Status badge */}
      <span className={`hidden xl:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border tracking-wider ${
        status === 'live'
          ? 'bg-green-500/10 text-green-400 border-green-500/20'
          : 'bg-surface2 text-muted border-border'
      }`}>
        <span className={`w-1 h-1 rounded-full ${status === 'live' ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
        {status === 'live' ? 'LIVE' : 'VDPGYA'}
      </span>
    </div>
  );
}
