"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Save, Upload, RotateCcw } from "lucide-react"

const BUCKET = "branding"
const ACCEPTED = "image/jpeg,image/png,image/webp,image/svg+xml"
const MAX_BYTES = 5 * 1024 * 1024
const DEFAULT_LOGO = "/banners/logo-rick.png"
const DEFAULT_NAME = "Rick Roleta"

// ── Auto-trim: remove margens transparentes do PNG antes do upload ────────────
// Varre os pixels pelo canvas, encontra o bounding box do conteúdo não-transparente
// e recorta com 2px de margem de segurança.
// Para JPG (sem canal alpha) devolve o arquivo original sem alteração.
async function trimTransparentEdges(file: File): Promise<File> {
  const isRasterWithAlpha = file.type === "image/png" || file.type === "image/webp"
  if (!isRasterWithAlpha) return file   // jpg ou svg: sem transparência para recortar

  return new Promise((resolve) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const canvas = document.createElement("canvas")
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(img, 0, 0)

      const { width, height } = canvas
      const data = ctx.getImageData(0, 0, width, height).data

      // Encontrar bounding box dos pixels não-transparentes (alpha > 0)
      let top = height, bottom = 0, left = width, right = 0
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const alpha = data[(y * width + x) * 4 + 3]
          if (alpha > 0) {
            if (y < top)    top    = y
            if (y > bottom) bottom = y
            if (x < left)   left   = x
            if (x > right)  right  = x
          }
        }
      }

      // Sem conteúdo visível: devolver original
      if (top > bottom || left > right) { resolve(file); return }

      // Margem de segurança de 2px
      const PAD = 2
      const x0 = Math.max(0, left   - PAD)
      const y0 = Math.max(0, top    - PAD)
      const x1 = Math.min(width,  right  + PAD + 1)
      const y1 = Math.min(height, bottom + PAD + 1)
      const w  = x1 - x0
      const h  = y1 - y0

      // Se o recorte é idêntico ao original (sem margens), devolver original
      if (w === width && h === height) { resolve(file); return }

      const trimmed = document.createElement("canvas")
      trimmed.width  = w
      trimmed.height = h
      trimmed.getContext("2d")!.drawImage(canvas, x0, y0, w, h, 0, 0, w, h)

      trimmed.toBlob((blob) => {
        if (!blob) { resolve(file); return }
        resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".png"), { type: "image/png" }))
      }, "image/png")
    }
    img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file) }
    img.src = objectUrl
  })
}

export default function AdminConfiguracoesPage() {
  // ── Stop percentuais ──────────────────────────────────────────────────────
  const [stopWin, setStopWin] = useState("10")
  const [stopLoss, setStopLoss] = useState("40")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Branding ──────────────────────────────────────────────────────────────
  const [logoPath, setLogoPath] = useState<string | null>(null)
  const [logoCompactPath, setLogoCompactPath] = useState<string | null>(null)
  const [appName, setAppName] = useState(DEFAULT_NAME)
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null)
  const [logoCompactPreviewUrl, setLogoCompactPreviewUrl] = useState<string | null>(null)
  const [brandingSaving, setBrandingSaving] = useState(false)
  const [brandingSaved, setBrandingSaved] = useState(false)
  const [brandingError, setBrandingError] = useState<string | null>(null)
  const [logoUploading, setLogoUploading] = useState(false)
  const [compactUploading, setCompactUploading] = useState(false)

  const logoFileRef = useRef<HTMLInputElement>(null)
  const compactFileRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  function getPublicUrl(path: string) {
    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
  }

  useEffect(() => {
    supabase
      .from("settings")
      .select("stop_win_pct,stop_loss_pct,logo_path,logo_compact_path,app_name")
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) {
          setStopWin(String(data.stop_win_pct))
          setStopLoss(String(data.stop_loss_pct))
          setAppName(data.app_name || DEFAULT_NAME)
          if (data.logo_path) {
            setLogoPath(data.logo_path)
            setLogoPreviewUrl(getPublicUrl(data.logo_path))
          }
          if (data.logo_compact_path) {
            setLogoCompactPath(data.logo_compact_path)
            setLogoCompactPreviewUrl(getPublicUrl(data.logo_compact_path))
          }
        }
        setLoading(false)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSave() {
    const sw = parseFloat(stopWin)
    const sl = parseFloat(stopLoss)
    if (isNaN(sw) || sw <= 0 || sw > 100) { setError("Stop Win deve estar entre 1 e 100."); return }
    if (isNaN(sl) || sl <= 0 || sl > 100) { setError("Stop Loss deve estar entre 1 e 100."); return }

    setSaving(true); setError(null); setSaved(false)
    const { error: err } = await supabase
      .from("settings")
      .update({ stop_win_pct: sw, stop_loss_pct: sl, updated_at: new Date().toISOString() })
      .gte("id", 0)

    if (err) { setError(err.message) }
    else { setSaved(true); setTimeout(() => setSaved(false), 2500) }
    setSaving(false)
  }

  // ── Upload logo principal ─────────────────────────────────────────────────
  async function handleLogoUpload(file: File) {
    if (file.size > MAX_BYTES) { setBrandingError("Arquivo muito grande (máx 5 MB)."); return }
    setBrandingError(null)
    setLogoUploading(true)

    // Trim automático de margens transparentes
    const trimmed = await trimTransparentEdges(file)

    // Preview local da versão JÁ recortada
    const objectUrl = URL.createObjectURL(trimmed)
    setLogoPreviewUrl(objectUrl)

    // Remove arquivo antigo
    if (logoPath) await supabase.storage.from(BUCKET).remove([logoPath])

    const path = `${Date.now()}-logo.png`
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, trimmed, { contentType: "image/png" })
    if (upErr) { setBrandingError("Erro no upload: " + upErr.message); setLogoUploading(false); return }

    await supabase.from("settings").update({ logo_path: path }).gte("id", 0)
    setLogoPath(path)
    setLogoPreviewUrl(getPublicUrl(path))
    if (logoFileRef.current) logoFileRef.current.value = ""
    setLogoUploading(false)
  }

  // ── Upload ícone compacto ─────────────────────────────────────────────────
  async function handleCompactUpload(file: File) {
    if (file.size > MAX_BYTES) { setBrandingError("Arquivo muito grande (máx 5 MB)."); return }
    setBrandingError(null)
    setCompactUploading(true)

    const trimmed = await trimTransparentEdges(file)

    const objectUrl = URL.createObjectURL(trimmed)
    setLogoCompactPreviewUrl(objectUrl)

    if (logoCompactPath) await supabase.storage.from(BUCKET).remove([logoCompactPath])

    const path = `${Date.now()}-icon.png`
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, trimmed, { contentType: "image/png" })
    if (upErr) { setBrandingError("Erro no upload: " + upErr.message); setCompactUploading(false); return }

    await supabase.from("settings").update({ logo_compact_path: path }).gte("id", 0)
    setLogoCompactPath(path)
    setLogoCompactPreviewUrl(getPublicUrl(path))
    if (compactFileRef.current) compactFileRef.current.value = ""
    setCompactUploading(false)
  }

  // ── Salvar nome do app ────────────────────────────────────────────────────
  async function handleBrandingSave() {
    if (!appName.trim()) { setBrandingError("Nome do app não pode ser vazio."); return }
    setBrandingError(null)
    setBrandingSaving(true)
    const { error: err } = await supabase
      .from("settings")
      .update({ app_name: appName.trim() })
      .gte("id", 0)
    if (err) { setBrandingError(err.message) }
    else { setBrandingSaved(true); setTimeout(() => setBrandingSaved(false), 2500) }
    setBrandingSaving(false)
  }

  // ── Restaurar padrão ──────────────────────────────────────────────────────
  async function handleRestoreDefaults() {
    if (!confirm("Restaurar logo e nome padrão? Os arquivos enviados serão removidos.")) return
    setBrandingError(null)
    setBrandingSaving(true)

    const paths: string[] = []
    if (logoPath) paths.push(logoPath)
    if (logoCompactPath) paths.push(logoCompactPath)
    if (paths.length > 0) await supabase.storage.from(BUCKET).remove(paths)

    await supabase
      .from("settings")
      .update({ logo_path: null, logo_compact_path: null, app_name: DEFAULT_NAME })
      .gte("id", 0)

    setLogoPath(null)
    setLogoCompactPath(null)
    setLogoPreviewUrl(null)
    setLogoCompactPreviewUrl(null)
    setAppName(DEFAULT_NAME)
    if (logoFileRef.current) logoFileRef.current.value = ""
    if (compactFileRef.current) compactFileRef.current.value = ""
    setBrandingSaving(false)
    setBrandingSaved(true)
    setTimeout(() => setBrandingSaved(false), 2500)
  }

  if (loading) return (
    <div className="flex items-center justify-center p-12">
      <div className="h-6 w-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--brand-primary)" }} />
    </div>
  )

  const cardStyle = {
    borderRadius: "16px",
    padding: "24px",
    backgroundColor: "var(--bg-elevated)",
    border: "1px solid var(--border-muted)",
  }

  const inputStyle: React.CSSProperties = {
    display: "block",
    width: "100%",
    padding: "10px 12px",
    borderRadius: "10px",
    backgroundColor: "var(--bg-input)",
    border: "1px solid var(--border-muted)",
    color: "var(--text-primary)",
    fontSize: "13px",
    boxSizing: "border-box",
    outline: "none",
    marginTop: "6px",
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6 space-y-6">
      <h1 className="text-2xl font-black" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
        Configurações
      </h1>

      {/* ── Stop percentuais ───────────────────────────────────────────────── */}
      <div style={cardStyle} className="space-y-6">
        <div>
          <h2 className="text-base font-bold mb-4" style={{ color: "var(--text-primary)" }}>
            Percentuais de Stop
          </h2>
          <p className="text-xs mb-5" style={{ color: "var(--text-muted)" }}>
            Estes percentuais são aplicados sobre a banca atual do jogador (cálculo composto diário).
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "#22c55e" }}>
                Stop Win (%)
              </label>
              <input
                type="number" min={1} max={100} step={0.1}
                value={stopWin} onChange={(e) => setStopWin(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm font-mono"
                style={{ backgroundColor: "var(--bg-input)", border: "1px solid var(--border-muted)", color: "var(--text-primary)", outline: "none" }}
              />
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                Padrão: 10% → banca × 1,{stopWin.padStart(2, "0")}
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "#ef4444" }}>
                Stop Loss (%)
              </label>
              <input
                type="number" min={1} max={100} step={0.1}
                value={stopLoss} onChange={(e) => setStopLoss(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm font-mono"
                style={{ backgroundColor: "var(--bg-input)", border: "1px solid var(--border-muted)", color: "var(--text-primary)", outline: "none" }}
              />
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                Padrão: 40% → piso = banca × 0,60
              </p>
            </div>
          </div>
        </div>

        {error && (
          <p className="text-sm px-3 py-2 rounded-lg" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
            {error}
          </p>
        )}
        {saved && (
          <p className="text-sm px-3 py-2 rounded-lg" style={{ backgroundColor: "rgba(34,197,94,0.1)", color: "#22c55e" }}>
            ✓ Configurações salvas!
          </p>
        )}

        <button
          onClick={handleSave} disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: "var(--brand-primary)", color: "white" }}
        >
          <Save size={16} />
          {saving ? "Salvando…" : "Salvar configurações"}
        </button>
      </div>

      {/* ── Identidade do app ─────────────────────────────────────────────── */}
      <div style={cardStyle} className="space-y-5">
        <div>
          <h2 className="text-base font-bold mb-1" style={{ color: "var(--text-primary)" }}>
            Identidade do app
          </h2>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Logo, ícone e nome exibidos no header, telas de autenticação e PWA.
          </p>
        </div>

        {/* Preview do header */}
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
            Preview — como aparece no header
          </p>
          <div style={{
            backgroundColor: "rgba(8,0,16,0.92)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "12px",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            minHeight: "52px",
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoPreviewUrl ?? DEFAULT_LOGO}
              alt="preview"
              style={{ height: "28px", width: "auto", maxWidth: "140px", objectFit: "contain" }}
            />
            <span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "auto" }}>
              {appName}
            </span>
          </div>
        </div>

        {/* Logo principal */}
        <div>
          <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
            Logo principal
          </label>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "8px" }}>
            PNG/SVG com fundo transparente. Mín. 112px de altura (exibida a 28px). Máx 5 MB.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <label style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              padding: "8px 14px", borderRadius: "8px",
              backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)",
              cursor: logoUploading ? "wait" : "pointer",
              fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600,
              opacity: logoUploading ? 0.6 : 1,
            }}>
              <Upload size={13} />
              {logoUploading ? "Enviando…" : logoPath ? "Substituir" : "Fazer upload"}
              <input
                ref={logoFileRef}
                type="file"
                accept={ACCEPTED}
                style={{ display: "none" }}
                disabled={logoUploading}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f) }}
              />
            </label>
            {logoPreviewUrl && (
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                ✓ Logo carregada
              </span>
            )}
          </div>
        </div>

        {/* Ícone compacto */}
        <div>
          <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
            Ícone compacto <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(opcional)</span>
          </label>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "8px" }}>
            Quadrado 512×512px — usado no favicon e ícones do PWA. Se vazio, usa a logo principal.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <label style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              padding: "8px 14px", borderRadius: "8px",
              backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)",
              cursor: compactUploading ? "wait" : "pointer",
              fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600,
              opacity: compactUploading ? 0.6 : 1,
            }}>
              <Upload size={13} />
              {compactUploading ? "Enviando…" : logoCompactPath ? "Substituir" : "Fazer upload"}
              <input
                ref={compactFileRef}
                type="file"
                accept={ACCEPTED}
                style={{ display: "none" }}
                disabled={compactUploading}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCompactUpload(f) }}
              />
            </label>
            {logoCompactPreviewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoCompactPreviewUrl}
                alt="icon preview"
                style={{ width: "32px", height: "32px", objectFit: "contain", borderRadius: "6px", border: "1px solid var(--border-subtle)" }}
              />
            )}
          </div>
        </div>

        {/* Nome do app */}
        <div>
          <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", display: "block" }}>
            Nome do app
          </label>
          <input
            type="text"
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            placeholder="Rick Roleta"
            style={inputStyle}
          />
        </div>

        {brandingError && (
          <p className="text-sm px-3 py-2 rounded-lg" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
            {brandingError}
          </p>
        )}
        {brandingSaved && (
          <p className="text-sm px-3 py-2 rounded-lg" style={{ backgroundColor: "rgba(34,197,94,0.1)", color: "#22c55e" }}>
            ✓ Identidade salva!
          </p>
        )}

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={handleBrandingSave} disabled={brandingSaving}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "var(--brand-primary)", color: "white" }}
          >
            <Save size={16} />
            {brandingSaving ? "Salvando…" : "Salvar identidade"}
          </button>
          <button
            onClick={handleRestoreDefaults} disabled={brandingSaving}
            title="Restaurar logo e nome padrão"
            className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all hover:opacity-80 disabled:opacity-40"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}
          >
            <RotateCcw size={15} />
            Padrão
          </button>
        </div>
      </div>

      {/* ── Dica de promoção admin ─────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-4 text-xs"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}
      >
        <p className="font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>Como promover um usuário a admin</p>
        <code className="block font-mono text-xs p-2 rounded-lg mt-1" style={{ backgroundColor: "var(--bg-base)" }}>
          UPDATE profiles SET role = &apos;admin&apos; WHERE id = &apos;&lt;uuid&gt;&apos;;
        </code>
        <p className="mt-2">Execute este SQL no Dashboard do Supabase após o usuário criar a conta.</p>
      </div>
    </div>
  )
}
