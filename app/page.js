'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const router = useRouter();
  const { token, user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!token) router.replace('/login');
    else router.replace(user?.role === 'admin' ? '/admin' : '/watchlist');
  }, [token, user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-muted">
      Loading…
    </div>
  );
}
