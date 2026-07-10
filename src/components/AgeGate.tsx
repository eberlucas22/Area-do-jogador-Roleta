"use client"

import { useState } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { ShieldAlert } from "lucide-react"
import { AppLogo } from "@/components/AppLogo"

const STORAGE_KEY = "age_gate_accepted_at"

type State = "checking" | "gate" | "blocked" | "accepted"

export function AgeGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(() => {
    if (typeof window === "undefined") return "checking"
    return localStorage.getItem(STORAGE_KEY) ? "accepted" : "gate"
  })
  const prefersReduced = useReducedMotion()

  function handleAccept() {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString())
    setState("accepted")
  }

  function handleDecline() {
    setState("blocked")
  }

  function handleBack() {
    setState("gate")
  }

  // While checking localStorage: render nothing (prevent any content flash)
  if (state === "checking") return null

  // Accepted: render the app normally
  if (state === "accepted") return <>{children}</>

  // Gate or blocked: full-screen overlay, children NOT rendered
  const cardAnim = prefersReduced
    ? {}
    : { initial: { scale: 0.95, opacity: 0 }, animate: { scale: 1, opacity: 1 } }

  return (
    <AnimatePresence>
      <motion.div
        key="gate-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          backgroundColor: "var(--bg-base)",
          backgroundImage: "radial-gradient(ellipse 120% 55% at 50% -5%, rgba(26,16,48,0.92) 0%, transparent 62%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          overflowY: "auto",
        }}
      >
        {/* ── Gate: "Você tem mais de 18 anos?" ── */}
        {state === "gate" && (
          <motion.div
            key="gate-card"
            {...cardAnim}
            transition={{ duration: 0.25 }}
            style={{
              width: "100%",
              maxWidth: "420px",
              backgroundColor: "var(--surface-2)",
              borderRadius: "20px",
              padding: "36px 32px",
              textAlign: "center",
              margin: "auto",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            {/* Logo */}
            <div style={{ marginBottom: "24px", display: "flex", justifyContent: "center" }}>
              <AppLogo variant="auth" />
            </div>

            {/* Question */}
            <h1
              style={{
                margin: "0 0 20px",
                fontSize: "26px",
                fontWeight: 900,
                color: "var(--text-primary)",
                fontFamily: "var(--font-display)",
                lineHeight: 1.2,
              }}
            >
              Você tem mais de 18 anos?
            </h1>

            {/* Full disclaimer text — ≥16px, contraste AA */}
            <p
              style={{
                margin: "0 0 32px",
                fontSize: "16px",
                lineHeight: 1.7,
                color: "var(--text-primary)",
              }}
            >
              Este conteúdo é só entretenimento. Apostas são jogos de sorte —
              nenhum sinal ou sistema garante resultado. Apostar não é
              investimento nem renda extra. Jogue com responsabilidade.{" "}
              <strong>Proibido para menores de 18 anos.</strong>
            </p>

            {/* Buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <button
                onClick={handleAccept}
                style={{
                  width: "100%",
                  padding: "15px",
                  borderRadius: "12px",
                  backgroundColor: "var(--brand-primary)",
                  color: "#fff",
                  fontSize: "16px",
                  fontWeight: 800,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "var(--font-display)",
                  boxShadow: "0 0 20px rgba(139,47,212,0.4)",
                  letterSpacing: "0.02em",
                }}
              >
                SIM
              </button>

              <button
                onClick={handleDecline}
                style={{
                  width: "100%",
                  padding: "15px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(255,255,255,0.08)",
                  color: "var(--text-secondary)",
                  fontSize: "16px",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "var(--font-display)",
                }}
              >
                NÃO
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Blocked: acesso negado ── */}
        {state === "blocked" && (
          <motion.div
            key="blocked-card"
            {...cardAnim}
            transition={{ duration: 0.2 }}
            style={{
              width: "100%",
              maxWidth: "420px",
              backgroundColor: "var(--surface-2)",
              borderRadius: "20px",
              padding: "36px 32px",
              textAlign: "center",
              margin: "auto",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                backgroundColor: "rgba(239,68,68,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                color: "var(--danger)",
              }}
            >
              <ShieldAlert size={32} />
            </div>

            <h1
              style={{
                margin: "0 0 16px",
                fontSize: "22px",
                fontWeight: 900,
                color: "var(--text-primary)",
                fontFamily: "var(--font-display)",
              }}
            >
              Acesso Restrito
            </h1>

            <p
              style={{
                margin: "0 0 32px",
                fontSize: "16px",
                lineHeight: 1.7,
                color: "var(--text-primary)",
              }}
            >
              Este aplicativo é exclusivo para maiores de 18 anos. O acesso não
              é permitido para menores de idade.
            </p>

            {/* Only action: return to the gate question */}
            <button
              onClick={handleBack}
              style={{
                width: "100%",
                padding: "15px",
                borderRadius: "12px",
                backgroundColor: "rgba(255,255,255,0.08)",
                color: "var(--text-secondary)",
                fontSize: "16px",
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-display)",
              }}
            >
              Voltar
            </button>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
