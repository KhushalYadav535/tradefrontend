'use client';

import { useTheme } from '@/context/ThemeContext';

function Sparkline({ data = [], up = true }) {
  if (data.length < 2) {
    return <div className="h-8 w-full" />;
  }
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 120, h = 32;
  const step = w / (data.length - 1);
  const points = data
    .map((v, i) => `${(i * step).toFixed(1)},${(h - ((v - min) / range) * h).toFixed(1)}`)
    .join(' ');
  const stroke = up ? 'rgb(var(--accent))' : 'rgb(var(--red))';
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline fill="none" stroke={stroke} strokeWidth="1.5" points={points} />
    </svg>
  );
}

export default function ScriptCard({ script, onTrade }) {
  const up = (script.change_pct || 0) >= 0;
  const banned = script.is_banned;

  return (
    <div className={`card p-4 transition-all hover:border-brand/40 ${banned ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="heading font-bold text-base tracking-wide">{script.name}</h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface2 text-muted">{script.expiry}</span>
            {banned && <span className="badge-bad">Banned</span>}
          </div>
          <div className="text-xs text-muted mt-0.5">
            {script.exchange} · Lot {script.lot_size}
          </div>
        </div>
        <div className="text-right">
          <div className="price text-lg font-semibold">{Number(script.current_price).toFixed(2)}</div>
          <div className={`text-xs price ${up ? 'text-accent' : 'text-red'}`}>
            {up ? '▲' : '▼'} {Math.abs(script.change_pct || 0).toFixed(2)}%
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] text-muted uppercase">
          Prev <span className="price text-fg/70 ml-1">{Number(script.prev_close).toFixed(2)}</span>
        </div>
        <Sparkline data={script.history || []} up={up} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => onTrade(script, 'BUY')} disabled={banned} className="btn-buy py-1.5 text-xs">
          BUY
        </button>
        <button onClick={() => onTrade(script, 'SELL')} disabled={banned} className="btn-sell py-1.5 text-xs">
          SELL
        </button>
      </div>
    </div>
  );
}
