'use client';

export default function Disclaimer() {
  return (
    <div className="bg-surface border-b border-border py-1.5 px-4 overflow-hidden">
      <div className="ticker-track flex items-center gap-12 whitespace-nowrap text-[13px]">
        {Array.from({ length: 2 }).map((_, k) => (
          <span key={k} className="flex items-center gap-12">
            <span>
              <span className="text-fg font-bold">No real money involved.</span>
              <span className="text-muted ml-2">This is a Virtual Trading Application which has all the features to trade like an actual exchange terminal.</span>
            </span>
            <span className="text-muted">For demo and educational purposes only.</span>
          </span>
        ))}
      </div>
    </div>
  );
}
