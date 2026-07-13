"use client"

import { useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { createClient } from "@/lib/supabase/client"
import { ChevronLeft } from "lucide-react"

// Recharts carregado sob demanda — só abre quando usuário clica em um jogo
const HistoricoCharts = dynamic(
  () => import("./HistoricoCharts").then((m) => m.HistoricoCharts),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        <div className="skeleton rounded-3xl" style={{ height: "200px" }} />
        <div className="skeleton rounded-3xl" style={{ height: "200px" }} />
      </div>
    ),
  }
)

interface HistoricoModuleProps {
  slug: string
}

interface Game {
  id: number
  name: string
  provider: string
  category: string
  realtime_channel: string
  image_path: string | null
  imageUrl: string | null
}

const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36])

function getColor(n: number): "red" | "black" | "green" {
  if (n === 0) return "green"
  return RED_NUMBERS.has(n) ? "red" : "black"
}


const COLOR_MAP = {
  red:   { fill: "#b91c1c", badge: "rgba(185,28,28,0.85)", text: "white" },
  black: { fill: "#262626", badge: "rgba(38,38,38,0.95)", text: "white" },
  green: { fill: "#166534", badge: "rgba(22,101,52,0.85)", text: "white" },
}

const DEFAULT_CHANNEL = "roleta_brasileira_playtech_results"

// ─── Roulette wheel SVG icon ──────────────────────────────────────────────────
function RouletteIcon({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="38" fill="#1a0a00" stroke="#b8860b" strokeWidth="2" />
      <circle cx="40" cy="40" r="30" fill="#0f0500" stroke="#b8860b" strokeWidth="1" />
      {Array.from({ length: 18 }).map((_, i) => {
        const angle = (i * 20 * Math.PI) / 180
        const x1 = 40 + 30 * Math.cos(angle)
        const y1 = 40 + 30 * Math.sin(angle)
        const x2 = 40 + 38 * Math.cos(angle)
        const y2 = 40 + 38 * Math.sin(angle)
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#b8860b" strokeWidth="0.7" />
      })}
      {[0,2,4,6,8,10,12,14,16].map((i) => {
        const a1 = (i * 20 * Math.PI) / 180
        const a2 = ((i + 1) * 20 * Math.PI) / 180
        const x1 = 40 + 28 * Math.cos(a1); const y1 = 40 + 28 * Math.sin(a1)
        const x2 = 40 + 28 * Math.cos(a2); const y2 = 40 + 28 * Math.sin(a2)
        return (
          <path key={i}
            d={`M40,40 L${x1},${y1} A28,28 0 0,1 ${x2},${y2} Z`}
            fill="#b91c1c" opacity="0.7"
          />
        )
      })}
      {[1,3,5,7,9,11,13,15,17].map((i) => {
        const a1 = (i * 20 * Math.PI) / 180
        const a2 = ((i + 1) * 20 * Math.PI) / 180
        const x1 = 40 + 28 * Math.cos(a1); const y1 = 40 + 28 * Math.sin(a1)
        const x2 = 40 + 28 * Math.cos(a2); const y2 = 40 + 28 * Math.sin(a2)
        return (
          <path key={i}
            d={`M40,40 L${x1},${y1} A28,28 0 0,1 ${x2},${y2} Z`}
            fill="#1a1a1a" opacity="0.8"
          />
        )
      })}
      <circle cx="40" cy="40" r="10" fill="#b8860b" />
      <circle cx="40" cy="40" r="6" fill="#1a0a00" />
      <circle cx="40" cy="40" r="3" fill="#b8860b" />
    </svg>
  )
}

// ─── Number badge ─────────────────────────────────────────────────────────────
function NumberBadge({ n, size = 32 }: { n: number; size?: number }) {
  const c = getColor(n)
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: size > 40 ? "12px" : "8px",
        backgroundColor: COLOR_MAP[c].badge,
        color: COLOR_MAP[c].text,
        fontSize: size > 40 ? "22px" : "13px",
        fontWeight: 900,
        fontFamily: "var(--font-display)",
        flexShrink: 0,
      }}
    >
      {n}
    </span>
  )
}

// Helper: compara id em escopo isolado para evitar narrowing agressivo do TS 5.x
function sameGameId(selected: Game | null, candidate: Game): boolean {
  return selected !== null && selected.id === candidate.id
}

export function HistoricoModule({ slug }: HistoricoModuleProps) {
  const [sequence, setSequence] = useState<number[]>([])
  const [isMock, setIsMock] = useState(false)
  const [loading, setLoading] = useState(true)
  const [live, setLive] = useState(false)
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [channelStatus, setChannelStatus] = useState<string>("CONNECTING")
  const [viewLimit, setViewLimit] = useState<50 | 100 | 200>(50)
  const [gameList, setGameList] = useState<Game[]>([])
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null)
  const sequenceRef = useRef<number[]>([])

  useEffect(() => { sequenceRef.current = sequence }, [sequence])

  // Buscar lista de jogos
  useEffect(() => {
    const supabase = createClient()
    supabase
      .from("historico_games")
      .select("id,name,provider,category,realtime_channel,image_path")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data: games }) => {
        if (games) {
          setGameList(games.map((g) => ({
            ...g,
            imageUrl: g.image_path
              ? supabase.storage.from("games").getPublicUrl(g.image_path).data.publicUrl
              : null,
          })))
        }
      })
  }, [])

  const activeChannel = selectedGame?.realtime_channel ?? DEFAULT_CHANNEL

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | null = null

    async function init() {
      const { data } = await supabase
        .from("roulette_results")
        .select("number")
        .eq("channel", activeChannel)
        .order("received_at", { ascending: false })
        .limit(200)

      if (cancelled) return

      if (data && data.length > 0) {
        setSequence(data.map((r: { number: number }) => r.number))
      }
      setLoading(false)

      channel = supabase
        .channel(activeChannel, {
          config: {
            private: true,
            broadcast: { self: true },
          },
        })
        .on(
          "broadcast",
          { event: "roulette_result" },
          (msg) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const payload = (msg as any)?.payload
            const num = payload?.result
            if (typeof num !== "number" || num < 0 || num > 36) return

            setLive(true)
            setSequence((prev) => [num, ...prev].slice(0, 500))
          }
        )
        .subscribe((status) => {
          setChannelStatus(status)
        })

      channelRef.current = channel
    }

    init()

    return () => {
      cancelled = true
      if (channel) {
        supabase.removeChannel(channel)
        channel = null
      }
      channelRef.current = null
    }
  }, [slug, activeChannel, selectedGame?.id])

  const lastNumber = sequence[0] ?? null
  const last5 = sequence.slice(1, 6)

  // ── Stats ──────────────────────────────────────────────────────────────────
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now()
  const history = sequence.map((n, i) => {
    const dt = new Date(now - (sequence.length - i) * 90000)
    return {
      number: n,
      color: getColor(n),
      timestamp: dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    }
  })

  const lastN = history.slice(0, viewLimit)

  const freq: Record<number, number> = {}
  for (let i = 0; i <= 36; i++) freq[i] = 0
  lastN.forEach((r) => freq[r.number]++)

  const freqData = Array.from({ length: 37 }, (_, i) => ({
    n: String(i),
    count: freq[i],
    fill: getColor(i) === "red" ? "#b91c1c" : getColor(i) === "green" ? "#166534" : "#444",
  }))

  const sorted = [...freqData].sort((a, b) => b.count - a.count)
  const hot = sorted.slice(0, 5)
  const cold = sorted.slice(-5).reverse()

  const redCount = lastN.filter((r) => r.color === "red").length
  const blackCount = lastN.filter((r) => r.color === "black").length
  const greenCount = lastN.filter((r) => r.color === "green").length
  const pieData = [
    { name: "Vermelho", value: redCount },
    { name: "Preto", value: blackCount },
    { name: "Verde", value: greenCount },
  ]

  // ── Vista de detalhe do jogo ──────────────────────────────────────────────
  if (selectedGame) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6 space-y-4">

        {/* Cabeçalho com voltar */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => setSelectedGame(null)}
            style={{
              display: "flex", alignItems: "center", gap: "4px",
              background: "none", border: "none", cursor: "pointer",
              color: "var(--text-secondary)", fontSize: "14px", fontWeight: 600,
              padding: "6px 0",
            }}
          >
            <ChevronLeft size={18} />
            Histórico
          </button>
        </div>

        {/* Info do jogo + status */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: "12px", flexWrap: "wrap",
        }}>
          <div>
            <p style={{ fontSize: "11px", fontWeight: 600, color: "#b8860b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "2px" }}>
              {selectedGame.provider} · {selectedGame.category}
            </p>
            <h2 style={{ fontSize: "20px", fontWeight: 900, color: "#fff", fontFamily: "var(--font-display)", margin: 0 }}>
              {selectedGame.name}
            </h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {live ? (
              <span className="badge" style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                color: "#4ade80", backgroundColor: "rgba(74,222,128,0.1)",
              }}>
                <span className="dot-live" />
                Ao vivo
              </span>
            ) : (
              <span className="badge badge-muted" style={{
                color: channelStatus === "SUBSCRIBED" ? "#fbbf24" : undefined,
                backgroundColor: channelStatus === "SUBSCRIBED" ? "rgba(251,191,36,0.1)" : undefined,
              }}>
                {channelStatus === "SUBSCRIBED" ? "Aguardando…" : channelStatus}
              </span>
            )}
            {lastNumber !== null && <NumberBadge n={lastNumber} size={44} />}
          </div>
        </div>

        {/* Aguardando primeiros resultados */}
        {sequence.length === 0 && (
          <div style={{
            padding: "32px 20px", borderRadius: "20px", textAlign: "center",
            backgroundColor: "var(--surface-1)",
          }}>
            <p style={{ fontSize: "28px", marginBottom: "8px" }}>🎰</p>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>
              Aguardando os primeiros resultados
            </p>
            <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              O histórico será preenchido automaticamente quando a roleta girar.
            </p>
          </div>
        )}

        {/* Seletor de quantidade — chip segmentado */}
        {sequence.length > 0 && (
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <div className="chip-group">
              {([50, 100, 200] as const).map((n) => (
                <button
                  key={n}
                  onClick={() => setViewLimit(n)}
                  className={`chip-item${viewLimit === n ? " active" : ""}`}
                >
                  {n}
                </button>
              ))}
            </div>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>últimos números</span>
          </div>
        )}

        {/* Grid de números */}
        {sequence.length > 0 && (
          <div className="rounded-3xl p-5" style={{ backgroundColor: "var(--surface-1)" }}>
            <p className="label-caps mb-4">
              Últimos {viewLimit} números
            </p>
            <div className="flex flex-wrap gap-1.5">
              {lastN.map((r, i) => (
                <span
                  key={i}
                  className="inline-flex items-center justify-center rounded-lg text-xs font-bold tabular-nums"
                  style={{
                    width: "32px", height: "32px",
                    backgroundColor: COLOR_MAP[r.color].badge,
                    color: COLOR_MAP[r.color].text,
                    fontFamily: "var(--font-mono)",
                    opacity: i === 0 ? 1 : Math.max(0.4, 0.95 - i * 0.004),
                  }}
                  title={`${r.number} · ${r.timestamp}`}
                >
                  {r.number}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Hot & Cold */}
        {sequence.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-3xl p-4" style={{ backgroundColor: "var(--surface-1)" }}>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "#f59e0b", marginBottom: "14px" }}>🔥 Mais quentes</p>
              <div className="space-y-2">
                {hot.map((d) => (
                  <div key={d.n} className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center justify-center rounded text-xs font-bold tabular-nums"
                      style={{ width: "26px", height: "26px", backgroundColor: d.fill, color: "white", fontFamily: "var(--font-mono)" }}>
                      {d.n}
                    </span>
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--surface-3)" }}>
                      <div className="h-full rounded-full" style={{ width: `${(d.count / (hot[0].count || 1)) * 100}%`, backgroundColor: "#f59e0b" }} />
                    </div>
                    <span className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>{d.count}x</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl p-4" style={{ backgroundColor: "var(--surface-1)" }}>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--info)", marginBottom: "14px" }}>🧊 Mais frios</p>
              <div className="space-y-2">
                {cold.map((d) => (
                  <div key={d.n} className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center justify-center rounded text-xs font-bold tabular-nums"
                      style={{ width: "26px", height: "26px", backgroundColor: d.fill, color: "white", fontFamily: "var(--font-mono)" }}>
                      {d.n}
                    </span>
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--surface-3)" }}>
                      <div className="h-full rounded-full" style={{ width: `${(d.count / (hot[0].count || 1)) * 100}%`, backgroundColor: "var(--info)" }} />
                    </div>
                    <span className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>{d.count}x</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Gráficos — carregados lazy (recharts em chunk separado) ──────── */}
        {sequence.length > 0 && (
          <HistoricoCharts
            freqData={freqData}
            pieData={pieData}
            totalCount={lastN.length}
          />
        )}

      </div>
    )
  }

  // ── Vista de lista de jogos ────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-4">

      <h1 style={{ fontSize: "20px", fontWeight: 900, color: "var(--text-primary)", fontFamily: "var(--font-display)", margin: 0 }}>
        Histórico
      </h1>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="h-6 w-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--brand-primary)" }} />
        </div>
      ) : gameList.length === 0 ? (
        <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>Nenhum jogo disponível.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {gameList.map((game: Game) => {
            const isLiveGame = live && sameGameId(selectedGame, game)
            return (
            <div
              key={game.id}
              style={{
                borderRadius: "24px", overflow: "hidden",
                backgroundColor: "var(--surface-1)",
                boxShadow: "var(--shadow-md)",
              }}
            >
              {/* Hero */}
              <div style={{
                background: "linear-gradient(135deg, #1a0800 0%, #2d1200 40%, #0f0020 100%)",
                padding: "24px",
                position: "relative", overflow: "hidden",
              }}>
                <div style={{
                  position: "absolute", inset: 0,
                  background: "radial-gradient(ellipse at 80% 50%, rgba(184,134,11,0.12) 0%, transparent 70%)",
                  pointerEvents: "none",
                }} />
                <div style={{ display: "flex", alignItems: "center", gap: "16px", position: "relative" }}>
                  {/* Ícone ou imagem */}
                  <div style={{
                    flexShrink: 0, width: "64px", height: "64px", borderRadius: "14px",
                    backgroundColor: "rgba(0,0,0,0.4)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 0 20px rgba(184,134,11,0.15)",
                    overflow: "hidden",
                  }}>
                    {game.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={game.imageUrl} alt={game.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <RouletteIcon size={50} />
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "10px", fontWeight: 600, color: "#b8860b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "2px" }}>
                      {game.provider} · {game.category}
                    </p>
                    <h2 style={{ fontSize: "16px", fontWeight: 900, color: "#fff", fontFamily: "var(--font-display)", margin: "0 0 8px" }}>
                      {game.name}
                    </h2>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      {isLiveGame ? (
                        <span className="badge" style={{
                          display: "inline-flex", alignItems: "center", gap: "5px",
                          color: "#4ade80", backgroundColor: "rgba(74,222,128,0.1)",
                        }}>
                          <span className="dot-live" />
                          Ao vivo
                        </span>
                      ) : null}
                      {last5.length > 0 && selectedGame === null && game.id === gameList[0].id && (
                        <div style={{ display: "flex", gap: "3px" }}>
                          {last5.map((n, i) => <NumberBadge key={i} n={n} size={24} />)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Último número */}
                  {lastNumber !== null && selectedGame === null && game.id === gameList[0].id && (
                    <div style={{ flexShrink: 0, textAlign: "center" }}>
                      <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.35)", marginBottom: "3px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Último
                      </p>
                      <NumberBadge n={lastNumber} size={48} />
                    </div>
                  )}
                </div>
              </div>

              {/* Botão Ver histórico */}
              <button
                onClick={() => {
                  setSelectedGame(game)
                  setSequence([])
                  setLive(false)
                  setChannelStatus("CONNECTING")
                  setViewLimit(50)
                }}
                style={{
                  width: "100%", padding: "14px 20px",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: "none", border: "none",
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                  cursor: "pointer", color: "var(--brand-secondary)",
                  fontSize: "14px", fontWeight: 700,
                }}
              >
                <span>Ver histórico e estatísticas</span>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 400 }}>
                  {game.id === gameList[0]?.id && !selectedGame
                    ? `${sequence.length} rodadas`
                    : ""}
                </span>
              </button>
            </div>
          )})}
        </div>
      )}

    </div>
  )
}
