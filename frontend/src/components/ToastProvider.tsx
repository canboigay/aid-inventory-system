import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type ToastVariant = 'success' | 'error' | 'info';

export type Toast = {
  id: string;
  variant: ToastVariant;
  title: string;
  message?: string;
  createdAt: number;
};

type ToastContextValue = {
  pushToast: (t: Omit<Toast, 'id' | 'createdAt'>) => void;
  dismissToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function uuid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback((t: Omit<Toast, 'id' | 'createdAt'>) => {
    const id = uuid();
    const toast: Toast = { ...t, id, createdAt: Date.now() };
    setToasts((prev) => [toast, ...prev].slice(0, 5));

    // Auto-dismiss
    const timeoutMs = t.variant === 'error' ? 8000 : 3500;
    window.setTimeout(() => dismissToast(id), timeoutMs);
  }, [dismissToast]);

  const value = useMemo(() => ({ pushToast, dismissToast }), [pushToast, dismissToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[1000] w-[92vw] max-w-sm space-y-2">
        {toasts.map((t) => {
          const base = 'rounded-lg border shadow-sm px-4 py-3 bg-white';
          const styles =
            t.variant === 'success'
              ? 'border-green-200'
              : t.variant === 'error'
                ? 'border-red-200'
                : 'border-gray-200';
          const titleColor =
            t.variant === 'success'
              ? 'text-green-700'
              : t.variant === 'error'
                ? 'text-red-700'
                : 'text-gray-800';

          return (
            <div key={t.id} className={`${base} ${styles}`} role="status" aria-live="polite">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className={`text-sm font-semibold ${titleColor}`}>{t.title}</div>
                  {t.message && <div className="text-sm text-gray-600 mt-0.5">{t.message}</div>}
                </div>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Dismiss"
                  onClick={() => dismissToast(t.id)}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
