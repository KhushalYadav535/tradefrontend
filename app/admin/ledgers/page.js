'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import PageHeader from '@/components/PageHeader';

export default function SystemLedgerPage() {
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/ledger')
      .then(r => setLedger(r.data.ledger || []))
      .catch(e => console.error('Failed to fetch ledger:', e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-muted text-sm">Loading…</div>;

  return (
    <div>
      <PageHeader title="System Ledger" subtitle="Chronological record of all platform financial movements" />
      
      <div className="card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-surface2/50 text-[10px] uppercase tracking-wider text-muted">
              <th className="p-3 font-semibold">Date & Time</th>
              <th className="p-3 font-semibold">User</th>
              <th className="p-3 font-semibold">Description</th>
              <th className="p-3 font-semibold text-right">Debit (Dr)</th>
              <th className="p-3 font-semibold text-right">Credit (Cr)</th>
              <th className="p-3 font-semibold text-right">Balance</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {ledger.map(l => (
              <tr key={l.id} className="border-b border-border/50 hover:bg-surface2/30 transition-colors">
                <td className="p-3 text-muted whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</td>
                <td className="p-3 font-medium">{l.username}</td>
                <td className="p-3 text-muted max-w-xs truncate" title={l.description}>{l.description}</td>
                <td className="p-3 text-right text-red price">
                  {Number(l.debit) > 0 ? `₹${Number(l.debit).toLocaleString('en-IN')}` : '-'}
                </td>
                <td className="p-3 text-right text-green price">
                  {Number(l.credit) > 0 ? `₹${Number(l.credit).toLocaleString('en-IN')}` : '-'}
                </td>
                <td className="p-3 text-right font-bold price">
                  ₹{Number(l.balance).toLocaleString('en-IN')}
                </td>
              </tr>
            ))}
            {ledger.length === 0 && (
              <tr>
                <td colSpan="6" className="p-6 text-center text-muted">No ledger entries found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
