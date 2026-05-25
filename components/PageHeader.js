'use client';

export default function PageHeader({ title, subtitle, right }) {
  return (
    <div className="flex items-end justify-between mb-5 gap-4 flex-wrap">
      <div>
        <h1 className="heading text-2xl font-bold tracking-wide">{title}</h1>
        {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
      </div>
      {right && <div>{right}</div>}
    </div>
  );
}
