import React, { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(null);

const STYLES = {
  default: { bar: 'bg-ink', icon: '●' },
  success: { bar: 'bg-signal-go', icon: '✓' },
  error: { bar: 'bg-signal-stop', icon: '!' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'default') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3400);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-wrap">
        {toasts.map((t) => {
          const s = STYLES[t.type] || STYLES.default;
          return (
            <div
              key={t.id}
              className="toast-item flex items-start gap-3 bg-ink text-white rounded-md shadow-lift pl-3 pr-4 py-3 min-w-[260px] max-w-[360px]"
            >
              <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${s.bar}`}>
                {s.icon}
              </span>
              <span className="text-sm leading-snug font-medium">{t.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
