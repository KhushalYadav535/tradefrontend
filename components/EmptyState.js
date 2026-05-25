'use client';

export default function EmptyState({ icon = '○', title, subtitle }) {
  return (
    <div className="card p-12 text-center">
      <div className="text-5xl text-muted mb-3">{icon}</div>
      <div className="heading text-lg font-semibold">{title}</div>
      {subtitle && <div className="text-sm text-muted mt-1">{subtitle}</div>}
    </div>
  );
}
