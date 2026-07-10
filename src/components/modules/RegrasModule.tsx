"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { ChevronDown } from "lucide-react"

interface Material {
  id: string
  title: string
  description: string
  file_path: string
  cover_path: string | null
  sort_order: number
  pdfUrl: string
  coverUrl: string | null
}

// ─── Accordion sections ───────────────────────────────────────────────────
const SECTIONS = [
  {
    title: "Como funciona a roleta europeia",
    content: `A roleta europeia possui 37 números (0 a 36), distribuídos numa roda giratória. O croupier lança uma bolinha no sentido contrário à rotação e o número onde ela para é o resultado.

Diferentemente da roleta americana (que tem duplo zero "00"), a versão europeia tem apenas um 0 verde, o que reduz a vantagem da casa para 2,7%.

A casa sempre tem vantagem porque o 0 não faz parte de nenhuma aposta de dinheiro igual (vermelho/preto, par/ímpar, etc.).`,
  },
  {
    title: "Tipos de aposta + tabela de pagamentos",
    content: `APOSTAS INTERNAS (dentro do grid de números):
• Pleno (1 número): paga 35:1
• Cavalo (2 números): paga 17:1
• Trio (3 números): paga 11:1
• Quadrado (4 números): paga 8:1
• Linha (6 números): paga 5:1

APOSTAS EXTERNAS (fora do grid):
• Dúzia / Coluna (12 números): paga 2:1
• 1-18 ou 19-36 (metades): paga 1:1
• Vermelho / Preto: paga 1:1
• Par / Ímpar: paga 1:1`,
  },
  {
    title: "Gestão de banca responsável",
    content: `Regras de ouro:
• Jogue apenas com dinheiro que pode perder totalmente.
• Defina um orçamento antes de começar — nunca o ultrapasse.
• Nunca tente recuperar perdas aumentando apostas desesperadamente.
• Cada rodada é independente: resultados passados não influenciam o próximo.
• Faça pausas regulares. Cansaço prejudica decisões.
• Limite o tempo de jogo (ex.: máximo 2 horas por sessão).
• Se sentir que está perdendo o controle, busque ajuda: cvv.org.br`,
  },
  {
    title: "Stop Gain / Stop Loss explicados",
    content: `STOP WIN
Limite de lucro onde você para de jogar. Protege seus ganhos de sessão.
No Rick Roleta o padrão é 10% da banca atual — banca × 1,10.

STOP LOSS
Limite de perda máxima tolerada. Protege sua banca de perdas maiores.
No Rick Roleta o padrão é 40% da banca atual — banca × 0,60.

Por que o cálculo é composto (sobre a banca atual)?
Porque sua banca cresce ou diminui a cada dia. Aplicar % sobre a banca atual (e não a inicial) significa que os stops acompanham seu progresso real.

Exemplo: banca R$100 → stop win dia 1 = R$10 → banca R$110 → stop win dia 2 = R$11 (não mais R$10).`,
  },
  {
    title: "Glossário",
    content: `MARTINGALE: Estratégia que dobra a aposta após cada derrota. Perigosa pois pode exaurir a banca rapidamente numa sequência de perdas.

CROUPIER: Funcionário do cassino que opera a mesa de roleta.

PLENO: Aposta num único número (pagamento 35:1).

CAVALO: Aposta em 2 números adjacentes na mesa (17:1).

VIZINHOS: Aposta nos números próximos a um número específico na roda física.

VANTAGEM DA CASA: Percentual que o cassino retém a longo prazo. Na roleta europeia: 2,7%.

JOGO RESPONSÁVEL: Praticar jogos de azar de forma consciente, com limites definidos.`,
  },
]

// ─── Animated Accordion ───────────────────────────────────────────────────
function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className="rounded-3xl overflow-hidden"
      style={{
        backgroundColor: "var(--surface-1)",
        background: open ? "linear-gradient(145deg, rgba(139,47,212,0.10) 0%, var(--surface-1) 100%)" : "var(--surface-1)",
        transition: "background 200ms",
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 20px",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--text-primary)",
          textAlign: "left",
        }}
      >
        <span style={{ fontSize: "var(--text-title)", fontWeight: "var(--weight-title)", paddingRight: "16px",
          color: open ? "var(--brand-secondary)" : "var(--text-primary)" }}>
          {title}
        </span>
        <ChevronDown
          size={18}
          style={{
            transform: `rotate(${open ? 180 : 0}deg)`,
            transition: "transform 220ms",
            flexShrink: 0,
            color: "var(--text-muted)",
          }}
        />
      </button>
      <div
        style={{
          maxHeight: open ? "800px" : "0",
          overflow: "hidden",
          transition: "max-height 220ms ease-out",
        }}
      >
        <div
          style={{
            padding: "0 20px 20px",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            paddingTop: "16px",
            fontSize: "14px",
            lineHeight: 1.7,
            color: "var(--text-secondary)",
            whiteSpace: "pre-line",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

// ─── Card sub-components ──────────────────────────────────────────────────

function PdfBadge() {
  return (
    <span
      style={{
        position: "absolute",
        top: "0.75rem",
        right: "0.75rem",
        backgroundColor: "rgba(8,0,16,0.75)",
        color: "var(--text-muted)",
        fontSize: "0.625rem",
        fontWeight: 700,
        letterSpacing: "0.1em",
        padding: "0.25rem 0.5rem",
        borderRadius: "0.375rem",
        border: "1px solid rgba(139,47,212,0.25)",
        backdropFilter: "blur(4px)",
        zIndex: 2,
        textTransform: "uppercase" as const,
      }}
    >
      PDF
    </span>
  )
}

function CssFallbackCover({ title }: { title: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(135deg, #0f0020 0%, #3b1466 55%, #170530 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        gap: "0.875rem",
      }}
    >
      <div
        style={{
          width: "2.75rem",
          height: "2.75rem",
          borderRadius: "0.625rem",
          backgroundColor: "rgba(139,47,212,0.25)",
          border: "1px solid rgba(192,132,252,0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.25rem",
        }}
      >
        📄
      </div>
      <span
        style={{
          fontFamily: "var(--font-display)",
          color: "var(--brand-secondary)",
          fontSize: "clamp(0.875rem, 2vw, 1.25rem)",
          fontWeight: 900,
          textAlign: "center",
          lineHeight: 1.3,
          textShadow: "0 2px 12px rgba(0,0,0,0.6)",
          maxWidth: "20ch",
        }}
      >
        {title}
      </span>
    </div>
  )
}

const BTN_OPEN: React.CSSProperties = {
  backgroundColor: "var(--brand-primary)",
  color: "white",
  padding: "0.5rem 1.25rem",
  borderRadius: "0.75rem",
  fontSize: "0.8125rem",
  fontWeight: 700,
  textDecoration: "none",
  display: "inline-block",
  transition: "opacity 0.15s",
}

const BTN_GHOST: React.CSSProperties = {
  backgroundColor: "rgba(255,255,255,0.08)",
  color: "var(--text-secondary)",
  padding: "0.5rem 1.25rem",
  borderRadius: "0.75rem",
  fontSize: "0.8125rem",
  textDecoration: "none",
  display: "inline-block",
}

function MaterialCardHero({ mat }: { mat: Material }) {
  return (
    <div
      className="group relative rounded-2xl overflow-hidden transition-all duration-[250ms] sm:hover:shadow-[0_8px_40px_rgba(139,47,212,0.3)] sm:hover:-translate-y-0.5"
      style={{ boxShadow: "0 0 0 1px rgba(139,47,212,0.18), var(--shadow-md)" }}
    >
      <div style={{ aspectRatio: "16/9", position: "relative", overflow: "hidden" }}>
        {mat.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mat.coverUrl}
            alt={mat.title}
            loading="lazy"
            className="sm:transition-transform sm:duration-[250ms] sm:group-hover:scale-[1.03]"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <CssFallbackCover title={mat.title} />
        )}
        <PdfBadge />
        <div
          className="hidden sm:block absolute bottom-0 left-0 right-0"
          style={{
            background: "linear-gradient(to top, rgba(8,0,16,0.97) 0%, rgba(8,0,16,0.65) 55%, transparent 100%)",
            padding: "3.5rem 1.75rem 1.75rem",
          }}
        >
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 900, color: "var(--text-primary)", marginBottom: "0.375rem", lineHeight: 1.2 }}>
            {mat.title}
          </h3>
          {mat.description && (
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.5, marginBottom: "1.25rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {mat.description}
            </p>
          )}
          <div style={{ display: "flex", gap: "0.75rem", position: "relative", zIndex: 3 }}>
            <a href={mat.pdfUrl} target="_blank" rel="noopener noreferrer" style={BTN_OPEN}>Abrir →</a>
            <a href={mat.pdfUrl} download style={BTN_GHOST}>Baixar</a>
          </div>
        </div>
        <a href={mat.pdfUrl} target="_blank" rel="noopener noreferrer" className="sm:hidden absolute inset-0" style={{ zIndex: 1 }} aria-label={`Abrir ${mat.title}`} />
      </div>
      <div className="sm:hidden p-4 space-y-3" style={{ backgroundColor: "var(--surface-2)" }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 900, color: "var(--text-primary)", lineHeight: 1.2 }}>
          {mat.title}
        </h3>
        {mat.description && (
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.5 }}>{mat.description}</p>
        )}
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <a href={mat.pdfUrl} target="_blank" rel="noopener noreferrer" style={BTN_OPEN}>Abrir →</a>
          <a href={mat.pdfUrl} download style={BTN_GHOST}>Baixar</a>
        </div>
      </div>
    </div>
  )
}

function MaterialCardGrid({ mat }: { mat: Material }) {
  return (
    <div
      className="group relative rounded-2xl overflow-hidden transition-all duration-[250ms] sm:hover:shadow-[0_8px_32px_rgba(139,47,212,0.25)] sm:hover:-translate-y-0.5"
      style={{ backgroundColor: "var(--surface-1)", boxShadow: "0 0 0 1px rgba(139,47,212,0.14), var(--shadow-sm)" }}
    >
      <div style={{ aspectRatio: "16/9", overflow: "hidden", position: "relative" }}>
        {mat.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mat.coverUrl}
            alt={mat.title}
            loading="lazy"
            className="sm:transition-transform sm:duration-[250ms] sm:group-hover:scale-[1.03]"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <CssFallbackCover title={mat.title} />
        )}
        <PdfBadge />
        <a href={mat.pdfUrl} target="_blank" rel="noopener noreferrer" className="sm:hidden absolute inset-0" style={{ zIndex: 1 }} aria-label={`Abrir ${mat.title}`} />
      </div>
      <div className="p-4 space-y-2.5">
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 900, color: "var(--text-primary)", lineHeight: 1.3 }}>
          {mat.title}
        </h3>
        {mat.description && (
          <p style={{ color: "var(--text-secondary)", fontSize: "0.8125rem", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {mat.description}
          </p>
        )}
        <div style={{ display: "flex", gap: "0.625rem", paddingTop: "0.25rem" }}>
          <a href={mat.pdfUrl} target="_blank" rel="noopener noreferrer" style={{ ...BTN_OPEN, padding: "0.4rem 1rem", fontSize: "0.75rem" }}>Abrir →</a>
          <a href={mat.pdfUrl} download style={{ ...BTN_GHOST, padding: "0.4rem 1rem", fontSize: "0.75rem" }}>Baixar</a>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
export function RegrasModule() {
  const [materials, setMaterials] = useState<Material[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from("materials")
      .select("id,title,description,file_path,cover_path,sort_order")
      .order("sort_order")
      .then(({ data }) => {
        if (!data || data.length === 0) return
        setMaterials(
          data.map((m) => ({
            ...m,
            pdfUrl: supabase.storage.from("materials").getPublicUrl(m.file_path).data.publicUrl,
            coverUrl: m.cover_path
              ? supabase.storage.from("materials").getPublicUrl(m.cover_path).data.publicUrl
              : null,
          }))
        )
      })
  }, [])

  const isHero = materials.length === 1

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      <h2
        className="text-2xl font-black"
        style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
      >
        Regras &amp; Guia
      </h2>

      {/* Materiais do Rick — só renderiza se houver PDFs */}
      {materials.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Materiais do Rick
          </p>
          {isHero ? (
            <MaterialCardHero mat={materials[0]} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {materials.map((mat) => (
                <MaterialCardGrid key={mat.id} mat={mat} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Accordion de regras */}
      <div className="space-y-3">
        {SECTIONS.map((section, i) => (
          <Accordion key={i} title={section.title}>
            {section.content}
          </Accordion>
        ))}
      </div>

      <div
        className="rounded-3xl p-4 text-xs text-center"
        style={{
          backgroundColor: "var(--surface-1)",
          color: "var(--text-muted)",
        }}
      >
        Precisa de ajuda com jogo compulsivo?{" "}
        <a
          href="https://cvv.org.br"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--brand-primary)" }}
        >
          cvv.org.br
        </a>{" "}
        · Ligue 188
      </div>
    </div>
  )
}
