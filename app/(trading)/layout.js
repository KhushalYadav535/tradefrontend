'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Disclaimer from '@/components/Disclaimer';


export default function TradingLayout({ children }) {
  const router = useRouter();
  const { token, user, loading } = useAuth();
  const [collapsed, setCollapsed] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [maintenance, setMaintenance] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!loading && !token) router.replace('/login');
  }, [token, loading, router]);

  // Check maintenance mode (public endpoint, no auth needed)
  // Strip trailing /api from base URL since this endpoint is at /api/settings/public
  useEffect(() => {
    const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');
    fetch(`${base}/api/settings/public`)
      .then(r => r.json())
      .then(data => {
        if (data?.settings?.maintenance_mode === true) setMaintenance(true);
      })
      .catch(() => {});
  }, []);

  if (loading || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted">
        Loading…
      </div>
    );
  }

  // Show maintenance screen for non-admin users
  if (maintenance && user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg gap-6 px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-surface2 border border-border flex items-center justify-center mb-2">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-warn">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <h1 className="heading text-3xl font-bold">Platform Under Maintenance</h1>
        <p className="text-muted max-w-md text-sm leading-relaxed">
          We are currently performing scheduled maintenance. Trading is temporarily suspended.
          Please check back shortly. We apologise for the inconvenience.
        </p>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-warn/10 border border-warn/30 text-warn text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-warn animate-pulse" />
          Maintenance in Progress
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-bg overflow-hidden" suppressHydrationWarning>
      <Header onToggleSidebar={() => isMobile ? setSidebarOpen(!sidebarOpen) : setCollapsed(!collapsed)} />
      <Disclaimer />
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {/* Mobile overlay */}
        {isMobile && sidebarOpen && (
          <div 
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', zIndex: 40 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <div className={`
          absolute md:relative md:flex
          h-full overflow-y-auto
          z-50 md:z-auto bg-surface shadow-2xl md:shadow-none
          transition-all duration-300 ease-in-out
          ${isMobile 
            ? `w-64 top-0 left-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}` 
            : `${collapsed ? 'w-14' : 'w-60'} translate-x-0`
          }
        `}>
          <Sidebar collapsed={!isMobile && collapsed} onClose={() => setSidebarOpen(false)} />
        </div>
        <main className="flex-1 overflow-y-auto p-3 md:p-4 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
