"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { RouletteTable } from "@/components/RouletteTable"
import { ShieldCheck, Shield, ShieldAlert, ChevronDown, Layers } from "lucide-react"

interface Play {
  id: string
  name: string
  description: string
  risk_level: "Baixo" | "Médio" | "Alto"
  numbers: number[]
  sort_order: number
}

const RISK_CONFIG = {
  Baixo: { color: "#4ade80", bg: "rgba(74,222,128,0.12)", Icon: ShieldCheck },
  Médio: { color: "#fbbf24", bg: "rgba(251,191,36,0.12)", Icon: Shield },
  Alto:  { color: "#f87171", bg: "rgba(248,113,113,0.12)", Icon: ShieldAlert },
}

export function JogadasModule() {
  const [plays, setPlays] = useState<Play[]>([])
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState<string | null>(null)
  const tableRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.from("plays").select("id,name,description,risk_level,numbers,sort_order").order("sort_order")
      .then(({ data }) => { setPlays(data ?? []); setLoading(false) }, () => setLoading(false))
  }, [])

  const handleToggle = useCallback((id: string) => {
    setOpenId((prev) => {
      const next = prev === id ? null : id
      if (next && window.innerWidth < 768) {
        setTimeout(() => tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 180)
      }
      return next
    })
  }, [])

  const activePlay = plays.find((p) => p.id === openId)
  const highlighted = activePlay?.numbers ?? []

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-7 w-7 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "var(--brand-primary)" }} />
      </div>
    )
  }

  if (plays.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <Layers size={36} style={{ color: "var(--text-muted)", opacity: 0.4, margin: "0 auto 12px" }} />
        <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>
          Nenhuma jogada cadastrada ainda. Acesse o admin para adicionar.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-5">
      <h2 style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)", fontSize: "26px", fontWeight: 700, margin: 0 }}>
        Jogadas do Rick
      </h2>

      {/* Accordion de estratégias */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {plays.map((play) => {
          const risk = RISK_CONFIG[play.risk_level]
          const RiskIcon = risk.Icon
          const isOpen = openId === play.id

          return (
            <div
              key={play.id}
              className="rounded-3xl overflow-hidden"
              style={{
                background: isOpen ? "linear-gradient(145deg, rgba(139,47,212,0.12) 0%, var(--surface-1) 100%)" : "var(--surface-1)",
                transition: "background 200ms",
              }}
            >
              {/* Header do accordion */}
              <button
                onClick={() => handleToggle(play.id)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left"
                aria-expanded={isOpen}
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                {/* Badge de risco */}
                <span
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "4px",
                    height: "22px", padding: "0 8px", borderRadius: "99px",
                    background: risk.bg, color: risk.color,
                    fontSize: "11px", fontWeight: 700, flexShrink: 0,
                  }}
                >
                  <RiskIcon size={11} />
                  {play.risk_level}
                </span>

                <span
                  className="flex-1 min-w-0 text-sm font-bold truncate"
                  style={{ color: isOpen ? "var(--brand-secondary)" : "var(--text-primary)" }}
                >
                  {play.name}
                </span>

                <ChevronDown
                  size={18}
                  style={{
                    color: "var(--text-muted)",
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 220ms",
                    flexShrink: 0,
                  }}
                />
              </button>

              {/* Corpo — transição CSS */}
              <div
                style={{
                  maxHeight: isOpen ? "700px" : "0",
                  overflow: "hidden",
                  transition: "max-height 220ms ease-out",
                }}
              >
                <div className="px-5 pb-5 space-y-3"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <p style={{ fontSize: "14px", paddingTop: "14px", lineHeight: 1.7, color: "var(--text-secondary)" }}>
                    {play.description}
                  </p>
                  <p style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                    {play.numbers.length} número{play.numbers.length !== 1 ? "s" : ""}: {play.numbers.join(", ")}
                  </p>
                  <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--brand-secondary)" }}>
                    ↓ Números destacados na mesa abaixo
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Mesa de Roleta */}
      <div ref={tableRef} className="rounded-3xl p-5" style={{ background: "var(--surface-1)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
          <p className="label-caps">Mesa Europeia</p>
          {highlighted.length > 0 && (
            <span className="badge badge-brand">
              {highlighted.length} números ativos
            </span>
          )}
        </div>
        {activePlay ? (
          <RouletteTable highlighted={highlighted} />
        ) : (
          <div style={{ textAlign: "center", padding: "32px 16px" }}>
            <Layers size={36} style={{ color: "var(--text-muted)", opacity: 0.25, margin: "0 auto 12px" }} />
            <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>Selecione uma jogada para destacar os números</p>
          </div>
        )}
      </div>
    </div>
  )
}
