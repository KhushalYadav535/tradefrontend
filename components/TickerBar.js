'use client';

import usePrices from '@/hooks/usePrices';

export default function TickerBar() {
  const { scripts } = usePrices(2000);
  if (!scripts.length) return <div className="h-8 bg-bg border-b border-border" />;

  const repeated = [...scripts, ...scripts];

  return (
    <div className="h-8 bg-bg border-b border-border overflow-hidden relative">
      <div className="ticker-track flex items-center gap-6 h-full px-4 whitespace-nowrap">
        {repeated.map((s, i) => {
          const up = (s.change_pct || 0) >= 0;
          return (
            <span key={`${s.id}-${i}`} className="text-xs flex items-center gap-2">
              <span className="text-muted">{s.exchange}</span>
              <span className="font-semibold">{s.name}</span>
              <span className="price">{Number(s.ltp ?? s.current_price).toFixed(2)}</span>
              <span className={`price ${up ? 'text-accent' : 'text-red'}`}>
                {up ? '▲' : '▼'} {Math.abs(s.change_pct || 0).toFixed(2)}%
              </span>
              <span className="text-border">|</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
