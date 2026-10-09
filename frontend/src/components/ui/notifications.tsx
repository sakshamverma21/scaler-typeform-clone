"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, X } from "lucide-react";

const NotificationContext = createContext<(message: string) => void>(() => {});

export function Notifications({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<{ message: string; id: number } | null>(
    null,
  );
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 5000);
    return () => window.clearTimeout(timer);
  }, [notice]);
  return (
    <NotificationContext.Provider
      value={(message) => setNotice({ message, id: Date.now() })}
    >
      {children}
      {notice && (
        <div
          role="status"
          className="fixed right-4 bottom-5 left-4 z-[60] flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm shadow-[var(--shadow-overlay)] sm:left-auto sm:max-w-md"
        >
          <CheckCircle2
            size={18}
            className="shrink-0 text-[var(--success)]"
            aria-hidden="true"
          />
          <span className="min-w-0 flex-1">{notice.message}</span>
          <button
            aria-label="Dismiss notification"
            className="flex size-8 shrink-0 items-center justify-center rounded-md hover:bg-surface-muted"
            onClick={() => setNotice(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </NotificationContext.Provider>
  );
}

export const useNotify = () => useContext(NotificationContext);
