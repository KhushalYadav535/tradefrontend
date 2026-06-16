'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';

function parseExpiryTime(exp) {
  if (!exp) return 0;
  // If it's already YYYY-MM-DD, JS can parse it directly
  if (/^\d{4}-\d{2}-\d{2}/.test(exp)) {
    return new Date(exp).getTime();
  }
  // Format: 26-05-2026 (DD-MM-YYYY)
  if (exp.includes('-')) {
    const parts = exp.split('-');
    if (parts.length === 3) {
      return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00Z`).getTime();
    }
  }
  // Format: 16JUN2026 (DDMMMYYYY)
  const match = exp.match(/^(\d{2})([A-Za-z]{3})(\d{4})$/);
  if (match) {
    const d = match[1];
    const m = match[2];
    const y = match[3];
    return new Date(`${d} ${m} ${y} 00:00:00 GMT`).getTime();
  }
  return new Date(exp).getTime(); // Fallback
}

export default function useVedpragyaExpiries(scriptName, segment) {
  const [expiries, setExpiries] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!scriptName) {
      setExpiries([]);
      return;
    }

    let q = scriptName;
    // Add FUT to get futures contracts which usually contain the active expiries for MCX
    if (segment?.startsWith('MCX')) {
      q = `${scriptName} FUT`;
    }

    let cancelled = false;
    setLoading(true);

    api.get(`/market/search?q=${encodeURIComponent(q)}&limit=50`)
      .then(res => {
        if (cancelled) return;
        const results = Array.isArray(res.data) ? res.data : (res.data?.results || []);
        const unique = [...new Set(results.map(r => r.expiry).filter(Boolean))];
        
        // Filter out old dates
        const now = Date.now() - 24 * 60 * 60 * 1000;
        const valid = unique.filter(exp => {
          const t = parseExpiryTime(exp);
          return isNaN(t) || t >= now; // keep if unparseable, otherwise must be >= yesterday
        });
        
        // Sort chronologically
        valid.sort((a, b) => parseExpiryTime(a) - parseExpiryTime(b));
        
        setExpiries(valid);
      })
      .catch(() => {
        if (!cancelled) setExpiries([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [scriptName, segment]);

  return { expiries, loading };
}
