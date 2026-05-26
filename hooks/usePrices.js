'use client';

import { useEffect, useRef, useState } from 'react';
import api from '@/lib/axios';

export default function usePrices(intervalMs = 2000) {
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const timer = useRef(null);
  const mounted = useRef(true);
  const history = useRef(new Map());

  const fetchOnce = async () => {
    try {
      const { data } = await api.get('/scripts');
      if (!mounted.current) return;
      for (const s of data.scripts || []) {
        const arr = history.current.get(s.id) || [];
        arr.push(Number(s.ltp ?? s.current_price));
        if (arr.length > 24) arr.shift();
        history.current.set(s.id, arr);
      }
      const enriched = (data.scripts || []).map((s) => ({
        ...s,
        history: history.current.get(s.id) || [Number(s.ltp ?? s.current_price)],
      }));
      setScripts(enriched);
      setError(null);
    } catch (err) {
      if (!mounted.current) return;
      setError(err.response?.data?.error || 'Failed to load prices');
    } finally {
      if (mounted.current) setLoading(false);
    }
  };

  const resumeInterval = () => {
    if (!mounted.current) return;
    // Fetch fresh data immediately when coming back into focus
    fetchOnce();
    // Resume the regular interval
    timer.current = setInterval(fetchOnce, intervalMs);
  };

  const pauseInterval = () => {
    if (timer.current) {
      clearInterval(timer.current);
    }
  };

  useEffect(() => {
    mounted.current = true;
    fetchOnce();
    timer.current = setInterval(fetchOnce, intervalMs);

    // Handle visibility changes (when browser tab becomes visible/hidden)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden - pause interval to save resources
        pauseInterval();
      } else {
        // Page is visible again - resume and fetch fresh data
        resumeInterval();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      mounted.current = false;
      clearInterval(timer.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [intervalMs]);

  return { scripts, loading, error, refresh: fetchOnce };
}
