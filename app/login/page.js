'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';

export default function LoginPage() {
  const router = useRouter();
  const { login, token, user, loading } = useAuth();
  const toast = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && token && user) {
      router.replace(user.role === 'admin' ? '/admin' : '/watchlist');
    }
  }, [token, user, loading, router]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return;
    setSubmitting(true);
    try {
      const u = await login(username.trim(), password);
      toast.success(`Welcome ${u.full_name || u.username}`);
      router.replace(u.role === 'admin' ? '/admin' : '/watchlist');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            'radial-gradient(circle at 20% 30%, rgba(124,58,237,0.18), transparent 40%), radial-gradient(circle at 80% 70%, rgba(168,85,247,0.10), transparent 40%)',
        }}
      />
      <div className="card w-full max-w-md p-8 relative z-10 shadow-glow">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-3 bg-gradient-to-br from-brand to-brand-2">
            <span className="heading font-bold text-2xl text-white">A</span>
          </div>
          <h1 className="heading text-3xl font-bold tracking-tight bg-gradient-to-br from-brand-2 to-brand bg-clip-text text-transparent">
            AVADH15
          </h1>
          <p className="text-muted text-sm mt-1">India&apos;s Biggest Virtual Exchange</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-muted mb-1.5 uppercase tracking-wider">User ID</label>
            <input
              autoFocus
              className="input"
              placeholder="Enter your user id"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1.5 uppercase tracking-wider">Password</label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full py-2.5 mt-2 heading tracking-wider text-base"
          >
            {submitting ? 'Signing in…' : 'LOGIN'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-border text-xs text-muted space-y-1">
          <div className="flex justify-between"><span>Student:</span> <span className="text-fg/80">demo / demo123</span></div>
          <div className="flex justify-between"><span>Admin:</span> <span className="text-fg/80">admin / admin123</span></div>
        </div>
      </div>
    </div>
  );
}
