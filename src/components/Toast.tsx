"use client"

import { createContext, useContext, useState, useCallback, useRef } from "react"
import { AnimatePresence, motion } from "framer-motion"

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastType = "success" | "error" | "info"

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counterRef = useRef(0)

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = `toast-${++counterRef.current}`
    setToasts((prev) => {
      const next = [...prev, { id, message, type }]
      return next.slice(-3) // max 3 simultaneous
    })
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </ToastContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used inside ToastProvider")
  return ctx
}

// ─── Colors ───────────────────────────────────────────────────────────────────

const TOAST_STYLES: Record<ToastType, { bg: string; border: string; color: string; icon: string }> = {
  success: { bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.4)", color: "#22c55e", icon: "✓" },
  error:   { bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.4)", color: "#ef4444", icon: "✕" },
  info:    { bg: "rgba(139,47,212,0.15)", border: "rgba(139,47,212,0.4)", color: "var(--brand-secondary)", icon: "i" },
}

// ─── Container ────────────────────────────────────────────────────────────────

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div
      style={{
        position: "fixed",
        top: "16px",
        right: "16px",
        zIndex: "var(--z-toast)",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        pointerEvents: "none",
      }}
    >
      <AnimatePresence>
        {toasts.map((t) => {
          const s = TOAST_STYLES[t.type]
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              transition={{ duration: 0.18 }}
              onClick={() => onDismiss(t.id)}
              style={{
                pointerEvents: "auto",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 14px",
                borderRadius: "var(--radius-md)",
                backgroundColor: s.bg,
                border: `1px solid ${s.border}`,
                backdropFilter: "blur(12px)",
                boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
                cursor: "pointer",
                minWidth: "220px",
                maxWidth: "320px",
              }}
            >
              <span
                style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  backgroundColor: s.border,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  fontWeight: 800,
                  color: s.color,
                  flexShrink: 0,
                }}
              >
                {s.icon}
              </span>
              <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)", lineHeight: 1.4 }}>
                {t.message}
              </span>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
