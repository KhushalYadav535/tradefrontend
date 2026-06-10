'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/axios';
import PageHeader from '@/components/PageHeader';
import { useToast } from '@/components/Toast';

function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}

function formatINR(n) {
  return Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function dayLabel(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function WeeklyReportPage() {
  const toast = useToast();
  const [students, setStudents] = useState([]);
  const [selectedUser, setSelectedUser] = useState('all');
  const [weekStart, setWeekStart] = useState(getWeekStart());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedUsers, setExpandedUsers] = useState({});

  useEffect(() => {
    api.get('/admin/students')
      .then(r => setStudents(r.data.students || []))
      .catch(() => {});
  }, []);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setReport(null);
    try {
      const params = { week_start: weekStart };
      if (selectedUser !== 'all') params.user_id = selectedUser;
      const { data } = await api.get('/admin/reports/weekly', { params });
      setReport(data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  }, [weekStart, selectedUser]);

  const exportCSV = () => {
    if (!report || !report.users.length) return;
    const rows = [['Username', 'Full Name', 'Date', 'Total Trades', 'Buy', 'Sell', 'Buy Value (₹)', 'Sell Value (₹)', 'Net P&L (₹)']];
    for (const u of report.users) {
      for (const d of u.daily) {
        rows.push([
          u.username,
          u.full_name || '',
          d.date,
          d.total_trades,
          d.buy_trades,
          d.sell_trades,
          d.total_buy_value.toFixed(2),
          d.total_sell_value.toFixed(2),
          d.net_pnl.toFixed(2),
        ]);
      }
    }
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weekly_report_${weekStart}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleUser = (userId) => {
    setExpandedUsers(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const weekEnd = weekStart
    ? (() => { const d = new Date(weekStart); d.setDate(d.getDate() + 6); return d.toISOString().split('T')[0]; })()
    : '';

  return (
    <div>
      <PageHeader
        title="Weekly Trade Report"
        subtitle="Analyse trading activity for any week across all or individual users"
      />

      {/* Controls */}
      <div className="card p-4 mb-5 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] uppercase tracking-wider text-muted mb-1">User Scope</label>
          <select
            className="input w-full"
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
          >
            <option value="all">All Users</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.username} — {s.full_name || 'No Name'}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[180px]">
          <label className="block text-[10px] uppercase tracking-wider text-muted mb-1">Week Starting (Monday)</label>
          <input
            type="date"
            className="input w-full"
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchReport}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Generating…' : 'Generate Report'}
          </button>
          {report && report.users.length > 0 && (
            <button onClick={exportCSV} className="btn-ghost flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Report Results */}
      {loading && (
        <div className="card p-8 text-center text-muted text-sm">
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
            Generating report…
          </div>
        </div>
      )}

      {report && !loading && (
        <>
          {/* Summary Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {(() => {
              const totals = report.users.reduce((a, u) => ({
                trades: a.trades + u.total_trades,
                buy: a.buy + u.buy_trades,
                sell: a.sell + u.sell_trades,
                pnl: a.pnl + u.net_pnl,
                users: a.users + 1,
              }), { trades: 0, buy: 0, sell: 0, pnl: 0, users: 0 });

              return [
                { label: 'Active Users', value: totals.users, color: 'text-fg' },
                { label: 'Total Trades', value: totals.trades, color: 'text-fg' },
                { label: 'Buy / Sell', value: `${totals.buy} / ${totals.sell}`, color: 'text-fg' },
                { label: 'Net P&L', value: `₹${formatINR(totals.pnl)}`, color: totals.pnl >= 0 ? 'text-accent' : 'text-red' },
              ].map(s => (
                <div key={s.label} className="card p-4">
                  <div className="text-[10px] uppercase tracking-wider text-muted mb-1">{s.label}</div>
                  <div className={`text-xl font-bold price ${s.color}`}>{s.value}</div>
                </div>
              ));
            })()}
          </div>

          <div className="text-xs text-muted mb-3 px-1">
            Week: <strong>{weekStart}</strong> to <strong>{weekEnd}</strong> · {report.users.length} user(s) with activity
          </div>

          {report.users.length === 0 ? (
            <div className="card p-10 text-center text-muted text-sm">No trades recorded in this period.</div>
          ) : (
            <div className="space-y-3">
              {report.users.map(u => (
                <div key={u.user_id} className="card overflow-hidden">
                  {/* User Header */}
                  <button
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-surface2/50 transition-colors"
                    onClick={() => toggleUser(u.user_id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand/20 border border-brand/30 flex items-center justify-center text-sm font-bold text-brand-2">
                        {(u.full_name || u.username).charAt(0).toUpperCase()}
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-sm">{u.username}</div>
                        <div className="text-[10px] text-muted">{u.full_name || '—'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center hidden md:block">
                        <div className="text-[10px] uppercase text-muted">Trades</div>
                        <div className="font-semibold">{u.total_trades}</div>
                      </div>
                      <div className="text-center hidden md:block">
                        <div className="text-[10px] uppercase text-muted">Buy / Sell</div>
                        <div className="font-semibold">{u.buy_trades} / {u.sell_trades}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[10px] uppercase text-muted">Net P&L</div>
                        <div className={`font-bold price ${u.net_pnl >= 0 ? 'text-accent' : 'text-red'}`}>
                          {u.net_pnl >= 0 ? '+' : ''}₹{formatINR(u.net_pnl)}
                        </div>
                      </div>
                      <svg
                        width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        className={`text-muted transition-transform ${expandedUsers[u.user_id] ? 'rotate-180' : ''}`}
                      >
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </div>
                  </button>

                  {/* Daily Breakdown */}
                  {expandedUsers[u.user_id] && (
                    <div className="border-t border-border">
                      <table className="table w-full text-sm">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th className="text-right">Trades</th>
                            <th className="text-right">Buy</th>
                            <th className="text-right">Sell</th>
                            <th className="text-right">Buy Value</th>
                            <th className="text-right">Sell Value</th>
                            <th className="text-right">Net P&L</th>
                          </tr>
                        </thead>
                        <tbody>
                          {u.daily.map((d, i) => (
                            <tr key={i}>
                              <td className="font-medium">{dayLabel(d.date)}</td>
                              <td className="text-right">{d.total_trades}</td>
                              <td className="text-right text-accent">{d.buy_trades}</td>
                              <td className="text-right text-warn">{d.sell_trades}</td>
                              <td className="price text-right">₹{formatINR(d.total_buy_value)}</td>
                              <td className="price text-right">₹{formatINR(d.total_sell_value)}</td>
                              <td className={`price text-right font-semibold ${d.net_pnl >= 0 ? 'text-accent' : 'text-red'}`}>
                                {d.net_pnl >= 0 ? '+' : ''}₹{formatINR(d.net_pnl)}
                              </td>
                            </tr>
                          ))}
                          {/* Weekly subtotal row */}
                          <tr className="bg-surface2/60 font-semibold border-t border-border">
                            <td className="text-[10px] uppercase tracking-wider text-muted">Week Total</td>
                            <td className="text-right">{u.total_trades}</td>
                            <td className="text-right text-accent">{u.buy_trades}</td>
                            <td className="text-right text-warn">{u.sell_trades}</td>
                            <td className="price text-right">₹{formatINR(u.total_buy_value)}</td>
                            <td className="price text-right">₹{formatINR(u.total_sell_value)}</td>
                            <td className={`price text-right ${u.net_pnl >= 0 ? 'text-accent' : 'text-red'}`}>
                              {u.net_pnl >= 0 ? '+' : ''}₹{formatINR(u.net_pnl)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {!report && !loading && (
        <div className="card p-10 text-center text-muted text-sm">
          Select a scope and week above, then click <strong>Generate Report</strong>.
        </div>
      )}
    </div>
  );
}
