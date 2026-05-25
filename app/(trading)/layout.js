'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Disclaimer from '@/components/Disclaimer';

import MobileTabBar from '@/components/MobileTabBar';

export default function TradingLayout({ children }) {
  const router = useRouter();
  const { token, loading } = useAuth();
  const [collapsed, setCollapsed] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    <div className="min-h-screen flex flex-col bg-bg md:pb-0 pb-16">
      <Header onToggleSidebar={() => isMobile ? setSidebarOpen(!sidebarOpen) : setCollapsed(!collapsed)} />
      <Disclaimer />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Mobile overlay */}
        {isMobile && sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" 
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <div className={`
          fixed md:relative md:flex
          h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] overflow-y-auto
          z-50 md:z-auto bg-surface shadow-2xl md:shadow-none
          transition-all duration-300 ease-in-out
          ${isMobile 
            ? `w-64 top-16 left-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}` 
            : `${collapsed ? 'w-14' : 'w-60'} translate-x-0`
          }
        `}>
          <Sidebar collapsed={!isMobile && collapsed} />
        </div>
        <main className="flex-1 overflow-auto p-3 md:p-4 w-full">
          {children}
        </main>
      </div>
      <MobileTabBar onOpenMenu={() => setSidebarOpen(true)} />
    </div>
  );
}
