"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Plus, Trash2, Upload, X, ImagePlus, Image, Edit2, Check } from "lucide-react"

interface Material {
  id: string
  title: string
  description: string
  file_path: string
  cover_path: string | null
  sort_order: number
  created_at: string
}

const MAX_PDF_MB = 20
const MAX_COVER_MB = 5

const supabase = createClient()

// ─── PDF → cover thumbnail (pdfjs-dist, client only) ─────────────────────
async function generatePdfThumbnail(file: File): Promise<Blob | null> {
  try {
    const pdfjs = await import("pdfjs-dist")
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url
    ).toString()

    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
    const page = await pdf.getPage(1)

    const targetWidth = 1200
    const baseViewport = page.getViewport({ scale: 1 })
    const scale = targetWidth / baseViewport.width
    const viewport = page.getViewport({ scale })

    const canvas = document.createElement("canvas")
    canvas.width = Math.round(viewport.width)
    canvas.height = Math.round(viewport.height)

    const ctx = canvas.getContext("2d")
    if (!ctx) return null

    await page.render({ canvasContext: ctx, viewport }).promise

    return new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.85))
  } catch {
    return null
  }
}

function mimeToExt(type: string) {
  if (type === "image/webp") return "webp"
  if (type === "image/png") return "png"
  return "jpg"
}

// ─── Cover thumbnail UI (small preview) ──────────────────────────────────
function CoverThumb({ url, size = 56 }: { url: string | null; size?: number }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt="capa"
        style={{
          width: size, height: Math.round(size * (9 / 16)),
          objectFit: "cover",
          borderRadius: "0.375rem",
          border: "1px solid rgba(139,47,212,0.25)",
          flexShrink: 0,
        }}
      />
    )
  }
  return (
    <div
      style={{
        width: size, height: Math.round(size * (9 / 16)),
        borderRadius: "0.375rem",
        background: "linear-gradient(135deg, #0f0020, #3b1466)",
        border: "1px solid rgba(139,47,212,0.2)",
        flexShrink: 0,
      }}
    />
  )
}

// ═══════════════════════════════════════════════════════════════════════════
export default function AdminMateriaisPage() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── New material form state ────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [generatedCover, setGeneratedCover] = useState<Blob | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [generatingThumb, setGeneratingThumb] = useState(false)
  const [uploading, setUploading] = useState(false)

  const pdfRef = useRef<HTMLInputElement>(null)
  const coverRef = useRef<HTMLInputElement>(null)

  // edit state (title + description only)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ title: "", description: "" })
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState("")

  const loadMaterials = useCallback(async () => {
    const { data } = await supabase
      .from("materials")
      .select("id,title,description,file_path,cover_path,sort_order,created_at")
      .order("sort_order")
    setMaterials(data ?? [])
    setLoading(false)
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadMaterials() }, [loadMaterials])

  function getPublicUrl(path: string) {
    return supabase.storage.from("materials").getPublicUrl(path).data.publicUrl
  }

  // ── PDF selection + auto-thumbnail ────────────────────────────────────
  async function handlePdfChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.type !== "application/pdf") { setError("Apenas arquivos PDF são aceitos."); return }
    if (f.size > MAX_PDF_MB * 1024 * 1024) { setError(`PDF: máx. ${MAX_PDF_MB} MB.`); return }
    setError(null)
    setPdfFile(f)

    // Auto-generate thumbnail only if no manual cover selected
    if (!coverFile) {
      setGeneratingThumb(true)
      const blob = await generatePdfThumbnail(f)
      if (blob) {
        setGeneratedCover(blob)
        const prev = URL.createObjectURL(blob)
        setCoverPreview(prev)
      }
      setGeneratingThumb(false)
    }
  }

  // ── Manual cover selection ────────────────────────────────────────────
  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
      setError("Capa: apenas JPG, PNG ou WebP.")
      return
    }
    if (f.size > MAX_COVER_MB * 1024 * 1024) { setError(`Capa: máx. ${MAX_COVER_MB} MB.`); return }
    setError(null)
    setCoverFile(f)
    setGeneratedCover(null) // manual overrides generated
    const prev = URL.createObjectURL(f)
    setCoverPreview(prev)
  }

  function removeCoverPreview() {
    setCoverFile(null)
    setGeneratedCover(null)
    setCoverPreview(null)
    if (coverRef.current) coverRef.current.value = ""
  }

  // ── Upload new material ───────────────────────────────────────────────
  async function handleUpload() {
    if (!title.trim()) { setError("Título é obrigatório."); return }
    if (!pdfFile) { setError("Selecione um arquivo PDF."); return }
    setUploading(true)
    setError(null)

    // 1. Upload PDF
    const pdfName = `${Date.now()}-${pdfFile.name.replace(/\s+/g, "-")}`
    const { error: pdfErr } = await supabase.storage.from("materials").upload(pdfName, pdfFile)
    if (pdfErr) { setError(pdfErr.message); setUploading(false); return }

    // 2. Insert DB record
    const { data: inserted, error: dbErr } = await supabase
      .from("materials")
      .insert({
        title: title.trim(),
        description: description.trim(),
        file_path: pdfName,
        sort_order: (materials.length + 1) * 10,
      })
      .select("id")
      .single()
    if (dbErr || !inserted) { setError(dbErr?.message ?? "Erro ao salvar."); setUploading(false); return }

    // 3. Upload cover (manual > auto-generated)
    const coverBlob: Blob | null = coverFile ?? generatedCover
    if (coverBlob) {
      const ext = coverFile ? mimeToExt(coverFile.type) : "webp"
      const coverName = `covers/${inserted.id}-cover.${ext}`
      const { error: covErr } = await supabase.storage
        .from("materials")
        .upload(coverName, coverBlob, { upsert: true })
      if (!covErr) {
        await supabase.from("materials").update({ cover_path: coverName }).eq("id", inserted.id)
      }
    }

    await loadMaterials()
    setShowForm(false)
    resetForm()
    setUploading(false)
  }

  function resetForm() {
    setTitle("")
    setDescription("")
    setPdfFile(null)
    setCoverFile(null)
    setGeneratedCover(null)
    setCoverPreview(null)
    setError(null)
    if (pdfRef.current) pdfRef.current.value = ""
    if (coverRef.current) coverRef.current.value = ""
  }

  // ── Inline edit (title + description) ────────────────────────────────
  function openEdit(mat: Material) {
    setEditingId(mat.id)
    setEditForm({ title: mat.title, description: mat.description ?? "" })
    setEditError("")
  }

  function cancelEdit() {
    setEditingId(null)
    setEditError("")
  }

  async function saveEdit() {
    if (!editForm.title.trim()) { setEditError("Título obrigatório."); return }
    setEditSaving(true)
    const { error: dbErr } = await supabase
      .from("materials")
      .update({ title: editForm.title.trim(), description: editForm.description.trim() })
      .eq("id", editingId!)
    if (dbErr) { setEditError(dbErr.message); setEditSaving(false); return }
    setEditingId(null)
    setEditSaving(false)
    await loadMaterials()
  }

  // ── Delete material ───────────────────────────────────────────────────
  async function handleDelete(mat: Material) {
    if (!confirm(`Excluir "${mat.title}"?`)) return
    const toRemove = [mat.file_path]
    if (mat.cover_path) toRemove.push(mat.cover_path)
    await supabase.storage.from("materials").remove(toRemove)
    await supabase.from("materials").delete().eq("id", mat.id)
    await loadMaterials()
  }

  // ── Replace cover for existing material ──────────────────────────────
  async function handleCoverReplace(mat: Material, file: File | undefined) {
    if (!file) return
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Capa: apenas JPG, PNG ou WebP.")
      return
    }
    if (file.size > MAX_COVER_MB * 1024 * 1024) { setError(`Capa: máx. ${MAX_COVER_MB} MB.`); return }

    // Remove old cover file from storage
    if (mat.cover_path) {
      await supabase.storage.from("materials").remove([mat.cover_path])
    }

    const ext = mimeToExt(file.type)
    const coverName = `covers/${mat.id}-cover-${Date.now()}.${ext}`
    const { error: uploadErr } = await supabase.storage.from("materials").upload(coverName, file)
    if (uploadErr) { setError(uploadErr.message); return }

    await supabase.from("materials").update({ cover_path: coverName }).eq("id", mat.id)
    await loadMaterials()
    setError(null)
  }

  // ── Remove cover from existing material ──────────────────────────────
  async function handleCoverRemove(mat: Material) {
    if (!mat.cover_path) return
    if (!confirm("Remover capa? Será usado o fallback visual.")) return
    await supabase.storage.from("materials").remove([mat.cover_path])
    await supabase.from("materials").update({ cover_path: null }).eq("id", mat.id)
    await loadMaterials()
  }

  // ─────────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-2xl font-black"
          style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
        >
          Materiais (PDFs)
        </h1>
        <button
          onClick={() => { setShowForm(true); setError(null) }}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all hover:opacity-90"
          style={{ backgroundColor: "var(--brand-primary)", color: "white" }}
        >
          <Plus size={16} /> Adicionar PDF
        </button>
      </div>

      {/* ── New material form ── */}
      {showForm && (
        <div
          className="rounded-2xl p-5 mb-6 space-y-4"
          style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-muted)" }}
        >
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
              Novo material
            </h2>
            <button onClick={() => { setShowForm(false); resetForm() }}>
              <X size={18} style={{ color: "var(--text-muted)" }} />
            </button>
          </div>

          {error && (
            <p
              className="text-sm px-3 py-2 rounded-lg"
              style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#ef4444" }}
            >
              {error}
            </p>
          )}

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              Título *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-sm"
              style={{
                backgroundColor: "var(--bg-input)",
                border: "1px solid var(--border-muted)",
                color: "var(--text-primary)",
                outline: "none",
              }}
              placeholder="Ex: Guia de Gestão de Banca"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-xl px-3 py-2 text-sm resize-none"
              style={{
                backgroundColor: "var(--bg-input)",
                border: "1px solid var(--border-muted)",
                color: "var(--text-primary)",
                outline: "none",
              }}
            />
          </div>

          {/* PDF upload */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              Arquivo PDF (máx. {MAX_PDF_MB} MB) *
            </label>
            <div
              className="rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer transition-all hover:opacity-80"
              style={{
                backgroundColor: "var(--bg-input)",
                border: `2px dashed ${pdfFile ? "var(--brand-primary)" : "var(--border-muted)"}`,
              }}
              onClick={() => pdfRef.current?.click()}
            >
              <Upload size={20} style={{ color: pdfFile ? "var(--brand-primary)" : "var(--text-muted)" }} />
              <p className="text-sm" style={{ color: pdfFile ? "var(--brand-secondary)" : "var(--text-muted)" }}>
                {pdfFile ? pdfFile.name : "Clique para selecionar PDF"}
              </p>
              <input
                ref={pdfRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handlePdfChange}
              />
            </div>
          </div>

          {/* Cover image upload */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              Imagem de capa{" "}
              <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
                — opcional · JPG/PNG/WebP, máx. {MAX_COVER_MB} MB · recomendado 1200×675 (16:9)
              </span>
            </label>

            {coverPreview ? (
              <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverPreview}
                  alt="pré-visualização da capa"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                {generatingThumb && (
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                  >
                    <span className="text-xs text-white">Gerando capa…</span>
                  </div>
                )}
                <button
                  onClick={removeCoverPreview}
                  className="absolute top-2 right-2 rounded-full p-1"
                  style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "white" }}
                  title="Remover capa"
                >
                  <X size={14} />
                </button>
                <span
                  className="absolute bottom-2 left-2 text-xs px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: "rgba(0,0,0,0.6)",
                    color: "var(--text-secondary)",
                    fontSize: "0.625rem",
                  }}
                >
                  {coverFile ? "capa manual" : "thumbnail automático"}
                </span>
              </div>
            ) : (
              <div
                className="rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer transition-all hover:opacity-80"
                style={{
                  backgroundColor: "var(--bg-input)",
                  border: "2px dashed var(--border-subtle)",
                }}
                onClick={() => coverRef.current?.click()}
              >
                {generatingThumb ? (
                  <>
                    <div
                      className="h-5 w-5 rounded-full border-2 border-t-transparent animate-spin"
                      style={{ borderColor: "var(--brand-primary)" }}
                    />
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Gerando thumbnail da página 1…
                    </p>
                  </>
                ) : (
                  <>
                    <ImagePlus size={20} style={{ color: "var(--text-muted)" }} />
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Clique para enviar capa — ou será gerada automaticamente do PDF
                    </p>
                  </>
                )}
              </div>
            )}
            <input
              ref={coverRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleCoverChange}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setShowForm(false); resetForm() }}
              className="flex-1 rounded-xl py-2.5 text-sm font-medium"
              style={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-muted)",
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "var(--brand-primary)", color: "white" }}
            >
              <Upload size={15} />
              {uploading ? "Enviando…" : "Enviar"}
            </button>
          </div>
        </div>
      )}

      {/* ── Materials list ── */}
      {error && !showForm && (
        <p
          className="text-sm px-3 py-2 rounded-lg mb-4"
          style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#ef4444" }}
        >
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-center py-10 text-sm" style={{ color: "var(--text-muted)" }}>
          Carregando…
        </p>
      ) : materials.length === 0 ? (
        <p className="text-center py-10 text-sm" style={{ color: "var(--text-muted)" }}>
          Nenhum material cadastrado.
        </p>
      ) : (
        <div className="space-y-3">
          {materials.map((mat) => {
            const coverUrl = mat.cover_path ? getPublicUrl(mat.cover_path) : null
            const covInputId = `cover-input-${mat.id}`

            const isEditing = editingId === mat.id
            return (
              <div
                key={mat.id}
                className="rounded-2xl p-4"
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div className="flex items-start gap-4">
                  {/* Cover thumbnail */}
                  <CoverThumb url={coverUrl} size={80} />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <input
                          value={editForm.title}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          autoFocus
                          placeholder="Título *"
                          className="w-full rounded-lg px-2 py-1.5 text-sm"
                          style={{
                            backgroundColor: "var(--bg-card)",
                            border: "1px solid var(--border-muted)",
                            color: "var(--text-primary)",
                            outline: "none",
                          }}
                        />
                        <textarea
                          value={editForm.description}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          rows={2}
                          placeholder="Descrição"
                          className="w-full rounded-lg px-2 py-1.5 text-xs resize-none"
                          style={{
                            backgroundColor: "var(--bg-card)",
                            border: "1px solid var(--border-muted)",
                            color: "var(--text-primary)",
                            outline: "none",
                          }}
                        />
                        {editError && <p style={{ color: "#f87171", fontSize: "11px" }}>{editError}</p>}
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            onClick={saveEdit}
                            disabled={editSaving}
                            style={{
                              display: "flex", alignItems: "center", gap: "4px",
                              padding: "5px 12px", borderRadius: "7px",
                              backgroundColor: "var(--brand-primary)", color: "#fff",
                              fontWeight: 700, fontSize: "12px", border: "none",
                              cursor: editSaving ? "default" : "pointer", opacity: editSaving ? 0.6 : 1,
                            }}
                          >
                            <Check size={13} /> {editSaving ? "Salvando…" : "Salvar"}
                          </button>
                          <button
                            onClick={cancelEdit}
                            style={{
                              display: "flex", alignItems: "center", gap: "4px",
                              padding: "5px 10px", borderRadius: "7px",
                              backgroundColor: "var(--bg-card)", color: "var(--text-muted)",
                              fontSize: "12px", border: "1px solid var(--border-subtle)", cursor: "pointer",
                            }}
                          >
                            <X size={13} /> Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p
                          className="font-semibold text-sm truncate"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {mat.title}
                        </p>
                        {mat.description && (
                          <p
                            className="text-xs truncate mt-0.5"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {mat.description}
                          </p>
                        )}
                        <a
                          href={getPublicUrl(mat.file_path)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs transition-opacity hover:opacity-80 mt-1 inline-block"
                          style={{ color: "var(--brand-primary)" }}
                        >
                          Abrir PDF ↗
                        </a>
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {!isEditing && (
                      <button
                        onClick={() => openEdit(mat)}
                        className="p-2 rounded-lg hover:opacity-80"
                        style={{ color: "var(--brand-secondary)" }}
                        title="Editar título/descrição"
                      >
                        <Edit2 size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => mat && handleDelete(mat)}
                      className="p-2 rounded-lg hover:opacity-80"
                      style={{ color: "var(--danger)" }}
                      title="Excluir material"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Cover management row */}
                <div
                  className="mt-3 pt-3 flex items-center gap-3 flex-wrap"
                  style={{ borderTop: "1px solid var(--border-subtle)" }}
                >
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {/* eslint-disable-next-line jsx-a11y/alt-text */}
                    <Image size={12} className="inline mr-1" />
                    Capa:
                  </span>

                  {/* Hidden file input per material */}
                  <input
                    id={covInputId}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      handleCoverReplace(mat, e.target.files?.[0])
                      e.target.value = ""
                    }}
                  />

                  <button
                    onClick={() => document.getElementById(covInputId)?.click()}
                    className="text-xs px-2.5 py-1 rounded-lg transition-opacity hover:opacity-80"
                    style={{
                      backgroundColor: "rgba(139,47,212,0.12)",
                      color: "var(--brand-secondary)",
                      border: "1px solid rgba(139,47,212,0.25)",
                    }}
                  >
                    {mat.cover_path ? "Trocar capa" : "Enviar capa"}
                  </button>

                  {mat.cover_path && (
                    <button
                      onClick={() => handleCoverRemove(mat)}
                      className="text-xs px-2.5 py-1 rounded-lg transition-opacity hover:opacity-80"
                      style={{
                        backgroundColor: "rgba(239,68,68,0.08)",
                        color: "var(--danger)",
                        border: "1px solid rgba(239,68,68,0.2)",
                      }}
                    >
                      Remover capa
                    </button>
                  )}

                  {!mat.cover_path && (
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      fallback visual ativo
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
