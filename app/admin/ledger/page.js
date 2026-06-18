'use client';
import { useState, useCallback, useEffect } from 'react';
import api from '@/lib/axios';
import { LogPage, LogTable, DateRangeRow, Sel, S, fmtDT, fmt2 } from '@/components/LogViewerShared';
const today = () => new Date().toISOString().split('T')[0];

export default function LedgerPage() {
  const [students,  setStudents]  = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate,   setEndDate]   = useState(today());
  const [userId,    setUserId]    = useState('');
  const [entries,   setEntries]   = useState([]);
  const [totals,    setTotals]    = useState({ debit: 0, credit: 0 });
  const [loading,   setLoading]   = useState(false);

  useEffect(() => {
    api.get('/admin/students').then(r => setStudents(r.data.students || [])).catch(() => {});
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/ledger');
      setEntries(data.entries || []);
      setTotals(data.totals || { debit: 0, credit: 0 });
    } catch {} finally { setLoading(false); }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (userId)    params.user_id    = userId;
      if (startDate) params.start_date = startDate;
      if (endDate)   params.end_date   = endDate;
      const { data } = await api.get('/admin/ledger', { params });
      setEntries(data.entries || []);
      setTotals(data.totals || { debit: 0, credit: 0 });
    } catch {} finally { setLoading(false); }
  }, [userId, startDate, endDate]);

  const clear = () => { setUserId(''); setStartDate(''); setEndDate(today()); loadAll(); };

  const COLS = [
    { key: 'created_at',  label: 'Date/Time', render: v => fmtDT(v) },
    { key: 'username',    label: 'User' },
    { key: 'full_name',   label: 'Name' },
    { key: 'description', label: 'Description', style: { color: '#bbb', maxWidth: 280 } },
    { key: 'script',      label: 'Script', style: { color: '#17a2b8' }, render: v => v || '—' },
    { key: 'trade_type',  label: 'Side', render: v => v ? <span style={{ color: v==='BUY'?'#28a745':'#dc3545', fontWeight:700 }}>{v}</span> : '—' },
    { key: 'quantity',    label: 'Qty', render: v => v || '—' },
    { key: 'debit',       label: 'Debit (₹)', render: v => Number(v) > 0 ? <span style={{ color: '#dc3545', fontWeight: 600 }}>₹{fmt2(v)}</span> : '—' },
    { key: 'credit',      label: 'Credit (₹)', render: v => Number(v) > 0 ? <span style={{ color: '#28a745', fontWeight: 600 }}>₹{fmt2(v)}</span> : '—' },
    { key: 'balance',     label: 'Balance (₹)', render: v => <span style={{ fontWeight: 700 }}>₹{fmt2(v)}</span> },
  ];

  return (
    <LogPage title="Ledger" subtitle="All user ledger entries — trades, cash credits/debits" color="#17a2b8" badge={entries.length}>
      {/* Summary */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
        {[
          { label: 'Total Credit', val: totals.credit, color: '#28a745' },
          { label: 'Total Debit',  val: totals.debit,  color: '#dc3545' },
          { label: 'Net Flow',     val: totals.credit - totals.debit, color: '#ffc107' },
        ].map(c => (
          <div key={c.label} style={{ background: '#1a1a2e', border: `1px solid ${c.color}25`, borderRadius: 6, padding: '10px 18px' }}>
            <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{c.label}</div>
            <div style={{ fontWeight: 800, color: c.color, fontFamily: 'var(--font-mono)', fontSize: 14 }}>₹{fmt2(c.val)}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#1a1a2e', border: '1px solid #252540', borderRadius: 6, padding: 14, marginBottom: 16 }}>
        <DateRangeRow startDate={startDate} setStartDate={setStartDate} endDate={endDate} setEndDate={setEndDate} onSubmit={load} onClear={clear} loading={loading}
          extra={<div style={{ minWidth: 180 }}>
            <span style={S.label}>User</span>
            <Sel value={userId} onChange={setUserId} placeholder="All Users">
              {students.map(s => <option key={s.id} value={String(s.id)}>{s.full_name || s.username} ({s.username})</option>)}
            </Sel>
          </div>}
        />
      </div>
      <LogTable columns={COLS} rows={entries} loading={loading} emptyMsg="No ledger entries found." />
    </LogPage>
  );
}
