"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Plus, Trash2, Edit2, X, Check } from "lucide-react"

interface Play {
  id: string
  name: string
  description: string
  risk_level: "Baixo" | "Médio" | "Alto"
  numbers: number[]
  sort_order: number
}

const RED_NUMBERS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36])
const TABLE_ROWS = [
  [3,6,9,12,15,18,21,24,27,30,33,36],
  [2,5,8,11,14,17,20,23,26,29,32,35],
  [1,4,7,10,13,16,19,22,25,28,31,34],
]

function getColor(n: number) {
  if (n === 0) return "green"
  return RED_NUMBERS.has(n) ? "red" : "black"
}

const RISK_COLORS = {
  "Baixo": { bg: "rgba(34,197,94,0.15)", color: "#22c55e", border: "rgba(34,197,94,0.3)" },
  "Médio": { bg: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "rgba(245,158,11,0.3)" },
  "Alto":  { bg: "rgba(239,68,68,0.15)", color: "#ef4444", border: "rgba(239,68,68,0.3)" },
}

function MiniRouletteSelector({ selected, onChange }: { selected: number[]; onChange: (n: number[]) => void }) {
  const selSet = new Set(selected)

  function toggle(n: number) {
    if (selSet.has(n)) onChange(selected.filter((x) => x !== n))
    else onChange([...selected, n])
  }

  const CW = 30, CH = 32, ZW = 34
  const totalW = ZW + 12 * CW
  const totalH = 3 * CH

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
          Clique para selecionar números ({selected.length} selecionados)
        </p>
        {selected.length > 0 && (
          <button onClick={() => onChange([])} className="text-xs" style={{ color: "var(--text-muted)" }}>
            Limpar
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${totalW} ${totalH}`}
          style={{ minWidth: "280px", maxWidth: "480px", width: "100%", cursor: "pointer" }}
        >
          {/* 0 */}
          {(() => {
            const isSel = selSet.has(0)
            return (
              <g onClick={() => toggle(0)}>
                <rect x={1} y={1} width={ZW-2} height={totalH-2} rx={4}
                  fill={isSel ? "#5b21b6" : "#166534"}
                  stroke={isSel ? "#c084fc" : "#1a5c2a"} strokeWidth={isSel ? 2 : 1} />
                <text x={ZW/2} y={totalH/2} textAnchor="middle" dominantBaseline="middle"
                  fill={isSel ? "#c084fc" : "white"} fontSize={12} fontWeight="bold">0</text>
              </g>
            )
          })()}
          {TABLE_ROWS.map((row, ri) =>
            row.map((num, ci) => {
              const x = ZW + ci * CW, y = ri * CH
              const color = getColor(num)
              const isSel = selSet.has(num)
              const fillBase = color === "red" ? "#9b1c1c" : "#2a2a2a"
              const fillSel = "#5b21b6"
              return (
                <g key={num} onClick={() => toggle(num)} style={{ cursor: "pointer" }}>
                  <rect x={x+0.5} y={y+0.5} width={CW-1} height={CH-1} rx={2}
                    fill={isSel ? fillSel : fillBase}
                    stroke={isSel ? "#c084fc" : (color === "red" ? "#7f1d1d" : "#444")}
                    strokeWidth={isSel ? 2 : 1} />
                  <text x={x+CW/2} y={y+CH/2} textAnchor="middle" dominantBaseline="middle"
                    fill={isSel ? "#c084fc" : "white"} fontSize={9}
                    fontWeight={isSel ? "bold" : "normal"}>
                    {num}
                  </text>
                </g>
              )
            })
          )}
        </svg>
      </div>
    </div>
  )
}

const EMPTY_FORM = { name: "", description: "", risk_level: "Médio" as Play["risk_level"], numbers: [] as number[] }

export default function AdminJogadasPage() {
  const [plays, setPlays] = useState<Play[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const loadPlays = useCallback(async () => {
    const { data } = await supabase.from("plays").select("id,name,description,risk_level,numbers,sort_order").order("sort_order")
    setPlays(data ?? [])
    setLoading(false)
  }, [supabase])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadPlays() }, [loadPlays])

  function openCreate() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowForm(true)
    setError(null)
  }

  function openEdit(play: Play) {
    setForm({ name: play.name, description: play.description, risk_level: play.risk_level, numbers: [...play.numbers] })
    setEditingId(play.id)
    setShowForm(true)
    setError(null)
  }

  async function handleSave() {
    if (!form.name.trim()) { setError("Nome é obrigatório."); return }
    setSaving(true)
    setError(null)

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      risk_level: form.risk_level,
      numbers: form.numbers,
      sort_order: editingId ? plays.find(p => p.id === editingId)?.sort_order ?? 0 : (plays.length + 1) * 10,
    }

    let err = null
    if (editingId) {
      const res = await supabase.from("plays").update(payload).eq("id", editingId)
      err = res.error
    } else {
      const res = await supabase.from("plays").insert(payload)
      err = res.error
    }

    if (err) { setError(err.message); setSaving(false); return }
    await loadPlays()
    setShowForm(false)
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta jogada?")) return
    await supabase.from("plays").delete().eq("id", id)
    await loadPlays()
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
          Jogadas
        </h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all hover:opacity-90"
          style={{ backgroundColor: "var(--brand-primary)", color: "white" }}
        >
          <Plus size={16} /> Nova jogada
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div
          className="rounded-2xl p-5 mb-6 space-y-4"
          style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-muted)" }}
        >
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
              {editingId ? "Editar jogada" : "Nova jogada"}
            </h2>
            <button onClick={() => setShowForm(false)}><X size={18} style={{ color: "var(--text-muted)" }} /></button>
          </div>

          {error && (
            <p className="text-sm px-3 py-2 rounded-lg" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
              {error}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Nome *</label>
              <input
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full rounded-xl px-3 py-2 text-sm"
                style={{ backgroundColor: "var(--bg-input)", border: "1px solid var(--border-muted)", color: "var(--text-primary)", outline: "none" }}
                placeholder="Ex: Coluna 3 + Vermelho"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Nível de risco</label>
              <select
                value={form.risk_level}
                onChange={(e) => setForm(f => ({ ...f, risk_level: e.target.value as Play["risk_level"] }))}
                className="w-full rounded-xl px-3 py-2 text-sm"
                style={{ backgroundColor: "var(--bg-input)", border: "1px solid var(--border-muted)", color: "var(--text-primary)", outline: "none" }}
              >
                <option value="Baixo">Baixo</option>
                <option value="Médio">Médio</option>
                <option value="Alto">Alto</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Descrição</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full rounded-xl px-3 py-2 text-sm resize-none"
              style={{ backgroundColor: "var(--bg-input)", border: "1px solid var(--border-muted)", color: "var(--text-primary)", outline: "none" }}
            />
          </div>

          <MiniRouletteSelector
            selected={form.numbers}
            onChange={(n) => setForm(f => ({ ...f, numbers: n }))}
          />

          <div className="flex gap-3 pt-1">
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 rounded-xl py-2.5 text-sm font-medium"
              style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "var(--brand-primary)", color: "white" }}
            >
              <Check size={16} />
              {saving ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <p className="text-center py-10 text-sm" style={{ color: "var(--text-muted)" }}>Carregando…</p>
      ) : plays.length === 0 ? (
        <p className="text-center py-10 text-sm" style={{ color: "var(--text-muted)" }}>Nenhuma jogada cadastrada.</p>
      ) : (
        <div className="space-y-3">
          {plays.map((play) => {
            const risk = RISK_COLORS[play.risk_level]
            return (
              <div
                key={play.id}
                className="rounded-2xl p-4 flex items-start gap-4"
                style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{play.name}</span>
                    <span
                      className="text-xs font-bold rounded-full px-2 py-0.5"
                      style={{ backgroundColor: risk.bg, color: risk.color, border: `1px solid ${risk.border}` }}
                    >
                      {play.risk_level}
                    </span>
                  </div>
                  {play.description && (
                    <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{play.description}</p>
                  )}
                  <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                    {play.numbers.length} números: {play.numbers.slice(0, 12).join(", ")}{play.numbers.length > 12 ? "…" : ""}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => openEdit(play)} className="p-2 rounded-lg hover:opacity-80" style={{ color: "var(--brand-secondary)" }}>
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => handleDelete(play.id)} className="p-2 rounded-lg hover:opacity-80" style={{ color: "var(--danger)" }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
