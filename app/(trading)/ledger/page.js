'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import EmptyState from '@/components/EmptyState';

export default function LedgerPage() {
  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState({ opening_balance: 0, current_balance: 0, net_pnl: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/ledger')
      .then((r) => {
        setEntries(r.data.entries);
        setStats(r.data.stats);
      })
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div>
      <PageHeader title="Ledger" subtitle="Account-level debits, credits, and running balance" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        <StatCard label="Opening Balance" value={`₹${fmt(stats.opening_balance)}`} />
        <StatCard label="Current Balance" value={`₹${fmt(stats.current_balance)}`} accent="green" />
        <StatCard
          label="Net P&L"
          value={`${stats.net_pnl >= 0 ? '+' : ''}₹${fmt(stats.net_pnl)}`}
          accent={stats.net_pnl >= 0 ? 'green' : 'red'}
        />
      </div>

      {loading ? (
        <div className="text-muted text-sm">Loading…</div>
      ) : entries.length === 0 ? (
        <EmptyState title="No ledger entries" />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Description</th>
                <th className="text-right">Dr</th>
                <th className="text-right">Cr</th>
                <th className="text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={e.id}>
                  <td className="text-muted">{i + 1}</td>
                  <td className="text-muted text-xs">{new Date(e.created_at).toLocaleString()}</td>
                  <td>{e.description}</td>
                  <td className="price text-right text-red">{Number(e.debit) > 0 ? `₹${fmt(e.debit)}` : '—'}</td>
                  <td className="price text-right text-accent">{Number(e.credit) > 0 ? `₹${fmt(e.credit)}` : '—'}</td>
                  <td className="price text-right font-semibold">₹{fmt(e.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
