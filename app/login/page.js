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
  const [showPassword, setShowPassword] = useState(false);
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
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="input pr-10"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-muted hover:text-fg rounded transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full py-2.5 mt-2 heading tracking-wider text-base"
          >
            {submitting ? 'Signing in…' : 'LOGIN'}
          </button>
        </form>
      </div>
    </div>
  );
}
