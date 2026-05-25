'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/context/AuthContext';

function fmt(n, d = 2) {
  return Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
}

function expiryLabel(s) {
  // Convert "OCT" → "26OCT2026" (rough display only)
  return s?.expiry ? `26${s.expiry}2026` : '';
}

function StatCell({ label, value, highlight, tone }) {
  const ringCls = highlight
    ? tone === 'buy'
      ? 'border-blue-400 ring-2 ring-blue-400/40'
      : 'border-blue-400 ring-2 ring-blue-400/40'
    : 'border-transparent';
  return (
    <div className={`px-3 py-2 rounded-md bg-black/30 border-2 ${ringCls} min-w-[88px] text-center`}>
      <div className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">{label}</div>
      <div className="price text-sm font-semibold text-white mt-0.5">{value}</div>
    </div>
  );
}

export default function InlineOrderPanel({ script, side: initialSide, onClose, onPlaced }) {
  const toast = useToast();
  const { refreshUser } = useAuth();
  const [side, setSide] = useState(initialSide || 'BUY');
  const [orderType, setOrderType] = useState('MARKET');
  const [lots, setLots] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const ltp = Number(script?.ltp ?? script?.current_price ?? 0);
  const bid = Number(script?.bid ?? ltp);
  const ask = Number(script?.ask ?? ltp);

  // Default price tracks BID (sell) or ASK (buy) when MARKET, free-form otherwise
  const refPrice = side === 'BUY' ? ask : bid;
  const [price, setPrice] = useState(refPrice.toFixed(2));

  useEffect(() => {
    if (orderType === 'MARKET') setPrice(refPrice.toFixed(2));
  }, [refPrice, orderType, side]);

  if (!script) return null;

  const lotSize = Number(script.lot_size || 1);
  const qty = Number(lots || 0) * lotSize;
  const margin = Number(lots || 0) * Number(script.margin_per_lot || 0);

  const isSell = side === 'SELL';
  const tone = isSell ? 'sell' : 'buy';

  const submit = async () => {
    if (!lots || lots < 1) {
      toast.error('Lots must be at least 1');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post('/trades', {
        script_id: script.id,
        trade_type: side,
        lots: Number(lots),
        price: orderType === 'MARKET' ? refPrice : Number(price),
        order_type: orderType,
        product_type: 'INTRADAY',
      });
      toast.success(
        `${side} ${data.trade.lots} lot${data.trade.lots > 1 ? 's' : ''} of ${data.trade.script} @ ${data.trade.price}`
      );
      await refreshUser();
      onPlaced?.(data);
      onClose?.();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Order failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Theme colors via inline style so light mode also shows the bright tint
  const panelBg = isSell
    ? 'linear-gradient(180deg, rgba(120, 30, 40, 0.96), rgba(150, 40, 50, 0.98))'
    : 'linear-gradient(180deg, rgba(20, 80, 60, 0.96), rgba(20, 110, 70, 0.98))';

  return (
    <>
      {/* Click-away backdrop */}
      <div className="fixed inset-0 z-[60]" onClick={onClose} />

      <div
        className="fixed left-0 right-0 bottom-0 z-[70] border-t-2 shadow-2xl text-white"
        style={{
          background: panelBg,
          borderTopColor: isSell ? '#ef4444' : '#22c55e',
        }}
      >
        <div className="px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          {/* Top row: stat cells */}
          <div className="flex items-stretch gap-2 overflow-x-auto pb-2">
            <div className="px-4 py-3 rounded-md bg-black/40 border-2 border-black/40 min-w-[180px] flex items-center">
              <div>
                <div className="heading text-base font-bold leading-tight">{script.name}</div>
                <div className="text-[11px] text-white/70">{expiryLabel(script)}</div>
              </div>
            </div>
            <StatCell label="Bid Rate" value={fmt(bid)} highlight={isSell} tone={tone} />
            <StatCell label="Ask Rate" value={fmt(ask)} highlight={!isSell} tone={tone} />
            <StatCell label="LTP" value={fmt(ltp)} highlight tone={tone} />
            <StatCell label="Change %" value={`${(script.change_pct || 0) >= 0 ? '+' : ''}${fmt(script.change_pct)}%`} />
            <StatCell label="Net Chg" value={
              <span className="flex items-center justify-center gap-1">
                <span className={(script.net_change || 0) >= 0 ? 'text-emerald-300' : 'text-red-300'}>
                  {(script.net_change || 0) >= 0 ? '▲' : '▼'}
                </span>
                <span>{fmt(Math.abs(script.net_change || 0))}</span>
              </span>
            } />
            <StatCell label="High" value={fmt(script.high)} />
            <StatCell label="Low" value={fmt(script.low)} />
            <StatCell label="Open" value={fmt(script.open)} />
            <StatCell label="Close" value={fmt(script.close)} />
            <button
              onClick={onClose}
              className="ml-auto self-start w-7 h-7 rounded bg-black/30 hover:bg-black/50 text-white text-base flex items-center justify-center"
              title="Close"
            >×</button>
          </div>

          {/* Bottom row: form */}
          <div className="flex flex-wrap items-end gap-4 mt-1">
            {/* BUY/SELL radios */}
            <div className="flex items-center gap-4 pr-2">
              <label className={`flex items-center gap-2 cursor-pointer ${!isSell ? 'opacity-100' : 'opacity-70'}`}>
                <input type="radio" checked={!isSell} onChange={() => setSide('BUY')} className="accent-emerald-400 w-4 h-4" />
                <span className="text-sm font-bold tracking-wider">BUY</span>
              </label>
              <label className={`flex items-center gap-2 cursor-pointer ${isSell ? 'opacity-100' : 'opacity-70'}`}>
                <input type="radio" checked={isSell} onChange={() => setSide('SELL')} className="accent-red-400 w-4 h-4" />
                <span className="text-sm font-bold tracking-wider">SELL</span>
              </label>
            </div>

            {/* Order type */}
            <div className="min-w-[140px]">
              <div className="text-[10px] uppercase tracking-wider text-white/70 font-semibold mb-1">Type</div>
              <select
                value={orderType}
                onChange={(e) => setOrderType(e.target.value)}
                className="w-full bg-black/40 border border-white/20 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-white/60"
              >
                <option value="MARKET">Market</option>
                <option value="LIMIT">Limit</option>
                <option value="SL">Stop Loss</option>
              </select>
            </div>

            {/* Lot */}
            <div>
              <div className="text-[10px] uppercase tracking-wider text-white/70 font-semibold mb-1">Lot</div>
              <input
                type="number"
                min="1"
                max={script.max_lots}
                value={lots}
                onChange={(e) => setLots(e.target.value)}
                className="w-20 bg-white/95 text-black price font-semibold rounded px-3 py-2 text-sm focus:outline-none"
              />
            </div>

            {/* Qty (read-only) */}
            <div>
              <div className="text-[10px] uppercase tracking-wider text-white/70 font-semibold mb-1">Qty</div>
              <input
                readOnly
                value={qty}
                className="w-24 bg-white/80 text-black price font-semibold rounded px-3 py-2 text-sm focus:outline-none cursor-not-allowed"
              />
            </div>

            {/* Price */}
            <div>
              <div className="text-[10px] uppercase tracking-wider text-white/70 font-semibold mb-1">Price</div>
              <input
                type="number"
                step="0.05"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={orderType === 'MARKET'}
                className="w-28 bg-black/40 border border-white/20 rounded px-3 py-2 text-sm text-white price font-semibold focus:outline-none focus:border-white/60 disabled:opacity-70"
              />
            </div>

            <div className="flex-1" />

            {/* Submit / Cancel */}
            <div className="flex gap-2">
              <button
                onClick={submit}
                disabled={submitting}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold tracking-wider px-7 py-2.5 rounded text-sm disabled:opacity-60"
              >
                {submitting ? 'SUBMITTING…' : 'SUBMIT'}
              </button>
              <button
                onClick={onClose}
                className="bg-rose-500 hover:bg-rose-600 text-white font-bold tracking-wider px-7 py-2.5 rounded text-sm"
              >
                CANCEL
              </button>
            </div>
          </div>

          {/* Margin hint */}
          <div className="mt-2 text-[11px] text-white/70">
            Margin required: <span className="price font-semibold text-white">₹{fmt(margin)}</span>
            <span className="mx-2">·</span>
            Lot size: <span className="price text-white">{lotSize}</span>
            <span className="mx-2">·</span>
            Max lots: <span className="price text-white">{script.max_lots}</span>
          </div>
        </div>
      </div>
    </>
  );
}
