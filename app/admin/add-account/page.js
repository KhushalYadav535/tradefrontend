'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';

/* ─── AVADH11 style tokens ───────────────────────────────────── */
const C = {
  bg:      '#0f0f1a',
  surface: '#1a1a2e',
  card:    '#181828',
  border:  '#252540',
  text:    '#e0e0e0',
  muted:   '#888',
  brand:   '#f5a623',
};

const sectionTitle = {
  fontSize: 11, fontWeight: 800, color: C.muted,
  textTransform: 'uppercase', letterSpacing: '0.12em',
  padding: '10px 16px', background: '#111120',
  borderBottom: `1px solid ${C.border}`,
};
const card  = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, marginBottom: 16, overflow: 'hidden' };
const body  = { padding: 20 };
const lbl   = { fontSize: 11, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5, display: 'block' };
const inp   = { background: '#252540', border: `1px solid #333`, color: C.text, borderRadius: 4, padding: '8px 12px', fontSize: 13, width: '100%', outline: 'none' };
const selSt = { ...inp, paddingRight: 32, appearance: 'none', cursor: 'pointer' };
const arr   = { position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#888', pointerEvents: 'none', fontSize: 11 };
const row   = { display: 'grid', gap: 16 };

const ROLE_ROUTES = { user: '/admin/users', master: '/admin/masters', broker: '/admin/brokers' };

export default function AddAccountPage() {
  const router = useRouter();

  /* form fields */
  const [userType,       setUserType]       = useState('');
  const [username,       setUsername]       = useState('');
  const [password,       setPassword]       = useState('');
  const [fullName,       setFullName]       = useState('');
  const [phone,          setPhone]          = useState('');
  const [city,           setCity]           = useState('');
  const [balance,        setBalance]        = useState('500000');
  const [exposure,       setExposure]       = useState('');
  const [masterId,       setMasterId]       = useState('');
  const [brokerId,       setBrokerId]       = useState('');
  const [brokerageType,  setBrokerageType]  = useState('per_lot');
  const [brokerageValue, setBrokerageValue] = useState('');
  const [commissionPct,  setCommissionPct]  = useState('');
  const [autoCut,        setAutoCut]        = useState(false);
  const [autoCutLimit,   setAutoCutLimit]   = useState('');
  const [remarks,        setRemarks]        = useState('');

  /* dropdowns */
  const [masters, setMasters] = useState([]);
  const [brokers, setBrokers] = useState([]);

  /* UI state */
  const [busy,    setBusy]    = useState(false);
  const [created, setCreated] = useState(null);
  const [error,   setError]   = useState('');
  const [toast,   setToast]   = useState(null);

  const showToast = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 4000); };

  useEffect(() => {
    api.get('/admin/masters').then(r => setMasters(r.data.masters || [])).catch(() => {});
    api.get('/admin/brokers').then(r => setBrokers(r.data.brokers || [])).catch(() => {});
  }, []);

  const genPassword = () => {
    const c = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!';
    setPassword(Array.from({ length: 10 }, () => c[Math.floor(Math.random() * c.length)]).join(''));
  };

  const reset = () => {
    setUserType(''); setUsername(''); setPassword(''); setFullName('');
    setPhone(''); setCity(''); setBalance('500000'); setExposure('');
    setMasterId(''); setBrokerId(''); setBrokerageType('per_lot');
    setBrokerageValue(''); setCommissionPct(''); setAutoCut(false);
    setAutoCutLimit(''); setRemarks(''); setError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!userType)           return setError('Please select user type');
    if (!username.trim())    return setError('Username is required');
    if (!password || password.length < 6) return setError('Password must be at least 6 characters');
    setBusy(true);
    try {
      const { data } = await api.post('/admin/students', {
        username:        username.trim(),
        password,
        full_name:       fullName.trim() || username.trim(),
        phone:           phone || null,
        city:            city || null,
        balance:         Number(balance) || 500000,
        exposure:        exposure ? Number(exposure) : undefined,
        role:            userType,
        master_id:       masterId  ? Number(masterId)  : null,
        broker_id:       brokerId  ? Number(brokerId)  : null,
        brokerage_type:  brokerageType,
        brokerage_value: brokerageValue !== '' ? Number(brokerageValue) : 0,
        commission_pct:  commissionPct ? Number(commissionPct) : null,
        auto_cut:        autoCut,
        auto_cut_limit:  autoCut && autoCutLimit ? Number(autoCutLimit) : null,
      });
      setCreated({ ...data.student, _plain_password: password });
      showToast(`Account "${data.student.username}" created successfully!`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create account');
    } finally { setBusy(false); }
  };

  const typeColor = { user: '#17a2b8', master: '#6f42c1', broker: '#e87722' }[userType] || C.brand;

  /* ── Success screen ── */
  if (created) {
    return (
      <div style={{ background: C.bg, minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ background: C.card, border: `1px solid ${typeColor}40`, borderRadius: 10, padding: 32, maxWidth: 480, width: '100%', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#1a3a1a', border: '3px solid #28a745', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 30, color: '#28a745' }}>✓</div>
          <div style={{ fontWeight: 800, fontSize: 22, color: '#28a745', marginBottom: 4 }}>Account Created!</div>
          <div style={{ color: '#888', fontSize: 13, marginBottom: 24 }}>Share these login credentials with the account holder</div>

          <div style={{ background: '#111120', border: '1px solid #333', borderRadius: 6, padding: 16, marginBottom: 20, textAlign: 'left' }}>
            {[
              ['Account Type', <span style={{ color: typeColor, fontWeight: 700, textTransform: 'uppercase' }}>{userType}</span>],
              ['Username',     <span style={{ fontFamily: 'monospace', color: '#fff', fontWeight: 700, fontSize: 14 }}>{created.username}</span>],
              ['Password',     <span style={{ fontFamily: 'monospace', color: C.brand, fontWeight: 700 }}>{created._plain_password}</span>],
              ['Full Name',    created.full_name || '—'],
              ['Balance',      `₹${Number(created.balance).toLocaleString('en-IN')}`],
              ...(created.phone ? [['Phone', created.phone]] : []),
              ...(created.city  ? [['City',  created.city]]  : []),
            ].map(([lbl, val]) => (
              <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #252535', fontSize: 13 }}>
                <span style={{ color: '#888' }}>{lbl}</span>
                <span>{val}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigator.clipboard.writeText(`Username: ${created.username}\nPassword: ${created._plain_password}\nType: ${userType}`)}
              style={{ padding: '9px 18px', background: '#2a2a3d', color: '#aaa', border: '1px solid #444', borderRadius: 4, fontWeight: 700, cursor: 'pointer' }}>
              📋 Copy Credentials
            </button>
            <button onClick={() => { setCreated(null); reset(); }}
              style={{ padding: '9px 18px', background: '#17a2b8', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 700, cursor: 'pointer' }}>
              + Add Another
            </button>
            <button onClick={() => router.push(ROLE_ROUTES[userType] || '/admin/users')}
              style={{ padding: '9px 18px', background: '#28a745', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 700, cursor: 'pointer' }}>
              View Listing →
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Sel component ── */
  const Sel = ({ value, onChange, placeholder, children }) => (
    <div style={{ position: 'relative' }}>
      <select value={value} onChange={e => onChange(e.target.value)} style={selSt}>
        {placeholder && <option value="">{placeholder}</option>}
        {children}
      </select>
      <span style={arr}>▼</span>
    </div>
  );

  return (
    <div style={{ background: C.bg, minHeight: '100%', color: C.text, fontFamily: 'var(--font-sans, Inter, sans-serif)' }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, padding: '12px 22px', borderRadius: 6, fontWeight: 700, fontSize: 13, background: toast.ok ? '#28a745' : '#dc3545', color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
          {toast.ok ? '✅ ' : '❌ '}{toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '13px 20px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontWeight: 800, fontSize: 18, color: '#fff' }}>Add Account</div>
      </div>

      <div style={{ padding: '16px 20px', maxWidth: 860 }}>
        <form onSubmit={submit}>

          {/* ═══ BASIC DETAILS ═══ */}
          <div style={card}>
            <div style={sectionTitle}>BASIC DETAILS</div>
            <div style={body}>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto 1fr auto 1fr', alignItems: 'center', gap: '12px 10px' }}>

                {/* USERTYPE */}
                <span style={{ ...lbl, marginBottom: 0 }}>USERTYPE</span>
                <Sel value={userType} onChange={setUserType} placeholder="Select Type">
                  <option value="master">Master</option>
                  <option value="broker">Broker</option>
                  <option value="user">User</option>
                </Sel>

                {/* NAME */}
                <span style={{ ...lbl, marginBottom: 0 }}>NAME</span>
                <input value={fullName} onChange={e => setFullName(e.target.value)} style={inp} placeholder="Enter Name" />

                {/* PASSWORD */}
                <span style={{ ...lbl, marginBottom: 0 }}>PASSWORD</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input value={password} onChange={e => setPassword(e.target.value)} style={{ ...inp, flex: 1 }} placeholder="Enter Password" required />
                  <button type="button" onClick={genPassword} title="Generate password"
                    style={{ padding: '8px 12px', background: '#2a2a4a', color: '#17a2b8', border: '1px solid #17a2b840', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
                    ⚡
                  </button>
                </div>

                {/* USERNAME */}
                <span style={{ ...lbl, marginBottom: 0 }}>USERNAME</span>
                <input value={username} onChange={e => setUsername(e.target.value)} style={inp} placeholder="Login ID (unique)" required autoFocus />

                {/* PHONE */}
                <span style={{ ...lbl, marginBottom: 0 }}>PHONE</span>
                <input value={phone} onChange={e => setPhone(e.target.value)} style={inp} placeholder="Mobile Number" />

                {/* CITY */}
                <span style={{ ...lbl, marginBottom: 0 }}>CITY</span>
                <input value={city} onChange={e => setCity(e.target.value)} style={inp} placeholder="City" />
              </div>
            </div>
          </div>

          {/* ═══ ACCOUNT SETTINGS ═══ */}
          <div style={card}>
            <div style={sectionTitle}>ACCOUNT SETTINGS</div>
            <div style={body}>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto 1fr', alignItems: 'center', gap: '12px 10px' }}>

                {/* BALANCE */}
                <span style={{ ...lbl, marginBottom: 0 }}>BALANCE (₹)</span>
                <input type="number" min="0" value={balance} onChange={e => setBalance(e.target.value)} style={inp} />

                {/* EXPOSURE */}
                <span style={{ ...lbl, marginBottom: 0 }}>EXPOSURE (₹)</span>
                <input type="number" min="0" value={exposure} onChange={e => setExposure(e.target.value)} style={inp} placeholder="Same as balance" />

                {/* BROKERAGE TYPE */}
                <span style={{ ...lbl, marginBottom: 0 }}>BROKERAGE TYPE</span>
                <Sel value={brokerageType} onChange={setBrokerageType}>
                  <option value="per_lot">Per Lot</option>
                  <option value="per_crore">Per Crore</option>
                </Sel>

                {/* BROKERAGE VALUE */}
                <span style={{ ...lbl, marginBottom: 0 }}>BROKERAGE VALUE</span>
                <input type="number" min="0" step="0.01" value={brokerageValue} onChange={e => setBrokerageValue(e.target.value)} style={inp} placeholder="0.00" />

                {/* COMMISSION % */}
                <span style={{ ...lbl, marginBottom: 0 }}>COMMISSION %</span>
                <input type="number" min="0" max="100" step="0.01" value={commissionPct} onChange={e => setCommissionPct(e.target.value)} style={inp} placeholder="0.00" />

                {/* AUTO CUT */}
                <span style={{ ...lbl, marginBottom: 0 }}>AUTO CUT</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button type="button" onClick={() => setAutoCut(!autoCut)}
                    style={{ width: 48, height: 26, borderRadius: 13, background: autoCut ? '#28a745' : '#2a2a3d', border: `1px solid ${autoCut ? '#28a745' : '#444'}`, cursor: 'pointer', position: 'relative', transition: 'background 200ms', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: 3, left: autoCut ? 23 : 3, width: 18, height: 18, borderRadius: 9, background: '#fff', transition: 'left 200ms' }} />
                  </button>
                  {autoCut && (
                    <input type="number" min="0" value={autoCutLimit} onChange={e => setAutoCutLimit(e.target.value)}
                      style={{ ...inp, flex: 1 }} placeholder="Cut Limit (₹)" required />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ═══ RELATIONS (user only) ═══ */}
          {userType === 'user' && (
            <div style={card}>
              <div style={sectionTitle}>ACCOUNT RELATIONS</div>
              <div style={body}>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto 1fr', alignItems: 'center', gap: '12px 10px' }}>
                  <span style={{ ...lbl, marginBottom: 0 }}>ASSIGN MASTER</span>
                  <Sel value={masterId} onChange={setMasterId} placeholder="No Master (Optional)">
                    {masters.map(m => <option key={m.id} value={String(m.id)}>{m.full_name || m.username} ({m.username})</option>)}
                  </Sel>
                  <span style={{ ...lbl, marginBottom: 0 }}>ASSIGN BROKER</span>
                  <Sel value={brokerId} onChange={setBrokerId} placeholder="No Broker (Optional)">
                    {brokers.map(b => <option key={b.id} value={String(b.id)}>{b.full_name || b.username} ({b.username})</option>)}
                  </Sel>
                </div>
              </div>
            </div>
          )}

          {/* ═══ REMARKS ═══ */}
          <div style={card}>
            <div style={sectionTitle}>REMARKS</div>
            <div style={body}>
              <textarea
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                rows={5}
                placeholder="Remarks"
                style={{ ...inp, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
              />
            </div>
          </div>

          {/* ── Error ── */}
          {error && (
            <div style={{ background: '#3a1a1a', border: '1px solid #dc354550', borderRadius: 4, padding: '10px 14px', marginBottom: 16, color: '#dc3545', fontSize: 13 }}>
              ⚠ {error}
            </div>
          )}

          {/* ── CANCEL + SUBMIT ── */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="button" onClick={() => router.push(userType ? ROLE_ROUTES[userType] : '/admin/users')}
              style={{ padding: '10px 30px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 800, fontSize: 14, cursor: 'pointer', letterSpacing: '0.04em' }}>
              CANCEL
            </button>
            <button type="submit" disabled={busy}
              style={{ padding: '10px 30px', background: '#6f42c1', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 800, fontSize: 14, cursor: 'pointer', opacity: busy ? 0.7 : 1, letterSpacing: '0.04em' }}>
              {busy ? 'CREATING…' : 'SUBMIT'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
