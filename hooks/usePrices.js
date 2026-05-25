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

  useEffect(() => {
    mounted.current = true;
    fetchOnce();
    timer.current = setInterval(fetchOnce, intervalMs);
    return () => {
      mounted.current = false;
      clearInterval(timer.current);
    };
  }, [intervalMs]);

  return { scripts, loading, error, refresh: fetchOnce };
}
