"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface Toast {
  id: number;
  message: string;
  type: "new-feedback" | "new-vote";
  /** When the toast was created (ms since epoch) */
  createdAt: number;
  /** Whether the toast is in its exit animation */
  exiting: boolean;
}

const MAX_VISIBLE = 3;
const AUTO_DISMISS_MS = 3500;
const EXIT_ANIMATION_MS = 300;

// ─── ToastContainer component ────────────────────────────────────────────────

interface ContainerProps {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}

export default function ToastContainer({ toasts, onDismiss }: ContainerProps) {
  // Only render up to MAX_VISIBLE (slice from end so newest are kept)
  const visible = toasts.slice(-MAX_VISIBLE);

  return (
    <div
      className="toast-container"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      {visible.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

// ─── Individual toast item ────────────────────────────────────────────────────

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: number) => void;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (toast.exiting) return; // already dismissing — timer not needed
    timerRef.current = setTimeout(() => {
      onDismiss(toast.id);
    }, AUTO_DISMISS_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast.id, toast.exiting, onDismiss]);

  const icon = toast.type === "new-feedback" ? "💬" : "👍";
  const cls = `toast${toast.exiting ? " toast-exit" : ""}`;

  return (
    <div className={cls} role="status">
      <span className="toast-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="toast-message">{toast.message}</span>
      <button
        className="toast-close"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  );
}

// ─── Hook for managing toast state ───────────────────────────────────────────

let _nextId = 1;

export interface UseToastStateReturn {
  toasts: Toast[];
  addToast: (message: string, type: Toast["type"]) => void;
  dismissToast: (id: number) => void;
}

/** Hook that owns toast state. Use in the top-level page component. */
export function useToastState(): UseToastStateReturn {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: number) => {
    // Mark as exiting to trigger CSS exit animation
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    );
    // Remove from DOM after animation completes
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, EXIT_ANIMATION_MS);
  }, []);

  const addToast = useCallback(
    (message: string, type: Toast["type"]) => {
      const id = _nextId++;
      setToasts((prev) => {
        // If already at max visible, drop the oldest to keep the stack bounded
        const trimmed =
          prev.length >= MAX_VISIBLE ? prev.slice(1) : prev;
        return [
          ...trimmed,
          { id, message, type, createdAt: Date.now(), exiting: false },
        ];
      });
    },
    []
  );

  return { toasts, addToast, dismissToast };
}
