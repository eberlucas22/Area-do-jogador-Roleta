"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Trash2, Eye, EyeOff, Upload, Image as ImageIcon } from "lucide-react"

interface Game {
  id: number
  name: string
  provider: string
  category: string
  realtime_channel: string
  image_path: string | null
  sort_order: number
  is_active: boolean
  imageUrl: string | null
}

const ACCEPTED = "image/jpeg,image/png,image/webp"
const MAX_BYTES = 5 * 1024 * 1024

const card = {
  backgroundColor: "var(--bg-card)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "14px",
  padding: "16px",
}

export default function AdminHistoricoPage() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [replacingId, setReplacingId] = useState<number | null>(null)
  const [error, setError] = useState("")

  // Form state
  const [nameInput, setNameInput] = useState("")
  const [providerInput, setProviderInput] = useState("")
  const [categoryInput, setCategoryInput] = useState("Live Casino")
  const [channelInput, setChannelInput] = useState("")
  const [sortInput, setSortInput] = useState("0")
  const fileRef = useRef<HTMLInputElement>(null)
  const replaceFileRef = useRef<HTMLInputElement>(null)

  function getSupabase() {
    return createClient()
  }

  async function fetchGames() {
    const supabase = getSupabase()
    const { data } = await supabase
      .from("historico_games")
      .select("id,name,provider,category,realtime_channel,image_path,sort_order,is_active")
      .order("sort_order")
    if (data) {
      setGames(
        data.map((g) => ({
          ...g,
          imageUrl: g.image_path
            ? supabase.storage.from("games").getPublicUrl(g.image_path).data.publicUrl
            : null,
        }))
      )
    }
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => { fetchGames() }, [])

  async function handleAdd(imageFile: File | null) {
    if (!nameInput.trim()) { setError("Nome é obrigatório."); return }
    if (!channelInput.trim()) { setError("Canal realtime é obrigatório."); return }
    if (imageFile && imageFile.size > MAX_BYTES) { setError("Imagem muito grande (máx 2 MB)."); return }
    setError("")
    setUploading(true)
    const supabase = getSupabase()

    let image_path: string | null = null
    if (imageFile) {
      const ext = imageFile.name.split(".").pop() ?? "jpg"
      const path = `${Date.now()}-game.${ext}`
      const { error: upErr } = await supabase.storage.from("games").upload(path, imageFile)
      if (upErr) { setError("Erro no upload: " + upErr.message); setUploading(false); return }
      image_path = path
    }

    const { error: insertErr } = await supabase.from("historico_games").insert({
      name: nameInput.trim(),
      provider: providerInput.trim(),
      category: categoryInput.trim() || "Live Casino",
      realtime_channel: channelInput.trim(),
      image_path,
      sort_order: parseInt(sortInput) || 0,
    })

    if (insertErr) { setError("Erro ao salvar: " + insertErr.message); setUploading(false); return }

    setNameInput("")
    setProviderInput("")
    setCategoryInput("Live Casino")
    setChannelInput("")
    setSortInput("0")
    if (fileRef.current) fileRef.current.value = ""
    setUploading(false)
    fetchGames()
  }

  async function handleReplaceImage(game: Game, file: File) {
    if (file.size > MAX_BYTES) { setError("Imagem muito grande (máx 2 MB)."); return }
    setError("")
    setReplacingId(game.id)
    const supabase = getSupabase()

    // Remover imagem antiga
    if (game.image_path) {
      await supabase.storage.from("games").remove([game.image_path])
    }

    const ext = file.name.split(".").pop() ?? "jpg"
    // eslint-disable-next-line react-hooks/purity
    const path = `${Date.now()}-game.${ext}`
    const { error: upErr } = await supabase.storage.from("games").upload(path, file)
    if (upErr) { setError("Erro no upload: " + upErr.message); setReplacingId(null); return }

    await supabase.from("historico_games").update({ image_path: path }).eq("id", game.id)
    setReplacingId(null)
    if (replaceFileRef.current) replaceFileRef.current.value = ""
    fetchGames()
  }

  async function toggleActive(game: Game) {
    const supabase = getSupabase()
    await supabase.from("historico_games").update({ is_active: !game.is_active }).eq("id", game.id)
    fetchGames()
  }

  async function deleteGame(game: Game) {
    if (!confirm(`Excluir "${game.name}"?`)) return
    const supabase = getSupabase()
    if (game.image_path) {
      await supabase.storage.from("games").remove([game.image_path])
    }
    await supabase.from("historico_games").delete().eq("id", game.id)
    fetchGames()
  }

  return (
    <div style={{ padding: "24px 20px", maxWidth: "860px" }}>
      <h1 style={{ fontSize: "20px", fontWeight: 900, color: "var(--text-primary)", marginBottom: "24px", fontFamily: "var(--font-display)" }}>
        Histórico — Jogos
      </h1>

      {/* Formulário de novo jogo */}
      <div style={{ ...card, marginBottom: "24px" }}>
        <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "12px" }}>
          Adicionar jogo
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Nome *
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Ex: Roleta Brasileira"
                style={inputStyle}
              />
            </label>
            <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Provider
              <input
                type="text"
                value={providerInput}
                onChange={(e) => setProviderInput(e.target.value)}
                placeholder="Ex: Playtech"
                style={inputStyle}
              />
            </label>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Categoria
              <input
                type="text"
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
                placeholder="Ex: Live Casino"
                style={inputStyle}
              />
            </label>
            <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Ordem
              <input
                type="number"
                value={sortInput}
                onChange={(e) => setSortInput(e.target.value)}
                style={inputStyle}
              />
            </label>
          </div>
          <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Canal realtime *
            <input
              type="text"
              value={channelInput}
              onChange={(e) => setChannelInput(e.target.value)}
              placeholder="Ex: roleta_brasileira_playtech_results"
              style={inputStyle}
            />
          </label>
          <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Imagem (JPG/PNG/WebP, máx 5 MB — opcional)
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPTED}
              style={{ display: "block", marginTop: "6px", fontSize: "13px", color: "var(--text-primary)" }}
            />
          </label>

          {error && <p style={{ color: "#f87171", fontSize: "13px" }}>{error}</p>}

          <button
            disabled={uploading}
            onClick={() => {
              const file = fileRef.current?.files?.[0] ?? null
              handleAdd(file)
            }}
            style={{
              padding: "10px 20px",
              borderRadius: "10px",
              backgroundColor: "var(--brand-primary)",
              color: "#fff",
              border: "none",
              fontSize: "13px",
              fontWeight: 700,
              cursor: uploading ? "wait" : "pointer",
              opacity: uploading ? 0.7 : 1,
              alignSelf: "flex-start",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {uploading ? <><Upload size={14} /> Salvando…</> : "Adicionar jogo"}
          </button>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Carregando…</p>
      ) : games.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Nenhum jogo cadastrado.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {games.map((game) => (
            <div
              key={game.id}
              style={{
                ...card,
                display: "flex",
                gap: "14px",
                alignItems: "center",
                opacity: game.is_active ? 1 : 0.55,
              }}
            >
              {/* Thumbnail */}
              <div style={{
                flexShrink: 0, width: "64px", height: "64px",
                borderRadius: "10px", overflow: "hidden",
                backgroundColor: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {game.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={game.imageUrl} alt={game.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <ImageIcon size={28} style={{ color: "var(--text-muted)", opacity: 0.4 }} />
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 2px" }}>
                  {game.name}
                </p>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
                  {game.provider} · {game.category} · ordem {game.sort_order}
                </p>
                <p style={{ fontSize: "10px", color: "var(--brand-secondary)", margin: "2px 0 0", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {game.realtime_channel}
                </p>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "6px", flexShrink: 0, alignItems: "center" }}>
                {/* Substituir imagem */}
                <label
                  title="Substituir imagem"
                  style={{
                    cursor: replacingId === game.id ? "wait" : "pointer",
                    color: "var(--text-muted)",
                    display: "flex", alignItems: "center",
                    opacity: replacingId === game.id ? 0.5 : 1,
                  }}
                >
                  <Upload size={17} />
                  <input
                    type="file"
                    accept={ACCEPTED}
                    style={{ display: "none" }}
                    disabled={replacingId !== null}
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) handleReplaceImage(game, f)
                      e.target.value = ""
                    }}
                  />
                </label>

                <button
                  onClick={() => toggleActive(game)}
                  title={game.is_active ? "Desativar" : "Ativar"}
                  style={{ background: "none", border: "none", cursor: "pointer", color: game.is_active ? "var(--brand-secondary)" : "var(--text-muted)" }}
                >
                  {game.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>

                <button
                  onClick={() => deleteGame(game)}
                  title="Excluir"
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#f87171" }}
                >
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

const inputStyle: React.CSSProperties = {
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
}
