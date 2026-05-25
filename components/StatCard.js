'use client';

export default function StatCard({ label, value, accent }) {
  const cls =
    accent === 'green' ? 'text-accent'
    : accent === 'red' ? 'text-red'
    : accent === 'yellow' ? 'text-yellow-400'
    : 'text-white';
  return (
    <div className="card p-4">
      <div className="text-[10px] uppercase tracking-wider text-muted">{label}</div>
      <div className={`heading text-2xl font-bold mt-1 ${cls} price`}>{value}</div>
    </div>
  );
}
