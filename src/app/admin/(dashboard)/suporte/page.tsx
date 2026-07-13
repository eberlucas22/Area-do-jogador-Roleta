"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Trash2, Eye, EyeOff, ChevronUp, ChevronDown, Edit2, Check, X } from "lucide-react"

interface Channel {
  id: string
  name: string
  channel_type: string
  url: string
  image_path: string | null
  sort_order: number
  is_active: boolean
  imageUrl?: string
}

const CHANNEL_TYPES = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "telegram", label: "Telegram" },
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube" },
  { value: "outro", label: "Outro" },
]

const blankForm = { name: "", channel_type: "whatsapp", url: "" }

export default function AdminSuportePage() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(blankForm)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  // edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: "", channel_type: "whatsapp", url: "" })
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState("")

  function getSupabase() { return createClient() }

  async function fetchChannels() {
    const supabase = getSupabase()
    const { data } = await supabase
      .from("support_channels")
      .select("id,name,channel_type,url,image_path,sort_order,is_active")
      .order("sort_order")
    if (data) {
      setChannels(
        data.map((c) => ({
          ...c,
          imageUrl: c.image_path
            ? supabase.storage.from("support").getPublicUrl(c.image_path).data.publicUrl
            : undefined,
        }))
      )
    }
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => { fetchChannels() }, [])

  async function handleAdd() {
    if (!form.name.trim()) { setError("Nome obrigatório."); return }
    if (!form.url.trim()) { setError("URL obrigatória."); return }
    setError("")
    setSaving(true)
    const supabase = getSupabase()

    let image_path: string | null = null
    if (imageFile) {
      const ext = imageFile.name.split(".").pop() ?? "jpg"
      const path = `${Date.now()}-channel.${ext}`
      const { error: upErr } = await supabase.storage.from("support").upload(path, imageFile)
      if (upErr) { setError("Erro no upload: " + upErr.message); setSaving(false); return }
      image_path = path
    }

    const nextOrder = channels.length > 0 ? Math.max(...channels.map((c) => c.sort_order)) + 1 : 1
    await supabase.from("support_channels").insert({
      name: form.name.trim(),
      channel_type: form.channel_type,
      url: form.url.trim(),
      image_path,
      sort_order: nextOrder,
      is_active: true,
    })

    setForm(blankForm)
    setImageFile(null)
    if (fileRef.current) fileRef.current.value = ""
    setSaving(false)
    fetchChannels()
  }

  async function toggleActive(c: Channel) {
    await getSupabase().from("support_channels").update({ is_active: !c.is_active }).eq("id", c.id)
    fetchChannels()
  }

  async function moveOrder(c: Channel, dir: "up" | "down") {
    const idx = channels.findIndex((x) => x.id === c.id)
    const swapIdx = dir === "up" ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= channels.length) return
    const swap = channels[swapIdx]
    const supabase = getSupabase()
    await Promise.all([
      supabase.from("support_channels").update({ sort_order: swap.sort_order }).eq("id", c.id),
      supabase.from("support_channels").update({ sort_order: c.sort_order }).eq("id", swap.id),
    ])
    fetchChannels()
  }

  function openEdit(c: Channel) {
    setEditingId(c.id)
    setEditForm({ name: c.name, channel_type: c.channel_type, url: c.url })
    setEditError("")
  }

  function cancelEdit() {
    setEditingId(null)
    setEditError("")
  }

  async function saveEdit() {
    if (!editForm.name.trim()) { setEditError("Nome obrigatório."); return }
    if (!editForm.url.trim()) { setEditError("URL obrigatória."); return }
    setEditSaving(true)
    const { error: dbErr } = await getSupabase()
      .from("support_channels")
      .update({ name: editForm.name.trim(), channel_type: editForm.channel_type, url: editForm.url.trim() })
      .eq("id", editingId!)
    if (dbErr) { setEditError(dbErr.message); setEditSaving(false); return }
    setEditingId(null)
    setEditSaving(false)
    fetchChannels()
  }

  async function deleteChannel(c: Channel) {
    if (!confirm(`Excluir canal "${c.name}"?`)) return
    const supabase = getSupabase()
    if (c.image_path) await supabase.storage.from("support").remove([c.image_path])
    await supabase.from("support_channels").delete().eq("id", c.id)
    fetchChannels()
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

  const card = { backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "14px", padding: "16px" }

  const typeIcon: Record<string, string> = {
    whatsapp: "💬",
    telegram: "✈️",
    instagram: "📸",
    youtube: "▶️",
    outro: "🔗",
  }

  return (
    <div style={{ padding: "24px 20px", maxWidth: "760px" }}>
      <h1 style={{ fontSize: "20px", fontWeight: 900, color: "var(--text-primary)", marginBottom: "24px", fontFamily: "var(--font-display)" }}>
        Suporte
      </h1>

      {/* Add form */}
      <div style={{ ...card, marginBottom: "24px" }}>
        <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "12px" }}>Adicionar canal</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <label style={{ fontSize: "12px", color: "var(--text-muted)", gridColumn: "1/-1" }}>
            Nome *
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
          </label>
          <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Tipo de canal *
            <select
              value={form.channel_type}
              onChange={(e) => setForm({ ...form, channel_type: e.target.value })}
              style={{ ...inputStyle }}
            >
              {CHANNEL_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </label>
          <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            URL / Link *
            <input type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." style={inputStyle} />
          </label>
          <label style={{ fontSize: "12px", color: "var(--text-muted)", gridColumn: "1/-1" }}>
            Imagem customizada (opcional)
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              style={{ display: "block", marginTop: "4px", fontSize: "13px", color: "var(--text-primary)" }}
            />
          </label>
        </div>
        {error && <p style={{ color: "#f87171", fontSize: "13px", marginTop: "8px" }}>{error}</p>}
        <button
          onClick={handleAdd}
          disabled={saving}
          style={{
            marginTop: "12px",
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

      {/* Channel list */}
      {loading ? (
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Carregando…</p>
      ) : channels.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Nenhum canal cadastrado.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {channels.map((c, idx) => {
            const isEditing = editingId === c.id
            return (
              <div key={c.id} style={{ ...card, opacity: c.is_active ? 1 : 0.55 }}>
                {isEditing ? (
                  /* ── Edit mode ── */
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      <label style={{ fontSize: "12px", color: "var(--text-muted)", gridColumn: "1/-1" }}>
                        Nome *
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          style={{ ...inputStyle }}
                          autoFocus
                        />
                      </label>
                      <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        Tipo
                        <select
                          value={editForm.channel_type}
                          onChange={(e) => setEditForm({ ...editForm, channel_type: e.target.value })}
                          style={{ ...inputStyle }}
                        >
                          {CHANNEL_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                      </label>
                      <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        URL *
                        <input
                          type="url"
                          value={editForm.url}
                          onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                          placeholder="https://..."
                          style={{ ...inputStyle }}
                        />
                      </label>
                    </div>
                    {editError && <p style={{ color: "#f87171", fontSize: "12px" }}>{editError}</p>}
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={saveEdit}
                        disabled={editSaving}
                        style={{
                          display: "flex", alignItems: "center", gap: "6px",
                          padding: "7px 16px", borderRadius: "8px",
                          backgroundColor: "var(--brand-primary)", color: "#fff",
                          fontWeight: 700, fontSize: "13px", border: "none",
                          cursor: editSaving ? "default" : "pointer", opacity: editSaving ? 0.6 : 1,
                        }}
                      >
                        <Check size={14} /> {editSaving ? "Salvando…" : "Salvar"}
                      </button>
                      <button
                        onClick={cancelEdit}
                        style={{
                          display: "flex", alignItems: "center", gap: "6px",
                          padding: "7px 14px", borderRadius: "8px",
                          backgroundColor: "var(--bg-elevated)", color: "var(--text-muted)",
                          fontSize: "13px", border: "1px solid var(--border-subtle)", cursor: "pointer",
                        }}
                      >
                        <X size={14} /> Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── Display mode ── */
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", fontSize: "20px" }}>
                      {c.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        typeIcon[c.channel_type] ?? "🔗"
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-primary)", margin: 0 }}>{c.name}</p>
                      <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "2px 0 0" }}>
                        {CHANNEL_TYPES.find((t) => t.value === c.channel_type)?.label ?? c.channel_type} · {c.is_active ? "Ativo" : "Inativo"}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                      <button onClick={() => moveOrder(c, "up")} disabled={idx === 0} style={{ background: "none", border: "none", cursor: idx === 0 ? "default" : "pointer", color: "var(--text-muted)", opacity: idx === 0 ? 0.3 : 1, padding: "4px" }}>
                        <ChevronUp size={18} />
                      </button>
                      <button onClick={() => moveOrder(c, "down")} disabled={idx === channels.length - 1} style={{ background: "none", border: "none", cursor: idx === channels.length - 1 ? "default" : "pointer", color: "var(--text-muted)", opacity: idx === channels.length - 1 ? 0.3 : 1, padding: "4px" }}>
                        <ChevronDown size={18} />
                      </button>
                      <button onClick={() => openEdit(c)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--brand-secondary)", padding: "4px" }} title="Editar">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => toggleActive(c)} style={{ background: "none", border: "none", cursor: "pointer", color: c.is_active ? "var(--brand-secondary)" : "var(--text-muted)", padding: "4px" }}>
                        {c.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>
                      <button onClick={() => deleteChannel(c)} style={{ background: "none", border: "none", cursor: "pointer", color: "#f87171", padding: "4px" }}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
