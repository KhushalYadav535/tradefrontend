'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Disclaimer from '@/components/Disclaimer';

export default function TradingLayout({ children }) {
  const router = useRouter();
  const { token, loading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && !token) router.replace('/login');
  }, [token, loading, router]);

  if (loading || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Header onToggleSidebar={() => setCollapsed((v) => !v)} />
      <Disclaimer />
      <div className="flex flex-1 min-h-0">
        <Sidebar collapsed={collapsed} />
        <main className="flex-1 overflow-auto p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
