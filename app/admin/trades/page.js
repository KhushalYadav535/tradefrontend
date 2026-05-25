'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';

export default function AllTradesPage() {
  const [students, setStudents] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/students').then((r) => {
      setStudents(r.data.students);
      if (r.data.students[0]) setSelectedId(r.data.students[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedId) { setLoading(false); return; }
    setLoading(true);
    api.get(`/admin/students/${selectedId}/trades`)
      .then((r) => setTrades(r.data.trades))
      .finally(() => setLoading(false));
  }, [selectedId]);

  const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div>
      <PageHeader
        title="All Trades"
        subtitle="Activity across every student account"
        right={
          <select
            className="select w-64"
            value={selectedId || ''}
            onChange={(e) => setSelectedId(Number(e.target.value))}
            disabled={!students.length}
          >
            {students.length === 0
              ? <option>No students</option>
              : students.map((s) => (
                  <option key={s.id} value={s.id}>{s.username} · {s.full_name || '—'}</option>
                ))}
          </select>
        }
      />

      {loading ? (
        <div className="text-muted text-sm">Loading…</div>
      ) : trades.length === 0 ? (
        <EmptyState title="No trades for this student" subtitle="They haven't placed any orders yet" />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Script</th>
                <th>Type</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Price</th>
                <th className="text-right">Total</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((t, i) => (
                <tr key={t.id}>
                  <td className="text-muted">{i + 1}</td>
                  <td>
                    <div className="font-semibold">{t.script}</div>
                    <div className="text-[10px] text-muted">{t.exchange}</div>
                  </td>
                  <td><span className={t.trade_type === 'BUY' ? 'badge-buy' : 'badge-sell'}>{t.trade_type}</span></td>
                  <td className="price text-right">{t.quantity}</td>
                  <td className="price text-right">{fmt(t.price)}</td>
                  <td className="price text-right">₹{fmt(t.total_value)}</td>
                  <td>
                    <span className={t.status === 'EXECUTED' ? 'badge-ok' : t.status === 'REJECTED' ? 'badge-bad' : 'badge-warn'}>
                      {t.status}
                    </span>
                    {t.reject_reason && <div className="text-[10px] text-red mt-0.5">{t.reject_reason}</div>}
                  </td>
                  <td className="text-muted text-xs">{new Date(t.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
