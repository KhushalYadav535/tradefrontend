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
        <div className="card overflow-hidden">
          {/* Mobile Cards */}
          <div className="flex flex-col md:hidden divide-y divide-border/50">
            {entries.map((e, i) => (
              <div key={e.id} className="p-4 flex flex-col gap-2 hover:bg-surface2/30 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="font-semibold text-fg text-sm">{e.description}</span>
                    <span className="text-xs text-muted mt-0.5">{new Date(e.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-end mt-2 pt-2 border-t border-border/30">
                  <div className="flex gap-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase text-muted font-bold tracking-wider">Debit (Dr)</span>
                      <span className="price text-red font-medium">{Number(e.debit) > 0 ? `₹${fmt(e.debit)}` : '—'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase text-muted font-bold tracking-wider">Credit (Cr)</span>
                      <span className="price text-accent font-medium">{Number(e.credit) > 0 ? `₹${fmt(e.credit)}` : '—'}</span>
                    </div>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] uppercase text-muted font-bold tracking-wider">Balance</span>
                    <span className="price font-bold">₹{fmt(e.balance)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
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
        </div>
      )}
    </div>
  );
}
