'use client';

import { useEffect, useRef, useState } from 'react';
import api from '@/lib/axios';

const NSE_OPT_SYMBOLS = new Set(['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY']);

export default function useOptionChain(symbol, intervalMs = 15000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const timer = useRef(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    if (!symbol || !NSE_OPT_SYMBOLS.has(symbol)) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const fetchOnce = async () => {
      if (!mounted.current) return;
      setLoading(true);
      try {
        const { data: payload } = await api.get(`/scripts/option-chain/${symbol}`);
        if (!cancelled) {
          setData(payload);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.error || 'Option chain unavailable');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchOnce();
    timer.current = setInterval(fetchOnce, intervalMs);
    return () => {
      cancelled = true;
      mounted.current = false;
      clearInterval(timer.current);
    };
  }, [symbol, intervalMs]);

  return { data, loading, error };
}

export { NSE_OPT_SYMBOLS };
