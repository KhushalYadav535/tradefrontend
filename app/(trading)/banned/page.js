'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';

export default function BannedPage() {
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/scripts/banned')
      .then((r) => setScripts(r.data.scripts))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Banned / Blocked Scripts" subtitle="Scripts currently restricted from trading" />

      {loading ? (
        <div className="text-muted text-sm">Loading…</div>
      ) : scripts.length === 0 ? (
        <EmptyState title="No banned scripts" subtitle="All scripts are open for trading" />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Script</th>
                <th>Exchange</th>
                <th>Reason</th>
                <th>Banned On</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {scripts.map((s, i) => (
                <tr key={s.id}>
                  <td className="text-muted">{i + 1}</td>
                  <td className="font-semibold">{s.name}</td>
                  <td className="text-muted text-xs">{s.exchange}</td>
                  <td>{s.ban_reason}</td>
                  <td className="text-muted text-xs">{new Date(s.created_at).toLocaleDateString()}</td>
                  <td><span className="badge-bad">Blocked</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
