'use client';

/**
 * useVedpragyaLtp
 *
 * Polls /api/market/ltp for a fixed list of symbols and returns
 * a map { NIFTY: 23200, BANKNIFTY: 55000, ... }.
 *
 * This is the "always-on" polling fallback (used in IndexTickers header bar).
 * For genuine real-time ticks use useVedpragyaStream.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import api from '@/lib/axios';

const DEFAULT_SYMBOLS = ['NIFTY', 'BANKNIFTY', 'RELIANCE', 'HDFCBANK', 'INFOSYS'];

export default function useVedpragyaLtp(symbols = DEFAULT_SYMBOLS, intervalMs = 3000) {
  const [prices, setPrices] = useState({}); // { SYMBOL: { ltp, uirId, name, exchange } }
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState('vedpragya');
  const mounted = useRef(true);
  const timer = useRef(null);

  const fetchPrices = useCallback(async () => {
    if (!mounted.current) return;
    try {
      const { data } = await api.get(`/market/ltp?symbols=${symbols.join(',')}`);
      if (!mounted.current) return;
      const map = {};
      for (const p of data.prices || []) {
        if (p.ltp != null) map[p.symbol] = p;
      }
      setPrices((prev) => ({ ...prev, ...map }));
      setSource('vedpragya');
    } catch {
      // silently fail — stale data stays
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [symbols.join(',')]); // eslint-disable-line

  useEffect(() => {
    mounted.current = true;
    fetchPrices();
    timer.current = setInterval(fetchPrices, intervalMs);

    const handleVisibility = () => {
      if (document.hidden) {
        clearInterval(timer.current);
      } else {
        fetchPrices();
        timer.current = setInterval(fetchPrices, intervalMs);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      mounted.current = false;
      clearInterval(timer.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchPrices, intervalMs]);

  return { prices, loading, source };
}
