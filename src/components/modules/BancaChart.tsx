"use client"

// Componente isolado para lazy loading de recharts — importado via next/dynamic em BancaModule
import {
  ComposedChart, Line, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from "recharts"

type ChartView = "realized" | "7d" | "30d"
type ChartPt = { day: string; actual: number | null; projected: number | null }

function fmtR(v: number) { return `R$ ${v.toFixed(2)}` }
function fmtRShort(v: number) {
  if (v >= 1000) return `R$${(v / 1000).toFixed(1)}k`
  return `R$${v.toFixed(0)}`
}

interface BancaChartProps {
  chartData: ChartPt[]
  chartView: ChartView
  onViewChange: (v: ChartView) => void
  balance: number
  initialAmount: number
}

export function BancaChart({ chartData, chartView, onViewChange, balance, initialAmount }: BancaChartProps) {
  return (
    <div className="rounded-3xl p-5" style={{ background: "var(--surface-1)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
        <p className="label-caps">Evolução do ciclo</p>
        <div className="chip-group">
          {(["realized", "7d", "30d"] as const).map((v) => (
            <button key={v} onClick={() => onViewChange(v)}
              className={`chip-item${chartView === v ? " active" : ""}`}>
              {v === "realized" ? "Realizado" : v}
            </button>
          ))}
        </div>
      </div>

      <div style={{ position: "relative" }}>
        <div style={{
          position: "absolute", top: 4, right: 4, zIndex: 2,
          background: "var(--surface-3)", borderRadius: "99px",
          padding: "3px 10px", fontSize: "11px", fontWeight: 700,
          color: "var(--brand-secondary)", boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
        }}>
          {fmtR(balance)}
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="bancaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b2fd4" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#8b2fd4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.03)" />
            <ReferenceLine y={initialAmount} stroke="rgba(255,255,255,0.10)" strokeDasharray="4 4" />
            <XAxis dataKey="day" tick={{ fontSize: 9, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 9, fill: "var(--text-muted)" }} tickLine={false} axisLine={false}
              tickFormatter={(v) => fmtRShort(Number(v))} width={56} />
            <Tooltip
              contentStyle={{ background: "var(--surface-3)", border: "none", borderRadius: "12px", color: "var(--text-primary)", fontSize: "12px", boxShadow: "var(--shadow-md)" }}
              formatter={(v) => [typeof v === "number" ? fmtR(v) : v]}
            />
            <Area type="monotone" dataKey="actual" fill="url(#bancaGrad)" stroke="none" connectNulls={false} />
            <Line type="monotone" dataKey="actual" stroke="var(--brand-primary)" strokeWidth={3}
              dot={{ r: 3, fill: "var(--brand-primary)", strokeWidth: 0 }} activeDot={{ r: 5, fill: "var(--brand-secondary)" }}
              connectNulls={false} name="Realizado" />
            <Line type="monotone" dataKey="projected" stroke="var(--brand-secondary)"
              strokeWidth={1.5} strokeDasharray="5 4" dot={false} connectNulls={false} name="Projeção" opacity={0.4} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
