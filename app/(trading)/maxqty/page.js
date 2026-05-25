'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';

export default function MaxQtyPage() {
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/scripts/maxqty')
      .then((r) => setScripts(r.data.scripts))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Max Quantity Details" subtitle="Maximum allowed lots, quantity and margin per lot" />

      {loading ? (
        <div className="text-muted text-sm">Loading…</div>
      ) : scripts.length === 0 ? (
        <EmptyState title="No scripts available" />
      ) : (
        <div className="card overflow-hidden">
          {/* Mobile Cards */}
          <div className="flex flex-col md:hidden divide-y divide-border/50">
            {scripts.map((s) => (
              <div key={s.id} className="p-4 flex flex-col gap-3 hover:bg-surface2/30 transition-colors">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-fg">{s.name}</span>
                    <span className="text-[10px] text-muted font-medium bg-surface2 px-1.5 py-0.5 rounded">{s.exchange}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="flex flex-col bg-bg/50 p-2 rounded border border-border/30">
                    <span className="text-[10px] uppercase text-muted font-bold tracking-wider mb-0.5">Lot Size / Max Lots</span>
                    <span className="price font-medium text-sm">{s.lot_size} <span className="text-muted font-normal text-xs mx-1">×</span> {s.max_lots}</span>
                  </div>
                  <div className="flex flex-col bg-bg/50 p-2 rounded border border-border/30 text-right">
                    <span className="text-[10px] uppercase text-muted font-bold tracking-wider mb-0.5">Max Qty</span>
                    <span className="price font-semibold text-accent text-sm">{Number(s.max_qty).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-border/30">
                  <span className="text-[10px] uppercase text-muted font-bold tracking-wider">Margin per Lot</span>
                  <span className="price font-bold text-warn text-sm">₹{Number(s.margin_per_lot).toLocaleString('en-IN')}</span>
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
                  <th className="text-right">Lot Size</th>
                  <th className="text-right">Max Lots</th>
                  <th className="text-right">Max Qty</th>
                  <th className="text-right">Margin / Lot</th>
                </tr>
              </thead>
              <tbody>
                {scripts.map((s) => (
                  <tr key={s.id}>
                    <td className="font-semibold">{s.name}</td>
                    <td className="text-muted text-xs">{s.exchange}</td>
                    <td className="price text-right">{s.lot_size}</td>
                    <td className="price text-right">{s.max_lots}</td>
                    <td className="price text-right text-accent">{Number(s.max_qty).toLocaleString('en-IN')}</td>
                    <td className="price text-right text-warn">₹{Number(s.margin_per_lot).toLocaleString('en-IN')}</td>
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
