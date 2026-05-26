'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import PageHeader from '@/components/PageHeader';
import { useToast } from '@/components/Toast';
import EmptyState from '@/components/EmptyState';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/students');
      setStudents(data.students);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = students.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.username.toLowerCase().includes(q) || (s.full_name || '').toLowerCase().includes(q);
  });

  const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const onDelete = async (s) => {
    if (!window.confirm(`Delete student "${s.username}"? This removes their account and all trades.`)) return;
    try {
      await api.delete(`/admin/students/${s.id}`);
      toast.success(`Deleted ${s.username}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    }
  };

  const onToggleActive = async (s) => {
    try {
      await api.patch(`/admin/students/${s.id}`, { is_active: !s.is_active });
      toast.success(`${s.username} ${s.is_active ? 'deactivated' : 'activated'}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    }
  };

  return (
    <div>
      <PageHeader
        title="Students"
        subtitle="Create login credentials for your students and manage their accounts"
        right={
          <div className="flex items-center gap-2">
            <input
              placeholder="Search by name or id…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input w-56"
            />
            <button onClick={() => setCreateOpen(true)} className="btn-primary">
              + Add Student
            </button>
          </div>
        }
      />

      {loading ? (
        <div className="text-muted text-sm">Loading…</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={students.length === 0 ? 'No students yet' : 'No matches'}
          subtitle={students.length === 0 ? 'Click + Add Student to create your first student account' : 'Try a different search'}
        />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>User ID</th>
                <th>Full Name</th>
                <th className="text-right">Balance</th>
                <th className="text-right">Exposure</th>
                <th className="text-right">Trades</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={s.id}>
                  <td className="text-muted">{i + 1}</td>
                  <td className="font-semibold price">{s.username}</td>
                  <td>{s.full_name || '—'}</td>
                  <td className="price text-right text-accent">₹{fmt(s.balance)}</td>
                  <td className="price text-right text-warn">₹{fmt(s.exposure)}</td>
                  <td className="price text-right">{s.trade_count}</td>
                  <td className="text-xs uppercase text-muted tracking-wider font-semibold">{s.role}</td>
                  <td>
                    <span className={s.is_active ? 'badge-ok' : 'badge-bad'}>
                      {s.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="text-xs text-muted">{new Date(s.created_at).toLocaleDateString()}</td>
                  <td className="text-right space-x-1">
                    <button onClick={() => setEditStudent(s)} className="btn-ghost text-xs py-1 px-2">Edit</button>
                    <button onClick={() => onToggleActive(s)} className="btn-ghost text-xs py-1 px-2">
                      {s.is_active ? 'Disable' : 'Enable'}
                    </button>
                    <button onClick={() => onDelete(s)} className="text-red border border-red/30 hover:bg-red/10 text-xs py-1 px-2 rounded font-semibold">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {createOpen && (
        <CreateStudentModal
          onClose={() => setCreateOpen(false)}
          onCreated={() => { setCreateOpen(false); load(); }}
        />
      )}
      {editStudent && (
        <EditStudentModal
          student={editStudent}
          onClose={() => setEditStudent(null)}
          onSaved={() => { setEditStudent(null); load(); }}
        />
      )}
    </div>
  );
}

function CreateStudentModal({ onClose, onCreated }) {
  const toast = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [balance, setBalance] = useState(500000);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null);

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let p = '';
    for (let i = 0; i < 8; i++) p += chars[Math.floor(Math.random() * chars.length)];
    setPassword(p);
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post('/admin/students', {
        username: username.trim(),
        password,
        full_name: fullName.trim(),
        balance: Number(balance),
      });
      setCreated({ ...data.student, password });
      toast.success(`Student "${data.student.username}" created`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Create failed');
    } finally {
      setBusy(false);
    }
  };

  if (created) {
    return (
      <Modal onClose={() => { onCreated(); }} title="Student Created" accent="brand">
        <div className="space-y-4">
          <div className="rounded bg-surface2 border border-accent/40 p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted mb-2">Share these credentials with the student</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Row label="User ID" value={created.username} />
              <Row label="Password" value={created.password} />
              <Row label="Full Name" value={created.full_name || '—'} />
              <Row label="Starting Balance" value={`₹${Number(created.balance).toLocaleString('en-IN')}`} />
            </div>
          </div>
          <div className="text-xs text-muted">
            Save or copy the password now. You can reset it later from the Edit dialog, but it won&apos;t be shown again here.
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => navigator.clipboard.writeText(`User ID: ${created.username}\nPassword: ${created.password}`)} className="btn-ghost">
              Copy
            </button>
            <button onClick={onCreated} className="btn-primary">Done</button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose} title="Add Student" accent="brand">
      <form onSubmit={submit} className="space-y-4">
        <Field label="User ID" hint="3-50 chars · letters, digits, _ . -">
          <input className="input" required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="student001" autoFocus />
        </Field>
        <Field label="Password" hint="At least 6 characters">
          <div className="flex gap-2">
            <input className="input" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" />
            <button type="button" onClick={generatePassword} className="btn-ghost shrink-0 text-xs">Generate</button>
          </div>
        </Field>
        <Field label="Full Name (optional)">
          <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Rohit Kumar" />
        </Field>
        <Field label="Starting Balance (₹)">
          <input className="input price" type="number" min="0" step="1000" value={balance} onChange={(e) => setBalance(e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="submit" disabled={busy} className="btn-primary">{busy ? 'Creating…' : 'Create Student'}</button>
        </div>
      </form>
    </Modal>
  );
}

function EditStudentModal({ student, onClose, onSaved }) {
  const toast = useToast();
  const [fullName, setFullName] = useState(student.full_name || '');
  const [balance, setBalance] = useState(student.balance);
  const [role, setRole] = useState(student.role || 'user');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const body = { full_name: fullName, balance: Number(balance), role };
      if (password) body.password = password;
      await api.patch(`/admin/students/${student.id}`, body);
      toast.success(`Updated ${student.username}`);
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal onClose={onClose} title={`Edit · ${student.username}`} accent="brand">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full Name">
          <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </Field>
        <Field label="Balance (₹)" hint={`Current: ₹${Number(student.balance).toLocaleString('en-IN')} · changes are recorded in ledger`}>
          <input className="input price" type="number" step="0.01" value={balance} onChange={(e) => setBalance(e.target.value)} />
        </Field>
        <Field label="Account Role" hint="Admin has full access to the entire platform.">
          <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="user">User (Student/Trader)</option>
            <option value="admin">Administrator</option>
          </select>
        </Field>
        <Field label="Reset Password" hint="Leave blank to keep the existing password">
          <input className="input" placeholder="New password (optional)" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="submit" disabled={busy} className="btn-primary">{busy ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </form>
    </Modal>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-[60] bg-fg/40 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="card w-full max-w-md shadow-glow" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-3 border-b border-border flex items-center justify-between bg-brand/10">
          <h3 className="heading text-lg font-bold tracking-wide">{title}</h3>
          <button onClick={onClose} className="text-muted hover:text-fg text-xl leading-none">×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-[10px] text-muted uppercase tracking-wider mb-1">{label}</label>
      {children}
      {hint && <div className="text-[10px] text-muted mt-1">{hint}</div>}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted">{label}</div>
      <div className="price font-semibold">{value}</div>
    </div>
  );
}
