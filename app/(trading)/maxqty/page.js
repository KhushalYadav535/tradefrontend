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
        <div className="table-wrap">
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
      )}
    </div>
  );
}
