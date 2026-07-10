"use client"

// Componente isolado para lazy loading de recharts — importado via next/dynamic em HistoricoModule
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts"

const PIE_COLORS = ["#b91c1c", "#4a4a4a", "#166534"]

const tooltipStyle = {
  backgroundColor: "var(--surface-3)",
  border: "none",
  borderRadius: "10px",
  fontSize: "11px",
  color: "var(--text-primary)",
  boxShadow: "var(--shadow-md)",
}

interface HistoricoChartsProps {
  freqData: { n: string; count: number; fill: string }[]
  pieData: { name: string; value: number }[]
  totalCount: number
}

export function HistoricoCharts({ freqData, pieData, totalCount }: HistoricoChartsProps) {
  return (
    <>
      {/* Frequência */}
      <div className="rounded-3xl p-5" style={{ backgroundColor: "var(--surface-1)" }}>
        <p className="label-caps mb-4">Frequência por número (0–36)</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={freqData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
            <XAxis dataKey="n" tick={{ fontSize: 8, fill: "var(--text-muted)" }} interval={2} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 9, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={tooltipStyle}
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
              formatter={(v) => [v, "vezes"]}
              labelFormatter={(l) => `Número ${l}`}
            />
            <Bar dataKey="count" radius={[3, 3, 0, 0]}>
              {freqData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Distribuição cores */}
      <div className="rounded-3xl p-5" style={{ backgroundColor: "var(--surface-1)" }}>
        <p className="label-caps mb-4">Distribuição de cores</p>
        <div className="flex items-center gap-6 justify-center flex-wrap">
          <ResponsiveContainer width={160} height={160}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={72} paddingAngle={3} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v, name) => [
                  typeof v === "number" ? `${v} (${((v / totalCount) * 100).toFixed(1)}%)` : String(v),
                  String(name),
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="h-3 w-3 rounded-sm shrink-0" style={{ backgroundColor: PIE_COLORS[i] }} />
                <span style={{ color: "var(--text-secondary)" }}>{d.name}</span>
                <span className="font-bold tabular-nums ml-1" style={{ color: "var(--text-primary)" }}>
                  {totalCount > 0 ? ((d.value / totalCount) * 100).toFixed(1) : "0.0"}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
