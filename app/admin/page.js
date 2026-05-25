'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats')
      .then((r) => setStats(r.data))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (loading) return <div className="text-muted text-sm">Loading…</div>;
  if (!stats) return <div className="text-red text-sm">Failed to load stats</div>;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Platform overview at a glance" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <StatCard label="Total Students" value={stats.students.total} />
        <StatCard label="Active Students" value={stats.students.active} accent="green" />
        <StatCard label="Trades Today" value={stats.trades_today} accent="green" />
        <StatCard label="Total Capital" value={`₹${fmt(stats.students.total_balance)}`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="text-[10px] uppercase tracking-wider text-muted mb-2">Quick Actions</div>
          <div className="space-y-2">
            <a href="/admin/students" className="block p-3 rounded bg-surface2/50 hover:bg-surface2 border border-border">
              <div className="font-semibold text-sm">Manage Students</div>
              <div className="text-xs text-muted">Create login credentials, reset passwords, adjust balances</div>
            </a>
            <a href="/admin/trades" className="block p-3 rounded bg-surface2/50 hover:bg-surface2 border border-border">
              <div className="font-semibold text-sm">View All Trades</div>
              <div className="text-xs text-muted">Activity across every student account</div>
            </a>
            <a href="/watchlist" className="block p-3 rounded bg-surface2/50 hover:bg-surface2 border border-border">
              <div className="font-semibold text-sm">Open Trading View</div>
              <div className="text-xs text-muted">See the platform as students see it</div>
            </a>
          </div>
        </div>

        <div className="card p-5">
          <div className="text-[10px] uppercase tracking-wider text-muted mb-2">Scripts</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-surface2/40 rounded">
              <div className="text-[10px] text-muted uppercase">Total</div>
              <div className="heading text-2xl price">{stats.scripts.total_scripts}</div>
            </div>
            <div className="p-3 bg-surface2/40 rounded">
              <div className="text-[10px] text-muted uppercase">Banned</div>
              <div className="heading text-2xl price text-red">{stats.scripts.banned}</div>
            </div>
          </div>
          <div className="text-[11px] text-muted mt-3">
            Net cash flow across all ledgers: <span className={`price ${stats.net_pnl >= 0 ? 'text-accent' : 'text-red'}`}>
              {stats.net_pnl >= 0 ? '+' : ''}₹{fmt(stats.net_pnl)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
