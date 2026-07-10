"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Trash2, Eye, EyeOff, ChevronUp, ChevronDown, Upload, Pencil, Check, X } from "lucide-react"

interface Banner {
  id: string
  image_path: string
  link_url: string | null
  sort_order: number
  is_active: boolean
  section: string
  imageUrl: string
}

const ACCEPTED = "image/jpeg,image/png,image/webp"
const MAX_BYTES = 5 * 1024 * 1024
const MAX_ACTIVE_PER_SECTION = 3

const SECTIONS = [
  { value: "global", label: "Global (todas as seções)" },
  { value: "banca", label: "Banca" },
  { value: "jogadas", label: "Jogadas" },
  { value: "historico", label: "Histórico" },
  { value: "videos", label: "Vídeos" },
  { value: "suporte", label: "Suporte" },
  { value: "regras", label: "Regras" },
]

const SECTION_LABELS: Record<string, string> = {
  global: "Global",
  banca: "Banca",
  jogadas: "Jogadas",
  historico: "Histórico",
  videos: "Vídeos",
  suporte: "Suporte",
  regras: "Regras",
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [linkInput, setLinkInput] = useState("")
  const [sectionInput, setSectionInput] = useState("global")
  const [error, setError] = useState("")
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null)
  const [editingLinkValue, setEditingLinkValue] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  function getSupabase() {
    return createClient()
  }

  async function fetchBanners() {
    const supabase = getSupabase()
    const { data } = await supabase
      .from("banners")
      .select("id,image_path,link_url,sort_order,is_active,section")
      .order("section")
      .order("sort_order")
    if (data) {
      setBanners(
        data.map((b) => ({
          ...b,
          section: b.section ?? "global",
          imageUrl: supabase.storage.from("banners").getPublicUrl(b.image_path).data.publicUrl,
        }))
      )
    }
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => { fetchBanners() }, [])

  async function handleUpload(file: File) {
    if (file.size > MAX_BYTES) { setError("Imagem muito grande (máx 5 MB)."); return }
    setError("")
    setUploading(true)
    const supabase = getSupabase()
    const ext = file.name.split(".").pop() ?? "jpg"
    const path = `${Date.now()}-banner.${ext}`

    const { error: upErr } = await supabase.storage.from("banners").upload(path, file)
    if (upErr) { setError("Erro no upload: " + upErr.message); setUploading(false); return }

    const nextOrder = banners.filter(b => b.section === sectionInput).length > 0
      ? Math.max(...banners.filter(b => b.section === sectionInput).map((b) => b.sort_order)) + 1
      : 1
    await supabase.from("banners").insert({
      image_path: path,
      link_url: linkInput.trim() || null,
      sort_order: nextOrder,
      is_active: true,
      section: sectionInput,
    })

    setLinkInput("")
    if (fileRef.current) fileRef.current.value = ""
    setUploading(false)
    fetchBanners()
  }

  async function toggleActive(b: Banner) {
    if (!b.is_active) {
      // Verificar limite de 3 ativos por seção
      const activeCount = banners.filter(
        (x) => x.section === b.section && x.is_active && x.id !== b.id
      ).length
      if (activeCount >= MAX_ACTIVE_PER_SECTION) {
        setError(
          `Limite de ${MAX_ACTIVE_PER_SECTION} banners ativos para "${SECTION_LABELS[b.section] ?? b.section}". Desative outro primeiro.`
        )
        return
      }
    }
    setError("")
    const supabase = getSupabase()
    await supabase.from("banners").update({ is_active: !b.is_active }).eq("id", b.id)
    fetchBanners()
  }

  async function moveOrder(b: Banner, dir: "up" | "down") {
    const sectionBanners = banners.filter((x) => x.section === b.section)
    const idx = sectionBanners.findIndex((x) => x.id === b.id)
    const swapIdx = dir === "up" ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sectionBanners.length) return
    const swap = sectionBanners[swapIdx]
    const supabase = getSupabase()
    await Promise.all([
      supabase.from("banners").update({ sort_order: swap.sort_order }).eq("id", b.id),
      supabase.from("banners").update({ sort_order: b.sort_order }).eq("id", swap.id),
    ])
    fetchBanners()
  }

  async function saveLink(b: Banner) {
    const supabase = getSupabase()
    await supabase.from("banners").update({ link_url: editingLinkValue.trim() || null }).eq("id", b.id)
    setEditingLinkId(null)
    fetchBanners()
  }

  async function deleteBanner(b: Banner) {
    if (!confirm("Excluir este banner?")) return
    const supabase = getSupabase()
    await supabase.storage.from("banners").remove([b.image_path])
    await supabase.from("banners").delete().eq("id", b.id)
    fetchBanners()
  }

  const card = {
    backgroundColor: "var(--bg-card)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "14px",
    padding: "16px",
  }

  // Agrupar banners por seção
  const grouped = SECTIONS.reduce((acc, { value }) => {
    acc[value] = banners.filter((b) => b.section === value)
    return acc
  }, {} as Record<string, Banner[]>)

  return (
    <div style={{ padding: "24px 20px", maxWidth: "860px" }}>
      <h1 style={{ fontSize: "20px", fontWeight: 900, color: "var(--text-primary)", marginBottom: "24px", fontFamily: "var(--font-display)" }}>
        Banners
      </h1>

      {/* Upload form */}
      <div style={{ ...card, marginBottom: "24px" }}>
        <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "12px" }}>
          Adicionar banner
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Seção
            <select
              value={sectionInput}
              onChange={(e) => setSectionInput(e.target.value)}
              style={{
                display: "block",
                width: "100%",
                marginTop: "6px",
                padding: "8px 10px",
                borderRadius: "8px",
                backgroundColor: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-primary)",
                fontSize: "13px",
                boxSizing: "border-box",
              }}
            >
              {SECTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Imagem (JPG/PNG/WebP, máx 5 MB)
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPTED}
              style={{ display: "block", marginTop: "6px", fontSize: "13px", color: "var(--text-primary)" }}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleUpload(f)
              }}
            />
          </label>
          <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Link (opcional — abre em nova aba ao clicar)
            <input
              type="url"
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              placeholder="https://..."
              style={{
                display: "block",
                width: "100%",
                marginTop: "6px",
                padding: "8px 10px",
                borderRadius: "8px",
                backgroundColor: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-primary)",
                fontSize: "13px",
                boxSizing: "border-box",
              }}
            />
          </label>
          {error && <p style={{ color: "#f87171", fontSize: "13px" }}>{error}</p>}
          {uploading && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", fontSize: "13px" }}>
              <Upload size={14} /> Enviando…
            </div>
          )}
        </div>
      </div>

      {/* Banner list grouped by section */}
      {loading ? (
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Carregando…</p>
      ) : banners.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Nenhum banner cadastrado.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {SECTIONS.map(({ value, label }) => {
            const sectionBanners = grouped[value] ?? []
            if (sectionBanners.length === 0) return null
            const activeCount = sectionBanners.filter((b) => b.is_active).length
            return (
              <div key={value}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                  <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {label}
                  </p>
                  <span style={{
                    fontSize: "11px",
                    color: activeCount >= MAX_ACTIVE_PER_SECTION ? "#f59e0b" : "var(--text-muted)",
                    backgroundColor: "var(--bg-elevated)",
                    padding: "2px 8px",
                    borderRadius: "99px",
                    border: "1px solid var(--border-subtle)",
                  }}>
                    {activeCount}/{MAX_ACTIVE_PER_SECTION} ativos
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {sectionBanners.map((b, idx) => (
                    <div
                      key={b.id}
                      style={{
                        ...card,
                        display: "flex",
                        gap: "14px",
                        alignItems: "center",
                        opacity: b.is_active ? 1 : 0.55,
                      }}
                    >
                      {/* Thumbnail */}
                      <div style={{ flexShrink: 0, width: "120px", aspectRatio: "1600/420", borderRadius: "8px", overflow: "hidden", backgroundColor: "var(--bg-elevated)" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={b.imageUrl} alt="banner" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>
                          Ordem #{b.sort_order} · {b.is_active ? "Ativo" : "Inativo"}
                        </p>
                        {editingLinkId === b.id ? (
                          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                            <input
                              type="url"
                              value={editingLinkValue}
                              onChange={(e) => setEditingLinkValue(e.target.value)}
                              placeholder="https://..."
                              autoFocus
                              style={{
                                flex: 1,
                                padding: "5px 8px",
                                borderRadius: "6px",
                                backgroundColor: "var(--bg-elevated)",
                                border: "1px solid var(--border-muted)",
                                color: "var(--text-primary)",
                                fontSize: "12px",
                              }}
                              onKeyDown={(e) => { if (e.key === "Enter") saveLink(b); if (e.key === "Escape") setEditingLinkId(null) }}
                            />
                            <button onClick={() => saveLink(b)} title="Salvar"
                              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--brand-secondary)" }}>
                              <Check size={16} />
                            </button>
                            <button onClick={() => setEditingLinkId(null)} title="Cancelar"
                              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <p style={{ fontSize: "11px", color: b.link_url ? "var(--brand-secondary)" : "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                              {b.link_url ?? "Sem link"}
                            </p>
                            <button
                              onClick={() => { setEditingLinkId(b.id); setEditingLinkValue(b.link_url ?? "") }}
                              title="Editar link"
                              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", flexShrink: 0 }}
                            >
                              <Pencil size={13} />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                        <button
                          onClick={() => moveOrder(b, "up")}
                          disabled={idx === 0}
                          title="Mover para cima"
                          style={{ background: "none", border: "none", cursor: idx === 0 ? "default" : "pointer", color: "var(--text-muted)", opacity: idx === 0 ? 0.3 : 1 }}
                        >
                          <ChevronUp size={18} />
                        </button>
                        <button
                          onClick={() => moveOrder(b, "down")}
                          disabled={idx === sectionBanners.length - 1}
                          title="Mover para baixo"
                          style={{ background: "none", border: "none", cursor: idx === sectionBanners.length - 1 ? "default" : "pointer", color: "var(--text-muted)", opacity: idx === sectionBanners.length - 1 ? 0.3 : 1 }}
                        >
                          <ChevronDown size={18} />
                        </button>
                        <button
                          onClick={() => toggleActive(b)}
                          title={b.is_active ? "Desativar" : "Ativar"}
                          style={{ background: "none", border: "none", cursor: "pointer", color: b.is_active ? "var(--brand-secondary)" : "var(--text-muted)" }}
                        >
                          {b.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
                        </button>
                        <button
                          onClick={() => deleteBanner(b)}
                          title="Excluir"
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#f87171" }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
