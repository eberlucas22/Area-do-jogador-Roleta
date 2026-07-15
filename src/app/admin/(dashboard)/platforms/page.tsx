"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Trash2, Eye, EyeOff, ChevronUp, ChevronDown, Plus, X, Upload } from "lucide-react"

interface Platform {
  id: string
  name: string
  logo_path: string | null
  description: string | null
  benefits: string[]
  cta_url: string | null
  accent_color: string | null
  sort_order: number
  is_active: boolean
  logoUrl?: string
}

const blankForm = {
  name: "",
  description: "",
  benefits: [""],
  cta_url: "",
  accent_color: "",
}

export default function AdminPlatformsPage() {
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(blankForm)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const logoFileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState("")

  function getSupabase() { return createClient() }

  async function fetchPlatforms() {
    const supabase = getSupabase()
    const { data } = await supabase
      .from("platforms")
      .select("id,name,logo_path,description,benefits,cta_url,accent_color,sort_order,is_active")
      .order("sort_order")
    if (data) {
      setPlatforms(
        data.map((p) => ({
          ...p,
          logoUrl: p.logo_path
            ? supabase.storage.from("platforms").getPublicUrl(p.logo_path).data.publicUrl
            : undefined,
        }))
      )
    }
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => { fetchPlatforms() }, [])

  function setBenefit(idx: number, val: string) {
    const updated = [...form.benefits]
    updated[idx] = val
    setForm({ ...form, benefits: updated })
  }

  function addBenefit() {
    setForm({ ...form, benefits: [...form.benefits, ""] })
  }

  function removeBenefit(idx: number) {
    setForm({ ...form, benefits: form.benefits.filter((_, i) => i !== idx) })
  }

  async function handleAdd() {
    if (!form.name.trim()) { setError("Nome obrigatório."); return }
    setError("")
    setSaving(true)
    const supabase = getSupabase()

    let logo_path: string | null = null
    if (logoFile) {
      const ext = logoFile.name.split(".").pop() ?? "png"
      const path = `${Date.now()}-logo.${ext}`
      const { error: upErr } = await supabase.storage.from("platforms").upload(path, logoFile)
      if (upErr) { setError("Erro no upload do logo: " + upErr.message); setSaving(false); return }
      logo_path = path
    }

    const nextOrder = platforms.length > 0 ? Math.max(...platforms.map((p) => p.sort_order)) + 1 : 1
    await supabase.from("platforms").insert({
      name: form.name.trim(),
      logo_path,
      description: form.description.trim() || null,
      benefits: form.benefits.filter((b) => b.trim()),
      cta_url: form.cta_url.trim() || null,
      accent_color: form.accent_color.trim() || null,
      sort_order: nextOrder,
      is_active: true,
    })

    setForm(blankForm)
    setLogoFile(null)
    setSaving(false)
    fetchPlatforms()
  }

  async function toggleActive(p: Platform) {
    const supabase = getSupabase()
    await supabase.from("platforms").update({ is_active: !p.is_active }).eq("id", p.id)
    fetchPlatforms()
  }

  async function moveOrder(p: Platform, dir: "up" | "down") {
    const idx = platforms.findIndex((x) => x.id === p.id)
    const swapIdx = dir === "up" ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= platforms.length) return
    const swap = platforms[swapIdx]
    const supabase = getSupabase()
    await Promise.all([
      supabase.from("platforms").update({ sort_order: swap.sort_order }).eq("id", p.id),
      supabase.from("platforms").update({ sort_order: p.sort_order }).eq("id", swap.id),
    ])
    fetchPlatforms()
  }

  async function deletePlatform(p: Platform) {
    if (!confirm(`Excluir "${p.name}"?`)) return
    const supabase = getSupabase()
    if (p.logo_path) await supabase.storage.from("platforms").remove([p.logo_path])
    await supabase.from("platforms").delete().eq("id", p.id)
    fetchPlatforms()
  }

  const inputStyle = {
    width: "100%",
    padding: "8px 10px",
    borderRadius: "8px",
    backgroundColor: "var(--bg-elevated)",
    border: "1px solid var(--border-subtle)",
    color: "var(--text-primary)",
    fontSize: "13px",
    boxSizing: "border-box" as const,
    marginTop: "4px",
  }

  const card = {
    backgroundColor: "var(--bg-card)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "14px",
    padding: "16px",
  }

  return (
    <div style={{ padding: "24px 20px", maxWidth: "860px" }}>
      <h1 style={{ fontSize: "20px", fontWeight: 900, color: "var(--text-primary)", marginBottom: "24px", fontFamily: "var(--font-display)" }}>
        Plataformas
      </h1>

      {/* Add form */}
      <div style={{ ...card, marginBottom: "28px" }}>
        <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "14px" }}>
          Adicionar plataforma
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <label style={{ fontSize: "12px", color: "var(--text-muted)", gridColumn: "1/-1" }}>
            Nome *
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
          </label>
          <label style={{ fontSize: "12px", color: "var(--text-muted)", gridColumn: "1/-1" }}>
            Descrição
            <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={inputStyle} />
          </label>
          <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Link CTA
            <input type="url" value={form.cta_url} onChange={(e) => setForm({ ...form, cta_url: e.target.value })} placeholder="https://..." style={inputStyle} />
          </label>
          <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Cor de destaque (hex opcional)
            <input type="text" value={form.accent_color} onChange={(e) => setForm({ ...form, accent_color: e.target.value })} placeholder="#8b2fd4" style={inputStyle} />
          </label>
          <div style={{ gridColumn: "1/-1" }}>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px" }}>Logo (PNG/JPG, máx 1 MB)</p>
            <input
              ref={logoFileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/svg+xml"
              style={{ display: "none" }}
              onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => logoFileRef.current?.click()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px dashed var(--border-muted)",
                backgroundColor: "var(--bg-elevated)",
                color: "var(--text-secondary)",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Upload size={14} />
              {logoFile ? logoFile.name : "Selecionar logo"}
            </button>
          </div>
        </div>

        {/* Benefits */}
        <div style={{ marginTop: "12px" }}>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>Benefícios (um por linha)</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {form.benefits.map((b, i) => (
              <div key={i} style={{ display: "flex", gap: "6px" }}>
                <input
                  type="text"
                  value={b}
                  onChange={(e) => setBenefit(i, e.target.value)}
                  placeholder={`Benefício ${i + 1}`}
                  style={{ ...inputStyle, marginTop: 0, flex: 1 }}
                />
                {form.benefits.length > 1 && (
                  <button onClick={() => removeBenefit(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#f87171" }}>
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addBenefit}
              style={{ alignSelf: "flex-start", fontSize: "12px", color: "var(--brand-secondary)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
            >
              <Plus size={13} /> Adicionar benefício
            </button>
          </div>
        </div>

        {error && <p style={{ color: "#f87171", fontSize: "13px", marginTop: "8px" }}>{error}</p>}
        <button
          onClick={handleAdd}
          disabled={saving}
          style={{
            marginTop: "14px",
            padding: "9px 20px",
            borderRadius: "10px",
            backgroundColor: "var(--brand-primary)",
            color: "#fff",
            fontWeight: 700,
            fontSize: "13px",
            border: "none",
            cursor: saving ? "default" : "pointer",
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? "Salvando…" : "Adicionar"}
        </button>
      </div>

      {/* Platform list */}
      {loading ? (
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Carregando…</p>
      ) : platforms.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Nenhuma plataforma cadastrada.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {platforms.map((p, idx) => (
            <div
              key={p.id}
              style={{ ...card, display: "flex", gap: "14px", alignItems: "center", opacity: p.is_active ? 1 : 0.55 }}
            >
              <div style={{ width: "48px", height: "48px", borderRadius: "10px", backgroundColor: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                {p.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.logoUrl} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                ) : (
                  <span style={{ fontSize: "20px" }}>🏢</span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-primary)", margin: 0 }}>{p.name}</p>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "2px 0 0" }}>
                  {p.benefits.length} benefícios · {p.is_active ? "Ativo" : "Inativo"}
                </p>
              </div>
              <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                <button onClick={() => moveOrder(p, "up")} disabled={idx === 0} style={{ background: "none", border: "none", cursor: idx === 0 ? "default" : "pointer", color: "var(--text-muted)", opacity: idx === 0 ? 0.3 : 1 }}>
                  <ChevronUp size={18} />
                </button>
                <button onClick={() => moveOrder(p, "down")} disabled={idx === platforms.length - 1} style={{ background: "none", border: "none", cursor: idx === platforms.length - 1 ? "default" : "pointer", color: "var(--text-muted)", opacity: idx === platforms.length - 1 ? 0.3 : 1 }}>
                  <ChevronDown size={18} />
                </button>
                <button onClick={() => toggleActive(p)} style={{ background: "none", border: "none", cursor: "pointer", color: p.is_active ? "var(--brand-secondary)" : "var(--text-muted)" }}>
                  {p.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
                <button onClick={() => deletePlatform(p)} style={{ background: "none", border: "none", cursor: "pointer", color: "#f87171" }}>
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
