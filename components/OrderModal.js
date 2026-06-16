'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/context/AuthContext';

export default function OrderModal({ script, side, onClose, onPlaced }) {
  const toast = useToast();
  const { refreshUser } = useAuth();
  const [orderType, setOrderType] = useState('MARKET');
  const [productType, setProductType] = useState('INTRADAY');
  const [lots, setLots] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Use live VP ltp/bid/ask — same priority as InlineOrderPanel
  const ltp = Number(script?.ltp ?? script?.current_price ?? 0);
  const bid = Number(script?.bid ?? ltp);
  const ask = Number(script?.ask ?? ltp);

  const [price, setPrice] = useState(ltp.toFixed(2));

  useEffect(() => {
    if (orderType === 'MARKET') setPrice(ltp.toFixed(2));
  }, [ltp, orderType]);

  if (!script) return null;

  const qty = (Number(lots) || 0) * Number(script.lot_size);
  const total = qty * Number(price || 0);
  const margin = (Number(lots) || 0) * Number(script.margin_per_lot || 0);

  const submit = async (overrideSide) => {
    const tradeSide = overrideSide || side;
    if (!lots || lots < 1) {
      toast.error('Lots must be at least 1');
      return;
    }
    setSubmitting(true);
    try {
      // For MARKET orders use bid (sell) or ask (buy) — live VP price
      const execPrice = orderType === 'MARKET'
        ? (tradeSide === 'SELL' ? bid : ask)
        : Number(price);
      const { data } = await api.post('/trades', {
        script_id: script.id,
        trade_type: tradeSide,
        lots: Number(lots),
        price: execPrice,
        order_type: orderType,
        product_type: productType,
        nonce: crypto.randomUUID(),
        timestamp: Date.now(),
      });
      toast.success(
        `${tradeSide} ${data.trade.lots} lot${data.trade.lots > 1 ? 's' : ''} of ${data.trade.script} @ ${data.trade.price}`
      );
      await refreshUser();
      onPlaced?.(data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Order failed');
    } finally {
      setSubmitting(false);
    }
  };

  const segBtn = (active) =>
    `text-xs py-1 rounded transition-colors ${
      active ? 'bg-brand text-white font-semibold shadow-soft' : 'text-muted hover:text-fg'
    }`;

  return (
    <div
      className="fixed inset-0 z-50 bg-fg/40 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-md shadow-glow"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`px-5 py-3 border-b border-border flex items-center justify-between ${
          side === 'BUY' ? 'bg-accent/10' : 'bg-red/10'
        }`}>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="heading text-lg font-bold">{script.name}</h3>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface2 text-muted">{script.expiry}</span>
            </div>
            <div className="text-xs text-muted">{script.exchange} · Lot {script.lot_size}</div>
          </div>
          <div className="text-right">
            <div className="price text-lg font-semibold">{ltp.toFixed(2)}</div>
            <div className="text-[10px] text-muted/80">
              B: {bid.toFixed(2)} · A: {ask.toFixed(2)}
            </div>
            <span className={`badge ${side === 'BUY' ? 'badge-buy' : 'badge-sell'}`}>{side}</span>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-muted uppercase tracking-wider mb-1">Order Type</label>
              <div className="grid grid-cols-3 gap-1 bg-surface2 border border-border rounded-md p-1">
                {['MARKET', 'LIMIT', 'SL'].map((t) => (
                  <button key={t} onClick={() => setOrderType(t)} className={segBtn(orderType === t)}>{t}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-muted uppercase tracking-wider mb-1">Product</label>
              <div className="grid grid-cols-2 gap-1 bg-surface2 border border-border rounded-md p-1">
                {['INTRADAY', 'DELIVERY'].map((t) => (
                  <button key={t} onClick={() => setProductType(t)} className={segBtn(productType === t)}>{t}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-muted uppercase tracking-wider mb-1">Lots (max {script.max_lots})</label>
              <input
                type="number"
                min="1"
                max={script.max_lots}
                className="input price"
                value={lots}
                onChange={(e) => setLots(e.target.value)}
              />
              <div className="text-[10px] text-muted mt-1">Qty: <span className="price text-fg">{qty}</span></div>
            </div>
            <div>
              <label className="block text-[10px] text-muted uppercase tracking-wider mb-1">Price</label>
              <input
                type="number"
                step="0.05"
                className="input price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={orderType === 'MARKET'}
              />
              <div className="text-[10px] text-muted mt-1">
                {orderType === 'MARKET' ? 'Market price' : 'Limit price'}
              </div>
            </div>
          </div>

          <div className="bg-surface2 border border-border rounded-md p-3 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-muted">Total Value</span>
              <span className="price">₹{total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Margin Required</span>
              <span className="price text-warn">₹{margin.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Lot Size</span>
              <span className="price">{script.lot_size}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <button onClick={() => submit('BUY')} disabled={submitting} className="btn-buy">
              {submitting && side === 'BUY' ? '…' : 'BUY'}
            </button>
            <button onClick={() => submit('SELL')} disabled={submitting} className="btn-sell">
              {submitting && side === 'SELL' ? '…' : 'SELL'}
            </button>
            <button onClick={onClose} disabled={submitting} className="btn-ghost">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
