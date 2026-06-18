'use client';
import { useState, useCallback, useEffect } from 'react';
import api from '@/lib/axios';
import { LogPage, LogTable, DateRangeRow, Sel, S, fmtDT } from '@/components/LogViewerShared';
const today = () => new Date().toISOString().split('T')[0];

export default function IpLogPage() {
  const [students, setStudents] = useState([]);
  const [startDate, setStartDate] = useState(today());
  const [endDate,   setEndDate]   = useState(today());
  const [userId,    setUserId]    = useState('');
  const [ip,        setIp]        = useState('');
  const [rows,      setRows]      = useState([]);
  const [loading,   setLoading]   = useState(false);

  useEffect(() => { api.get('/admin/students').then(r => setStudents(r.data.students || [])).catch(() => {}); }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/logs/ip', { params: { start_date: startDate, end_date: endDate, user_id: userId || undefined, ip: ip || undefined } });
      setRows(data.logs || []);
    } catch { setRows([]); } finally { setLoading(false); }
  }, [startDate, endDate, userId, ip]);

  const clear = () => { setUserId(''); setIp(''); setRows([]); };

  // Group by user+IP for summary
  const ipGroups = rows.reduce((acc, r) => {
    const key = `${r.username}|${r.ip_address}`;
    if (!acc[key]) acc[key] = { username: r.username, full_name: r.full_name, ip_address: r.ip_address, count: 0, last_seen: r.logged_at };
    acc[key].count++;
    if (new Date(r.logged_at) > new Date(acc[key].last_seen)) acc[key].last_seen = r.logged_at;
    return acc;
  }, {});

  const SUMMARY_COLS = [
    { key: 'username',    label: 'User' },
    { key: 'full_name',   label: 'Full Name' },
    { key: 'ip_address',  label: 'IP Address', style: { fontFamily: 'monospace', color: '#17a2b8' }, render: v => v || '—' },
    { key: 'count',       label: 'Hits', render: v => <span style={{ fontWeight: 700, color: v > 10 ? '#dc3545' : '#28a745' }}>{v}</span> },
    { key: 'last_seen',   label: 'Last Seen', render: v => fmtDT(v) },
  ];

  const DETAIL_COLS = [
    { key: 'logged_at',  label: 'Date/Time', render: v => fmtDT(v) },
    { key: 'username',   label: 'User' },
    { key: 'action',     label: 'Action', render: v => <span style={{ color: '#888', fontSize: 11 }}>{v || '—'}</span> },
    { key: 'ip_address', label: 'IP Address', style: { fontFamily: 'monospace', color: '#17a2b8' } },
    { key: 'login_count', label: 'Same IP Hits', render: v => <span style={{ color: Number(v) > 10 ? '#dc3545' : '#888' }}>{v}</span> },
  ];

  return (
    <LogPage title="IP Address Log" subtitle="Track login IPs and detect suspicious multi-IP access" color="#6f42c1" badge={rows.length}>
      <div style={{ background: '#1a1a2e', border: '1px solid #252540', borderRadius: 6, padding: 14, marginBottom: 16 }}>
        <DateRangeRow startDate={startDate} setStartDate={setStartDate} endDate={endDate} setEndDate={setEndDate} onSubmit={load} onClear={clear} loading={loading}
          extra={<>
            <div style={{ minWidth: 160 }}>
              <span style={S.label}>User</span>
              <Sel value={userId} onChange={setUserId} placeholder="All Users">
                {students.map(s => <option key={s.id} value={String(s.id)}>{s.username}</option>)}
              </Sel>
            </div>
            <div style={{ minWidth: 150 }}>
              <span style={S.label}>IP Filter</span>
              <input value={ip} onChange={e => setIp(e.target.value)} style={S.input} placeholder="192.168.x.x" />
            </div>
          </>}
        />
      </div>

      {rows.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6f42c1', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>IP Summary</div>
          <LogTable columns={SUMMARY_COLS} rows={Object.values(ipGroups)} loading={false} emptyMsg="No data" />
        </div>
      )}

      <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Detailed Log</div>
      <LogTable columns={DETAIL_COLS} rows={rows} loading={loading} emptyMsg="Select date range and click SUBMIT." />
    </LogPage>
  );
}
