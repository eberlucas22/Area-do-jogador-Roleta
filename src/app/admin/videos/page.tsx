"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Trash2, Eye, EyeOff, ChevronUp, ChevronDown, Edit2, Check, X } from "lucide-react"

interface Video {
  id: string
  youtube_url: string
  video_id: string
  title: string | null
  sort_order: number
  is_active: boolean
}

function extractVideoId(url: string): string | null {
  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/)
  if (watchMatch) return watchMatch[1]
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)
  if (shortMatch) return shortMatch[1]
  const shortsMatch = url.match(/\/shorts\/([a-zA-Z0-9_-]{11})/)
  if (shortsMatch) return shortsMatch[1]
  return null
}

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [urlInput, setUrlInput] = useState("")
  const [titleInput, setTitleInput] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  // edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ youtube_url: "", title: "" })
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState("")

  function getSupabase() { return createClient() }

  async function fetchVideos() {
    const { data } = await getSupabase()
      .from("videos")
      .select("id,youtube_url,video_id,title,sort_order,is_active")
      .order("sort_order")
    if (data) setVideos(data)
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => { fetchVideos() }, [])

  async function handleAdd() {
    const vid = extractVideoId(urlInput.trim())
    if (!vid) { setError("URL do YouTube inválida. Use formato watch?v=, youtu.be/ ou /shorts/"); return }
    setError("")
    setSaving(true)
    const supabase = getSupabase()
    const nextOrder = videos.length > 0 ? Math.max(...videos.map((v) => v.sort_order)) + 1 : 1
    const { error: dbErr } = await supabase.from("videos").insert({
      youtube_url: urlInput.trim(),
      video_id: vid,
      title: titleInput.trim() || null,
      sort_order: nextOrder,
      is_active: true,
    })
    if (dbErr) { setError("Erro ao salvar: " + dbErr.message); setSaving(false); return }
    setUrlInput("")
    setTitleInput("")
    setSaving(false)
    fetchVideos()
  }

  function openEdit(v: Video) {
    setEditingId(v.id)
    setEditForm({ youtube_url: v.youtube_url, title: v.title ?? "" })
    setEditError("")
  }

  function cancelEdit() {
    setEditingId(null)
    setEditError("")
  }

  async function saveEdit() {
    const vid = extractVideoId(editForm.youtube_url.trim())
    if (!vid) { setEditError("URL inválida"); return }
    setEditSaving(true)
    const { error: dbErr } = await getSupabase()
      .from("videos")
      .update({ youtube_url: editForm.youtube_url.trim(), video_id: vid, title: editForm.title.trim() || null })
      .eq("id", editingId!)
    if (dbErr) { setEditError(dbErr.message); setEditSaving(false); return }
    setEditingId(null)
    setEditSaving(false)
    fetchVideos()
  }

  async function toggleActive(v: Video) {
    await getSupabase().from("videos").update({ is_active: !v.is_active }).eq("id", v.id)
    fetchVideos()
  }

  async function moveOrder(v: Video, dir: "up" | "down") {
    const idx = videos.findIndex((x) => x.id === v.id)
    const swapIdx = dir === "up" ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= videos.length) return
    const swap = videos[swapIdx]
    const supabase = getSupabase()
    await Promise.all([
      supabase.from("videos").update({ sort_order: swap.sort_order }).eq("id", v.id),
      supabase.from("videos").update({ sort_order: v.sort_order }).eq("id", swap.id),
    ])
    fetchVideos()
  }

  async function deleteVideo(v: Video) {
    if (!confirm("Excluir este vídeo?")) return
    await getSupabase().from("videos").delete().eq("id", v.id)
    fetchVideos()
  }

  const inputStyle = {
    width: "100%",
    padding: "7px 10px",
    borderRadius: "8px",
    backgroundColor: "var(--bg-elevated)",
    border: "1px solid var(--border-muted)",
    color: "var(--text-primary)",
    fontSize: "13px",
    boxSizing: "border-box" as const,
    outline: "none",
  }

  const card = { backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "14px", padding: "16px" }

  return (
    <div style={{ padding: "24px 20px", maxWidth: "760px" }}>
      <h1 style={{ fontSize: "20px", fontWeight: 900, color: "var(--text-primary)", marginBottom: "24px", fontFamily: "var(--font-display)" }}>
        Vídeos
      </h1>

      {/* Add form */}
      <div style={{ ...card, marginBottom: "24px" }}>
        <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "12px" }}>Adicionar vídeo</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            URL do YouTube *
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              style={{ ...inputStyle, marginTop: "4px" }}
            />
          </label>
          <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Título (opcional)
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              style={{ ...inputStyle, marginTop: "4px" }}
            />
          </label>
          {error && <p style={{ color: "#f87171", fontSize: "13px" }}>{error}</p>}
          <button
            onClick={handleAdd}
            disabled={saving || !urlInput.trim()}
            style={{
              alignSelf: "flex-start",
              padding: "9px 20px",
              borderRadius: "10px",
              backgroundColor: "var(--brand-primary)",
              color: "#fff",
              fontWeight: 700,
              fontSize: "13px",
              border: "none",
              cursor: saving ? "default" : "pointer",
              opacity: saving || !urlInput.trim() ? 0.6 : 1,
            }}
          >
            {saving ? "Salvando…" : "Adicionar"}
          </button>
        </div>
      </div>

      {/* Video list */}
      {loading ? (
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Carregando…</p>
      ) : videos.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Nenhum vídeo cadastrado.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {videos.map((v, idx) => {
            const isEditing = editingId === v.id
            return (
              <div key={v.id} style={{ ...card, opacity: v.is_active ? 1 : 0.55 }}>
                {isEditing ? (
                  /* ── Edit mode ── */
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      URL do YouTube *
                      <input
                        type="url"
                        value={editForm.youtube_url}
                        onChange={(e) => setEditForm({ ...editForm, youtube_url: e.target.value })}
                        style={{ ...inputStyle, marginTop: "4px" }}
                        autoFocus
                      />
                    </label>
                    <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      Título
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        style={{ ...inputStyle, marginTop: "4px" }}
                      />
                    </label>
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
                    <div style={{ flexShrink: 0, width: "90px", aspectRatio: "16/9", borderRadius: "8px", overflow: "hidden", backgroundColor: "#000" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://i.ytimg.com/vi/${v.video_id}/mqdefault.jpg`}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: "13px", color: "var(--text-primary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {v.title ?? <span style={{ color: "var(--text-muted)" }}>Sem título</span>}
                      </p>
                      <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "2px 0 0" }}>
                        ID: {v.video_id} · {v.is_active ? "Ativo" : "Inativo"}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                      <button onClick={() => moveOrder(v, "up")} disabled={idx === 0} style={{ background: "none", border: "none", cursor: idx === 0 ? "default" : "pointer", color: "var(--text-muted)", opacity: idx === 0 ? 0.3 : 1, padding: "4px" }}>
                        <ChevronUp size={18} />
                      </button>
                      <button onClick={() => moveOrder(v, "down")} disabled={idx === videos.length - 1} style={{ background: "none", border: "none", cursor: idx === videos.length - 1 ? "default" : "pointer", color: "var(--text-muted)", opacity: idx === videos.length - 1 ? 0.3 : 1, padding: "4px" }}>
                        <ChevronDown size={18} />
                      </button>
                      <button onClick={() => openEdit(v)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--brand-secondary)", padding: "4px" }} title="Editar">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => toggleActive(v)} style={{ background: "none", border: "none", cursor: "pointer", color: v.is_active ? "var(--brand-secondary)" : "var(--text-muted)", padding: "4px" }}>
                        {v.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>
                      <button onClick={() => deleteVideo(v)} style={{ background: "none", border: "none", cursor: "pointer", color: "#f87171", padding: "4px" }}>
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
