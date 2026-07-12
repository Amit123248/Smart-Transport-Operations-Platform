import React, { useEffect } from 'react';

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed';
  const sizes = { sm: 'text-xs px-3 py-1.5', md: 'text-sm px-4 py-2.5', lg: 'text-sm px-5 py-3' };
  const variants = {
    primary: 'bg-accent text-white hover:bg-accent-600',
    dark: 'bg-ink text-white hover:bg-black',
    ghost: 'bg-transparent text-ink hover:bg-black/5 border border-line',
    subtle: 'bg-[#F0F0EE] text-ink hover:bg-[#E7E5DC]',
    danger: 'bg-[#FBEBEB] text-signal-stop hover:bg-[#F5D9D9]',
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Panel({ className = '', children }) {
  return <div className={`bg-panel border border-line rounded-lg shadow-panel ${className}`}>{children}</div>;
}

export function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div>
        {eyebrow && (
          <p className="text-xs font-mono uppercase tracking-widest text-accent font-semibold mb-1.5">{eyebrow}</p>
        )}
        <h1 className="font-display text-2xl font-semibold text-ink">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted max-w-xl">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Field({ label, hint, error, children, required }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-ink mb-1.5">
        {label} {required && <span className="text-accent">*</span>}
      </span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-muted">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-medium text-signal-stop">{error}</span>}
    </label>
  );
}

const inputCls = 'w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-muted/70 focus:border-ink transition-colors';

export function Input(props) {
  return <input {...props} className={`${inputCls} ${props.className || ''}`} />;
}

export function Select({ children, ...props }) {
  return (
    <select {...props} className={`${inputCls} appearance-none bg-white ${props.className || ''}`}>
      {children}
    </select>
  );
}

export function Modal({ open, onClose, title, subtitle, children, width = 'max-w-lg' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto py-8 px-4">
      <div className="fixed inset-0 bg-ink/50 animate-fade-in" onClick={onClose} />
      <div className={`relative w-full ${width} bg-panel rounded-lg shadow-lift animate-rise-in`}>
        <div className="flex items-start justify-between border-b border-line px-6 py-4">
          <div>
            <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
            {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted hover:bg-black/5 hover:text-ink"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({ icon = '◇', title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F0F0EE] text-xl text-muted mb-4">
        {icon}
      </div>
      <h3 className="font-display text-base font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function KpiCard({ label, value, unit, tone = 'ink', sub }) {
  const toneCls = {
    ink: 'text-ink',
    go: 'text-signal-go',
    hold: 'text-[#8A6100]',
    stop: 'text-signal-stop',
    transit: 'text-signal-transit',
  }[tone];
  return (
    <Panel className="p-5 relative overflow-hidden">
      <div className="absolute right-0 top-0 h-full w-1 bg-current opacity-10" style={{ color: 'currentColor' }} />
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-2 font-display text-3xl font-semibold ${toneCls}`}>
        {value}
        {unit && <span className="ml-1 text-base font-medium text-muted">{unit}</span>}
      </p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </Panel>
  );
}

export function Spinner({ className = '' }) {
  return (
    <span
      className={`inline-block h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin ${className}`}
    />
  );
}

export function IdTag({ children }) {
  return <span className="font-mono text-xs text-muted">{children}</span>;
}
