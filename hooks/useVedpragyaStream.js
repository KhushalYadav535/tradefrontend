'use client';

/**
 * useVedpragyaStream
 *
 * Connects to the Vedpragya Streams Socket.IO gateway and subscribes to
 * real-time market_data ticks for a set of symbols.
 *
 * Flow:
 *   1. Fetch Socket.IO URL + API key from our backend (/api/market/ws-url)
 *   2. Fetch UIR ids for the symbols (/api/market/stream-info)
 *   3. Connect Socket.IO to https://marketdata.vedpragya.com
 *   4. Emit subscribe({ channel: 'market_data', instruments: [uirId, ...] })
 *   5. Apply incoming market_data ticks to state
 *
 * Returns:
 *   ticks   — Map<symbol, { ltp, change, pchange, ohlc, bid, ask, volume, ts, seq }>
 *   status  — 'connecting' | 'live' | 'error' | 'closed'
 *   error   — string | null
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import api from '@/lib/axios';

// Lazy-load socket.io-client (SSR-safe)
let ioLib = null;
async function getIo() {
  if (!ioLib) {
    const mod = await import('socket.io-client');
    ioLib = mod.io;
  }
  return ioLib;
}

export default function useVedpragyaStream(symbols = []) {
  // ticks: { SYMBOL: { ltp, change, pchange, bid, ask, ohlc, volume, ts, seq, uirId } }
  const [ticks, setTicks]   = useState({});
  const [status, setStatus] = useState('idle'); // idle | connecting | live | error | closed
  const [error, setError]   = useState(null);

  const socketRef    = useRef(null);
  const uirMapRef    = useRef({});  // { uirId: symbol }
  const lastSeqRef   = useRef({});  // { uirId: seq }  — dedupe out-of-order ticks
  const mountedRef   = useRef(true);
  const symbolsKey   = symbols.slice().sort().join(',');

  const connect = useCallback(async () => {
    if (!symbols.length) return;
    if (!mountedRef.current) return;
    setStatus('connecting');
    setError(null);

    try {
      // 1. Get Socket.IO URL + API key from our JWT-gated backend endpoint
      const { data: wsConfig } = await api.get('/market/ws-url');
      const { socketUrl, apiKey } = wsConfig;
      if (!socketUrl || !apiKey) throw new Error('Missing socket config from backend');

      // 2. Resolve UIR IDs for the given symbols
      const { data: streamInfo } = await api.get(`/market/stream-info?symbols=${symbols.join(',')}`);
      const instruments = (streamInfo.instruments || []);
      const uirIds = instruments
        .filter(i => i.uirId != null)
        .map(i => i.uirId);

      // Build reverse map: uirId → symbol
      const uirMap = {};
      for (const i of instruments) {
        if (i.uirId != null) uirMap[i.uirId] = i.symbol;
      }
      uirMapRef.current = uirMap;

      if (!uirIds.length) {
        setStatus('error');
        setError('No UIR IDs resolved for given symbols');
        return;
      }

      // 3. Connect Socket.IO
      const io = await getIo();
      const socket = io(socketUrl, {
        extraHeaders : { 'x-api-key': apiKey },
        transports   : ['websocket'],
        reconnection : true,
        reconnectionDelay    : 500,
        reconnectionDelayMax : 10_000,
        timeout              : 10_000,
      });
      socketRef.current = socket;

      // 4. On connect → subscribe
      socket.on('connect', () => {
        if (!mountedRef.current) return;
        setStatus('live');
        setError(null);
        socket.emit('subscribe', {
          channel    : 'market_data',
          instruments: uirIds,
          mode       : 'quote',   // LTP + OHLC + change + volume
        });
      });

      // 5. Apply ticks
      socket.on('market_data', (tick) => {
        if (!mountedRef.current) return;

        // Dedupe out-of-order ticks using seq
        const prevSeq = lastSeqRef.current[tick.uirId] ?? 0;
        if (tick.seq != null && tick.seq <= prevSeq) return;
        if (tick.seq != null) lastSeqRef.current[tick.uirId] = tick.seq;

        const symbol = uirMapRef.current[tick.uirId] || tick.uirId;

        setTicks(prev => ({
          ...prev,
          [symbol]: {
            ltp    : tick.last_price    ?? tick.lastPrice,
            change : tick.change,
            pchange: tick.pchange       ?? tick.changePct,
            bid    : tick.bid,
            ask    : tick.ask,
            volume : tick.volume,
            ohlc   : tick.ohlc,
            ts     : tick.ts,
            seq    : tick.seq,
            uirId  : tick.uirId,
          },
        }));
      });

      socket.on('subscription_confirmed', (ack) => {
        console.log('[vedpragya-stream] subscribed:', ack);
      });

      socket.on('connect_error', (err) => {
        if (!mountedRef.current) return;
        setStatus('error');
        setError(err.message || 'Connection failed');
      });

      socket.on('disconnect', (reason) => {
        if (!mountedRef.current) return;
        if (reason !== 'io client disconnect') setStatus('connecting');
      });

    } catch (err) {
      if (!mountedRef.current) return;
      setStatus('error');
      setError(err.message || 'Failed to initialise stream');
    }
  }, [symbolsKey]); // eslint-disable-line

  useEffect(() => {
    mountedRef.current = true;

    if (symbols.length > 0) connect();

    return () => {
      mountedRef.current = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [connect]); // eslint-disable-line

  return { ticks, status, error };
}
