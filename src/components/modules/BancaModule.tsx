"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { useToast } from "@/components/Toast"
import { HeroCard } from "@/components/HeroCard"

// Recharts carregado sob demanda — split de chunk (~120 kB)
const BancaChart = dynamic(
  () => import("./BancaChart").then((m) => m.BancaChart),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-3xl p-5" style={{ background: "var(--surface-1)" }}>
        <div className="skeleton" style={{ height: "220px", borderRadius: "12px" }} />
      </div>
    ),
  }
)
import { createClient } from "@/lib/supabase/client"
import {
  deriveDays, currentBalance, currentDayIndex, deriveStatus,
  type CycleDay, type DayStatus, type Settings,
} from "@/lib/gestao/calc"

const supabase = createClient()

// ─── Types ────────────────────────────────────────────────────────────────
type GestaoRow = {
  id: string
  device_id: string
  initial_amount: number
  days: CycleDay[]
  is_active: boolean
  started_at: string
}

type MarkingState = {
  dayIndex: number
  clickedStatus: "win" | "loss"
  inputValue: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function getOrCreateDeviceId(): string {
  const KEY = "gestao_device_id"
  let id = localStorage.getItem(KEY)
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(KEY, id) }
  return id
}

function fmtDate(d: string) {
  const [y, m, day] = d.split("-")
  return `${day}/${m}/${y}`
}

function fmtR(v: number) { return `R$ ${v.toFixed(2)}` }

function parseAmount(s: string): number { return parseFloat(s.replace(",", ".")) }

function generateDays(): CycleDay[] {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return { index: i, date: d.toISOString().slice(0, 10), status: "pending" as DayStatus, end_amount: 0 }
  })
}

// ─── Chart data ───────────────────────────────────────────────────────────
type ChartPt = { day: string; actual: number | null; projected: number | null }

function buildChartData(days: CycleDay[], initialAmount: number, maxDayIndex = 29): ChartPt[] {
  const relevantDays = days.slice(0, maxDayIndex + 1)
  const pts: ChartPt[] = [{ day: "0", actual: initialAmount, projected: null }]
  let lastActualPtIdx = 0

  for (const d of relevantDays) {
    if (d.status !== "pending") {
      pts.push({ day: String(d.index + 1), actual: d.end_amount, projected: null })
      lastActualPtIdx = pts.length - 1
    } else {
      pts.push({ day: String(d.index + 1), actual: null, projected: d.end_amount })
    }
  }
  if (lastActualPtIdx < pts.length - 1 && pts[lastActualPtIdx + 1]?.projected !== null) {
    pts[lastActualPtIdx] = { ...pts[lastActualPtIdx], projected: pts[lastActualPtIdx].actual }
  }
  return pts
}

// ─── Ring Progress ────────────────────────────────────────────────────────
function RingProgress({ value, max, size = 52 }: { value: number; max: number; size?: number }) {
  const r = size / 2 - 5
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - Math.min(value, max) / max)
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="rgba(255,255,255,0.15)" strokeWidth={3.5} />
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="rgba(255,255,255,0.92)" strokeWidth={3.5}
        strokeDasharray={circ} strokeDashoffset={offset}
        transform={`rotate(-90 ${size/2} ${size/2})`} strokeLinecap="round" />
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="middle"
        fill="white" fontSize={11} fontWeight={700}>
        {value}
      </text>
    </svg>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: DayStatus }) {
  if (status === "win") return (
    <span className="badge badge-success">✅ Meta</span>
  )
  if (status === "loss") return (
    <span className="badge badge-danger">🛑 Stop</span>
  )
  return <span className="badge badge-muted">—</span>
}

// ─── Modal wrapper ────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.80)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-6 space-y-4"
        style={{
          background: "var(--surface-2)",
          boxShadow: "var(--shadow-lg), 0 0 0 1px rgba(255,255,255,0.05)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
          {title}
        </h3>
        {children}
      </div>
    </div>
  )
}

// ─── Marking modal ────────────────────────────────────────────────────────
function MarkingModal({
  marking, prevBalance, isCorrecting, dayLabel,
  onInputChange, onConfirm, onCancel, saving,
}: {
  marking: MarkingState; prevBalance: number; isCorrecting: boolean; dayLabel: number
  onInputChange: (v: string) => void; onConfirm: () => void; onCancel: () => void; saving: boolean
}) {
  const numValue = parseAmount(marking.inputValue)
  const isValid = !isNaN(numValue) && numValue >= 0
  const diff = isValid ? numValue - prevBalance : null
  const diffPct = isValid && prevBalance > 0 ? ((numValue / prevBalance) - 1) * 100 : null
  const derivedStatus = isValid ? deriveStatus(numValue, prevBalance) : null
  const showWarning = isValid && derivedStatus !== null && derivedStatus !== marking.clickedStatus

  return (
    <Modal title={isCorrecting ? `Corrigir dia ${dayLabel}` : "Como fechou o dia?"} onClose={onCancel}>
      <p className="text-xs -mt-1" style={{ color: "var(--text-muted)" }}>
        Dia {dayLabel} · Base: {fmtR(prevBalance)}
      </p>

      <div>
        <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
          Banca ao final do dia (R$)
        </label>
        <input
          type="number" min={0} step="0.01" autoFocus
          value={marking.inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && isValid && onConfirm()}
          className="w-full rounded-2xl px-4 py-3 text-2xl font-bold font-mono text-center"
          style={{ background: "var(--surface-3)", border: "none", color: "var(--text-primary)", outline: "none" }}
        />
      </div>

      {isValid && diff !== null && diffPct !== null && (
        <div className="rounded-xl px-3 py-2 text-sm font-semibold text-center"
          style={{
            background: diff >= 0 ? "rgba(34,197,94,0.10)" : "rgba(239,68,68,0.10)",
            color: diff >= 0 ? "#4ade80" : "#f87171",
          }}>
          {diff >= 0 ? "+" : ""}{fmtR(diff)}{" "}
          <span style={{ opacity: 0.7 }}>({diffPct >= 0 ? "+" : ""}{diffPct.toFixed(1)}%)</span>
        </div>
      )}

      {showWarning && (
        <p className="text-xs leading-relaxed px-1" style={{ color: "#fbbf24" }}>
          ⚠️ Pelo valor, este dia será{" "}
          <strong style={{ color: "#fcd34d" }}>
            {derivedStatus === "win" ? "positivo" : "negativo"}
          </strong>.
        </p>
      )}

      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 rounded-xl py-2.5 text-sm font-semibold"
          style={{ background: "var(--surface-3)", color: "var(--text-muted)", border: "none" }}>
          Cancelar
        </button>
        <button onClick={onConfirm} disabled={!isValid || saving}
          className="flex-1 rounded-xl py-2.5 text-sm font-bold disabled:opacity-40"
          style={{ background: "var(--brand-primary)", color: "white", border: "none" }}>
          {saving ? "Salvando…" : "Confirmar"}
        </button>
      </div>
    </Modal>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
export function BancaModule() {
  const [deviceId] = useState<string | null>(() =>
    typeof window !== "undefined" ? getOrCreateDeviceId() : null
  )
  const [cycle, setCycle] = useState<GestaoRow | null | undefined>(undefined)
  const [settings, setSettings] = useState<Settings>({ stop_win_pct: 10, stop_loss_pct: 40 })
  const [setupAmount, setSetupAmount] = useState("")
  const [marking, setMarking] = useState<MarkingState | null>(null)
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [adjustValue, setAdjustValue] = useState("")
  const [saving, setSaving] = useState(false)
  const [chartView, setChartView] = useState<"realized" | "7d" | "30d">("realized")
  const { showToast } = useToast()

  // ── Init ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const did = deviceId
    if (!did) return
    Promise.all([
      supabase.from("settings").select("stop_win_pct,stop_loss_pct").single(),
      supabase.from("gestao_cycles").select("id,device_id,user_id,initial_amount,days,is_active,started_at")
        .eq("device_id", did).eq("is_active", true)
        .order("started_at", { ascending: false }).limit(1).maybeSingle(),
    ]).then(([settRes, cycleRes]) => {
      if (settRes.data) setSettings({ stop_win_pct: settRes.data.stop_win_pct, stop_loss_pct: settRes.data.stop_loss_pct })
      setCycle(cycleRes.data ?? null)
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) supabase.from("gestao_cycles").update({ user_id: user.id })
          .eq("device_id", did).is("user_id", null).then(() => {})
      })
    })
  }, [deviceId])

  // ── Start cycle ────────────────────────────────────────────────────────
  async function startCycle() {
    const amount = parseAmount(setupAmount)
    if (isNaN(amount) || amount <= 0 || !deviceId) return
    setSaving(true)
    const days = deriveDays(amount, generateDays(), settings)
    const { data } = await supabase.from("gestao_cycles")
      .insert({ device_id: deviceId, initial_amount: amount, days }).select("id,device_id,user_id,initial_amount,days,is_active,started_at").single()
    setCycle(data ?? null); setSetupAmount(""); setSaving(false)
  }

  // ── Mark day ───────────────────────────────────────────────────────────
  async function markDay(dayIndex: number, endAmount: number) {
    if (!cycle) return
    setSaving(true)
    try {
      const prevBalance = dayIndex === 0 ? cycle.initial_amount : cycle.days[dayIndex - 1].end_amount
      const status: DayStatus = deriveStatus(endAmount, prevBalance)
      const updated = cycle.days.map((d, i) => i === dayIndex ? { ...d, status, end_amount: endAmount } : d)
      const recalc = deriveDays(cycle.initial_amount, updated, settings)
      const { error } = await supabase.from("gestao_cycles").update({ days: recalc }).eq("id", cycle.id)
      if (error) throw error
      setCycle({ ...cycle, days: recalc }); setMarking(null)
      showToast("Dia registrado com sucesso!", "success")
    } catch { showToast("Erro ao salvar. Verifique a conexão.", "error") }
    finally { setSaving(false) }
  }

  // ── Adjust balance ─────────────────────────────────────────────────────
  async function adjustBalance(newAmount: number) {
    if (!cycle) return
    setSaving(true)
    const cdIdx = currentDayIndex(cycle.days)
    const prevIdx = cdIdx - 1
    let updatedDays: CycleDay[]
    let updatedInitial = cycle.initial_amount

    if (prevIdx < 0) { updatedInitial = newAmount; updatedDays = deriveDays(newAmount, cycle.days, settings) }
    else {
      const modified = cycle.days.map((d, i) => i === prevIdx ? { ...d, end_amount: newAmount } : d)
      updatedDays = deriveDays(cycle.initial_amount, modified, settings)
    }

    await supabase.from("gestao_cycles").update({ days: updatedDays, initial_amount: updatedInitial }).eq("id", cycle.id)
    setCycle({ ...cycle, days: updatedDays, initial_amount: updatedInitial })
    setAdjustOpen(false); setAdjustValue(""); setSaving(false)
  }

  // ── Close cycle ────────────────────────────────────────────────────────
  async function closeCycle() {
    if (!cycle) return
    if (!confirm("Encerrar o ciclo atual? Esta ação não pode ser desfeita.")) return
    setSaving(true)
    await supabase.from("gestao_cycles").update({ is_active: false, closed_at: new Date().toISOString() }).eq("id", cycle.id)
    setCycle(null); setSaving(false)
  }

  // ── Loading ────────────────────────────────────────────────────────────
  if (cycle === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "var(--brand-primary)" }} />
      </div>
    )
  }

  // ── Setup screen ───────────────────────────────────────────────────────
  if (cycle === null) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-5">
          <HeroCard>
            <div className="text-center space-y-4">
              <div style={{ fontSize: "40px", lineHeight: 1 }}>💰</div>
              <div>
                <h2 className="text-xl font-black" style={{ fontFamily: "var(--font-display)", color: "#fff", margin: 0 }}>
                  Quanto você tem de banca?
                </h2>
                <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", margin: "6px 0 0" }}>
                  Informe o valor inicial para começar seu ciclo de 30 dias.
                </p>
              </div>
              <input
                type="number" min={0} step="0.01" placeholder="0,00" autoFocus
                value={setupAmount}
                onChange={(e) => setSetupAmount(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && startCycle()}
                className="w-full rounded-2xl px-4 py-3 text-2xl font-bold font-mono text-center"
                style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", outline: "none" }}
              />
              <button onClick={startCycle} disabled={saving}
                className="w-full rounded-2xl py-3 text-sm font-bold hover:opacity-90 disabled:opacity-50"
                style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "none", cursor: "pointer" }}>
                {saving ? "Criando ciclo…" : "Começar ciclo →"}
              </button>
            </div>
          </HeroCard>
          <p className="text-center text-xs" style={{ color: "var(--text-muted)" }}>+18 · Jogue com responsabilidade.</p>
        </div>
      </div>
    )
  }

  // ── Derived values ─────────────────────────────────────────────────────
  const cdIdx = currentDayIndex(cycle.days)
  const balance = currentBalance(cycle.days, cycle.initial_amount)
  const pnl = balance - cycle.initial_amount
  const roi = ((balance / cycle.initial_amount) - 1) * 100
  const daysElapsed = cycle.days.filter((d) => d.status !== "pending").length
  const streak = daysElapsed
  const expectedBalance = cycle.initial_amount * Math.pow(1 + settings.stop_win_pct / 100, daysElapsed)
  const chartMaxDay = chartView === "realized" ? cdIdx : chartView === "7d" ? Math.min(cdIdx + 7, 29) : 29
  const chartData = buildChartData(cycle.days, cycle.initial_amount, chartMaxDay)

  function prevBalanceFor(dayIndex: number) {
    return dayIndex === 0 ? cycle!.initial_amount : cycle!.days[dayIndex - 1].end_amount
  }
  function openMarking(dayIndex: number, clickedStatus: "win" | "loss", defaultValue: string) {
    setMarking({ dayIndex, clickedStatus, inputValue: defaultValue })
  }

  // ── Cycle summary (cdIdx === -1) ───────────────────────────────────────
  if (cdIdx === -1) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 space-y-5">
        <div className="text-center space-y-2">
          <div style={{ fontSize: "52px", lineHeight: 1 }}>🏆</div>
          <h2 className="text-2xl font-black" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
            Ciclo de 30 dias concluído!
          </h2>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            {fmtDate(cycle.days[0].date)} → {fmtDate(cycle.days[29].date)}
          </p>
        </div>

        <HeroCard>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Saldo Final", value: fmtR(balance), color: "#fff" },
              { label: pnl >= 0 ? "Lucro total" : "Prejuízo total", value: `${pnl >= 0 ? "+" : ""}${fmtR(pnl)}`, color: pnl >= 0 ? "#4ade80" : "#f87171" },
              { label: "ROI", value: `${roi >= 0 ? "+" : ""}${roi.toFixed(1)}%`, color: pnl >= 0 ? "#4ade80" : "#f87171" },
              { label: "Dias de disciplina", value: String(streak), color: "#c084fc" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-2xl p-3 text-center"
                style={{ background: "rgba(255,255,255,0.08)" }}>
                <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>{label}</p>
                <p className="font-black tabular-nums" style={{ fontFamily: "var(--font-display)", color, fontSize: "18px" }}>{value}</p>
              </div>
            ))}
          </div>
        </HeroCard>

        <button
          onClick={async () => {
            setSaving(true)
            await supabase.from("gestao_cycles").update({ is_active: false, closed_at: new Date().toISOString() }).eq("id", cycle.id)
            setCycle(null); setSaving(false)
          }}
          disabled={saving}
          className="w-full rounded-2xl py-4 text-base font-bold hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--brand-primary)", color: "white", border: "none", cursor: "pointer" }}>
          {saving ? "Aguarde…" : "Iniciar novo ciclo →"}
        </button>
      </div>
    )
  }

  // ── Dashboard ──────────────────────────────────────────────────────────
  const currentDay = cycle.days[cdIdx]
  const winGain = balance * (settings.stop_win_pct / 100)
  const winTarget = balance + winGain
  const lossRisk = balance * (settings.stop_loss_pct / 100)
  const lossFloor = balance - lossRisk

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-4">

      {/* 1. HERO — Banca Atual ─────────────────────────────────────── */}
      <HeroCard>
        {/* Topo: label + anel de progresso */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "4px" }}>
          <div>
            <p className="label-caps" style={{ color: "rgba(255,255,255,0.55)" }}>Gestão de Banca</p>
            {/* Balance hero */}
            <p className="money-hero" style={{ color: "#fff", marginTop: "10px" }}>{fmtR(balance)}</p>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "12px", color: pnl >= 0 ? "#4ade80" : "#f87171", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                {pnl >= 0 ? "▲" : "▼"} {pnl >= 0 ? "+" : ""}{fmtR(pnl)} ({roi >= 0 ? "+" : ""}{roi.toFixed(1)}%)
              </span>
              {streak > 0 && (
                <span className="badge" style={{ background: "rgba(245,188,14,0.18)", color: "#fcd34d" }}>
                  🔥 {streak} {streak === 1 ? "dia" : "dias"}
                </span>
              )}
            </div>
          </div>
          {/* Anel do ciclo */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", flexShrink: 0 }}>
            <RingProgress value={cdIdx + 1} max={30} size={56} />
            <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.45)", textAlign: "center", lineHeight: 1.2 }}>
              Dia {cdIdx + 1}/30<br/>
              <span style={{ fontSize: "9px" }}>{fmtDate(currentDay.date)}</span>
            </span>
          </div>
        </div>

        {/* Metas do dia */}
        <div className="grid grid-cols-2 gap-2" style={{ marginTop: "20px" }}>
          <div className="rounded-2xl p-3" style={{ background: "rgba(74,222,128,0.10)" }}>
            <p style={{ fontSize: "10px", fontWeight: 700, color: "#4ade80", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "2px" }}>Meta de hoje</p>
            <p className="money-lg" style={{ color: "#4ade80" }}>+{fmtR(winGain)}</p>
            <p style={{ fontSize: "11px", color: "rgba(74,222,128,0.6)", marginTop: "2px" }}>até {fmtR(winTarget)}</p>
          </div>
          <div className="rounded-2xl p-3" style={{ background: "rgba(248,113,113,0.10)" }}>
            <p style={{ fontSize: "10px", fontWeight: 700, color: "#f87171", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "2px" }}>Limite de hoje</p>
            <p className="money-lg" style={{ color: "#f87171" }}>-{fmtR(lossRisk)}</p>
            <p style={{ fontSize: "11px", color: "rgba(248,113,113,0.6)", marginTop: "2px" }}>piso {fmtR(lossFloor)}</p>
          </div>
        </div>

        {/* Ações do dia */}
        <div style={{ marginTop: "16px" }}>
          {cycle.days[cdIdx]?.status !== "pending" ? (
            <div className="rounded-2xl p-3 text-center"
              style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)", fontSize: "14px", fontWeight: 600 }}>
              ✓ Dia {cdIdx + 1} registrado
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => openMarking(cdIdx, "win", winTarget.toFixed(2))}
                disabled={saving}
                className="rounded-2xl py-3 text-sm font-bold disabled:opacity-40 hover:opacity-90"
                style={{ background: "rgba(74,222,128,0.15)", color: "#4ade80", border: "none", cursor: "pointer" }}>
                ✅ Bati a meta
              </button>
              <button
                onClick={() => openMarking(cdIdx, "loss", lossFloor.toFixed(2))}
                disabled={saving}
                className="rounded-2xl py-3 text-sm font-bold disabled:opacity-40 hover:opacity-90"
                style={{ background: "rgba(248,113,113,0.15)", color: "#f87171", border: "none", cursor: "pointer" }}>
                🛑 Stop Loss
              </button>
            </div>
          )}
        </div>
      </HeroCard>

      {/* 2. MÉTRICAS ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Saldo atual", value: fmtR(balance), color: "var(--brand-secondary)" },
          { label: "Lucro acumulado", value: `${pnl >= 0 ? "+" : ""}${fmtR(pnl)}`, color: pnl >= 0 ? "#4ade80" : "#f87171" },
          { label: "ROI", value: `${roi >= 0 ? "+" : ""}${roi.toFixed(1)}%`, color: pnl >= 0 ? "#4ade80" : "#f87171" },
          { label: "Meta esperada", value: fmtR(expectedBalance), color: "var(--text-primary)", sub: `base: ${fmtR(cycle.initial_amount)}` },
        ].map(({ label, value, color, sub }) => (
          <div key={label} className="rounded-2xl p-4" style={{ background: "var(--surface-1)" }}>
            <p className="label-caps" style={{ marginBottom: "6px" }}>{label}</p>
            <p className="money-sm" style={{ color }}>{value}</p>
            {sub && <p style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>{sub}</p>}
          </div>
        ))}
      </div>

      {/* 3. GRÁFICO — carregado lazy (recharts em chunk separado) ─────── */}
      <BancaChart
        chartData={chartData}
        chartView={chartView}
        onViewChange={setChartView}
        balance={balance}
        initialAmount={cycle.initial_amount}
      />

      {/* 4. TABELA DE PLANEJAMENTO ────────────────────────────────── */}
      <div className="rounded-3xl overflow-hidden" style={{ background: "var(--surface-1)", boxShadow: "var(--shadow-sm)" }}>
        {/* Aviso simulação */}
        <div className="px-4 py-3" style={{ background: "rgba(245,188,14,0.07)", borderBottom: "1px solid rgba(245,188,14,0.12)" }}>
          <p style={{ fontSize: "11px", color: "#a07808" }}>
            <strong style={{ color: "#c09010" }}>⚠️ Simulação hipotética:</strong>{" "}
            Valores futuros são cenários matemáticos — não previsão nem promessa.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ background: "var(--surface-1)" }}>
            <thead>
              <tr style={{ background: "var(--surface-2)" }}>
                {["Dia", "Data", "Status", "Saldo final"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left label-caps" style={{ fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cycle.days.map((d, i) => {
                const isCurrentDay = i === cdIdx
                const canClick = d.status !== "pending" && !saving
                return (
                  <tr key={d.index}
                    onClick={() => { if (!canClick) return; openMarking(i, d.status as "win" | "loss", d.end_amount.toFixed(2)) }}
                    style={{
                      background: isCurrentDay ? "rgba(139,47,212,0.10)" : "transparent",
                      borderLeft: isCurrentDay ? "3px solid var(--brand-primary)" : "3px solid transparent",
                      cursor: canClick ? "pointer" : "default",
                    }}
                    title={canClick ? "Clique para corrigir" : undefined}>
                    <td className="px-3 py-2 font-mono text-xs" style={{ color: "var(--text-secondary)" }}>{i + 1}</td>
                    <td className="px-3 py-2 text-xs" style={{ color: "var(--text-secondary)" }}>{fmtDate(d.date)}</td>
                    <td className="px-3 py-2"><StatusBadge status={d.status} /></td>
                    <td className="px-3 py-2 font-mono text-xs"
                      style={{ color: d.status === "pending" ? "var(--text-muted)" : "var(--text-primary)", fontStyle: d.status === "pending" ? "italic" : "normal" }}>
                      {fmtR(d.end_amount)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. AÇÕES DO CICLO ────────────────────────────────────────── */}
      <div className="rounded-3xl p-4" style={{ background: "var(--surface-1)" }}>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button onClick={() => { setAdjustOpen(true); setAdjustValue("") }}
            className="rounded-xl px-4 py-2 text-xs font-semibold hover:opacity-80"
            style={{ background: "var(--surface-3)", color: "var(--text-secondary)", border: "none", cursor: "pointer" }}>
            Ajustar saldo
          </button>
          <button onClick={closeCycle} disabled={saving}
            className="rounded-xl px-4 py-2 text-xs font-semibold hover:opacity-80 disabled:opacity-40"
            style={{ background: "rgba(239,68,68,0.10)", color: "#f87171", border: "none", cursor: "pointer" }}>
            Encerrar ciclo
          </button>
        </div>
      </div>

      {/* Modais */}
      {marking && (
        <MarkingModal
          marking={marking}
          prevBalance={prevBalanceFor(marking.dayIndex)}
          isCorrecting={cycle.days[marking.dayIndex].status !== "pending"}
          dayLabel={marking.dayIndex + 1}
          onInputChange={(v) => setMarking({ ...marking, inputValue: v })}
          onConfirm={() => { const v = parseAmount(marking.inputValue); if (!isNaN(v) && v >= 0) markDay(marking.dayIndex, v) }}
          onCancel={() => setMarking(null)}
          saving={saving}
        />
      )}

      {adjustOpen && (
        <Modal title="Ajustar saldo real" onClose={() => setAdjustOpen(false)}>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Informe o saldo real atual da sua banca. O histórico anterior é mantido; os dias seguintes são recalculados.
          </p>
          <input
            type="number" min={0} step="0.01" placeholder="0,00" autoFocus
            value={adjustValue}
            onChange={(e) => setAdjustValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { const v = parseAmount(adjustValue); if (!isNaN(v) && v >= 0) adjustBalance(v) } }}
            className="w-full rounded-2xl px-4 py-3 text-xl font-bold font-mono"
            style={{ background: "var(--surface-3)", border: "none", color: "var(--text-primary)", outline: "none" }}
          />
          <div className="flex gap-3">
            <button onClick={() => setAdjustOpen(false)} className="flex-1 rounded-xl py-2.5 text-sm font-semibold"
              style={{ background: "var(--surface-3)", color: "var(--text-muted)", border: "none", cursor: "pointer" }}>
              Cancelar
            </button>
            <button onClick={() => { const v = parseAmount(adjustValue); if (!isNaN(v) && v >= 0) adjustBalance(v) }}
              disabled={saving} className="flex-1 rounded-xl py-2.5 text-sm font-bold disabled:opacity-40"
              style={{ background: "var(--brand-primary)", color: "white", border: "none", cursor: "pointer" }}>
              {saving ? "Salvando…" : "Confirmar"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
