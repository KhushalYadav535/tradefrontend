'use client';

import usePrices from '@/hooks/usePrices';

export default function IndexTickers() {
  const { scripts } = usePrices(2000);
  // Pick NIFTY and BANKNIFTY as the headline indices
  const pick = (name) => scripts.find((s) => s.name === name);
  const nifty = pick('NIFTY');
  const bank = pick('BANKNIFTY');
  const items = [
    { label: 'SNX', s: bank },
    { label: 'NFT', s: nifty },
  ].filter((x) => x.s);

  if (!items.length) return <div className="flex-1" />;

  return (
    <div className="flex items-center gap-6 px-4">
      {items.map(({ label, s }) => {
        const up = (s.net_change ?? 0) >= 0;
        return (
          <div key={label} className="flex items-center gap-2 text-sm">
            <span className="text-muted font-semibold">{label} :</span>
            <span className="price">{Number(s.ltp).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className={`price text-xs ${up ? 'text-accent' : 'text-red'}`}>
              {up ? '▲' : '▼'} {Math.abs(s.net_change || 0).toFixed(2)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
