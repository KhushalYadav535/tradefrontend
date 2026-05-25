'use client';

export default function ContactUplineModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-md shadow-glow"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-3 border-b border-border flex items-center justify-between bg-red/10">
          <h3 className="heading text-lg font-bold tracking-wider">CONTACT UPLINE</h3>
          <button onClick={onClose} className="text-muted hover:text-white text-xl leading-none">×</button>
        </div>
        <div className="p-5 space-y-3 text-sm">
          <p className="text-muted">Reach your broker for funds, queries, or account assistance.</p>

          <a href="tel:+919876543210" className="flex items-center gap-3 px-3 py-2.5 rounded bg-bg border border-border hover:border-accent">
            <span className="text-accent">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
            </span>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted">Phone</div>
              <div className="price">+91 98765 43210</div>
            </div>
          </a>

          <a href="https://wa.me/919876543210" target="_blank" rel="noreferrer" className="flex items-center gap-3 px-3 py-2.5 rounded bg-bg border border-border hover:border-accent">
            <span className="text-accent">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M.057 24l1.687-6.163A11.867 11.867 0 0 1 .002 11.92C0 5.336 5.335 0 11.918 0 15.111 0 18.108 1.245 20.36 3.5a11.82 11.82 0 0 1 3.486 8.41c-.003 6.585-5.338 11.92-11.93 11.92a11.9 11.9 0 0 1-5.683-1.45L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.51 5.262l-.999 3.648 3.978-1.041z"/>
              </svg>
            </span>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted">WhatsApp</div>
              <div className="price">+91 98765 43210</div>
            </div>
          </a>

          <a href="mailto:support@avadh11.example" className="flex items-center gap-3 px-3 py-2.5 rounded bg-bg border border-border hover:border-accent">
            <span className="text-brand-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
              </svg>
            </span>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted">Email</div>
              <div>support@avadh11.example</div>
            </div>
          </a>

          <div className="pt-2 text-[11px] text-muted">
            Office hours · Mon–Sat · 09:00–22:00 IST
          </div>
        </div>
      </div>
    </div>
  );
}
