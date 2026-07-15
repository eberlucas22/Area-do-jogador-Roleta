"use client"

import { useEffect, useId, useRef, useState, useCallback } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import {
  Wallet, Zap, BookOpen, TrendingUp, Video, Headphones, Layers, X,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Platform {
  id: string
  name: string
  logo_path: string | null
  description: string | null
  benefits: string[]
  cta_url: string | null
  accent_color: string | null
  logoUrl?: string
}

interface SidebarProps {
  slug: string
}

// ─── Nav item lists ───────────────────────────────────────────────────────────

// Desktop sidebar (Plataformas is rendered separately as the first item)
const DESKTOP_NAV = [
  { href: "banca",    label: "Banca",     Icon: Wallet },
  { href: "jogadas",  label: "Jogadas",   Icon: Zap },
  { href: "historico",label: "Histórico", Icon: TrendingUp },
  { href: "videos",   label: "Vídeos",    Icon: Video },
  { href: "suporte",  label: "Suporte",   Icon: Headphones },
  { href: "regras",   label: "Regras",    Icon: BookOpen },
]

// Mobile nav: 3 left + FAB (center) + 3 right = 7 items
const MOBILE_LEFT = [
  { href: "banca",    label: "Banca",     Icon: Wallet },
  { href: "jogadas",  label: "Jogadas",   Icon: Zap },
  { href: "historico",label: "Histórico", Icon: TrendingUp },
]
const MOBILE_RIGHT = [
  { href: "videos",   label: "Vídeos",    Icon: Video },
  { href: "suporte",  label: "Suporte",   Icon: Headphones },
  { href: "regras",   label: "Regras",    Icon: BookOpen },
]

// ─── Platform card (compact horizontal) ──────────────────────────────────────

function PlatformCard({ p }: { p: Platform }) {
  const accent = p.accent_color || "var(--brand-primary)"
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "13px 14px",
        borderRadius: "16px",
        background: "var(--surface-3)",
      }}
    >
      <div
        style={{
          width: "44px", height: "44px", borderRadius: "10px",
          background: "var(--surface-2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, overflow: "hidden",
        }}
      >
        {p.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.logoUrl} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        ) : (
          <span style={{ fontWeight: 900, fontSize: "18px", color: accent }}>{p.name[0]}</span>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: "14px", color: "var(--text-primary)", lineHeight: 1.3 }}>
          {p.name}
        </p>
        {p.description && (
          <p style={{ margin: "2px 0 0", fontSize: "11px", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {p.description}
          </p>
        )}
        {p.benefits.length > 0 && (
          <p style={{ margin: "3px 0 0", fontSize: "10px", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {p.benefits.slice(0, 3).map((b) => `✓ ${b}`).join("  ·  ")}
          </p>
        )}
      </div>

      {p.cta_url && (
        <a
          href={p.cta_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          style={{
            flexShrink: 0,
            padding: "8px 14px",
            borderRadius: "8px",
            backgroundColor: accent,
            color: "#fff",
            fontSize: "12px",
            fontWeight: 800,
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          Cadastre-se
        </a>
      )}
    </div>
  )
}

// ─── Sheet / modal body ───────────────────────────────────────────────────────

function SheetBody({
  platforms, loaded, onClose, titleId, closeRef,
}: {
  platforms: Platform[]
  loaded: boolean
  onClose: () => void
  titleId: string
  closeRef: React.RefObject<HTMLButtonElement | null>
}) {
  const dragStartY = useRef(0)

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Drag handle */}
      <div
        style={{ padding: "10px 16px 0", flexShrink: 0, touchAction: "none", cursor: "grab" }}
        onTouchStart={(e) => { dragStartY.current = e.touches[0].clientY }}
        onTouchEnd={(e) => { if (e.changedTouches[0].clientY - dragStartY.current > 70) onClose() }}
      >
        <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: "var(--border-muted)", margin: "0 auto" }} />
      </div>

      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "10px 16px 12px", flexShrink: 0,
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        <h2
          id={titleId}
          style={{ margin: 0, fontSize: "16px", fontWeight: 900, color: "var(--text-primary)", fontFamily: "var(--font-display)" }}
        >
          Plataformas Parceiras
        </h2>
        <button
          ref={closeRef}
          onClick={onClose}
          aria-label="Fechar"
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: "4px", borderRadius: "6px" }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Cards */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
        {!loaded ? (
          <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "13px", padding: "32px 0", margin: 0 }}>
            Carregando…
          </p>
        ) : platforms.length === 0 ? (
          <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "13px", padding: "32px 0", margin: 0 }}>
            Nenhuma plataforma disponível.
          </p>
        ) : (
          platforms.map((p) => <PlatformCard key={p.id} p={p} />)
        )}
      </div>

      {/* +18 inside sheet */}
      <div style={{ flexShrink: 0, padding: "10px 16px 14px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)", textAlign: "center", lineHeight: 1.5 }}>
          +18 · Jogue com responsabilidade · Apostas envolvem risco financeiro
        </p>
      </div>
    </div>
  )
}

// ─── Mobile nav item ──────────────────────────────────────────────────────────

function MobileNavItem({
  href, label, Icon, isActive,
}: {
  href: string
  label: string
  Icon: React.ComponentType<{ size?: number }>
  isActive: boolean
}) {
  return (
    <Link
      href={href}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "3px",
        padding: "8px 2px",
        color: isActive ? "var(--brand-secondary)" : "var(--text-muted)",
        textDecoration: "none",
        minWidth: 0,
        minHeight: "44px",
        alignSelf: "stretch",
        transition: "color 150ms",
      }}
    >
      <Icon size={20} />
      <span style={{
        fontSize: "10px",
        fontWeight: isActive ? 700 : 400,
        lineHeight: 1,
        opacity: isActive ? 1 : 0.7,
      }}>
        {label}
      </span>
    </Link>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function Sidebar({ slug }: SidebarProps) {
  const pathname = usePathname()

  // Platforms sheet state
  const [platformsOpen, setPlatformsOpen] = useState(false)
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [loaded, setLoaded] = useState(false)
  const prefersReduced = useReducedMotion()
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)

  // Mobile detection (only needed for sheet vs modal decision)
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches
  )
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)")
    const fn = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener("change", fn)
    return () => mq.removeEventListener("change", fn)
  }, [])

  // Lazy-fetch platforms on first open
  useEffect(() => {
    if (!platformsOpen || loaded) return
    const supabase = createClient()
    supabase
      .from("platforms")
      .select("id,name,logo_path,description,benefits,cta_url,accent_color")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
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
        setLoaded(true)
      })
  }, [platformsOpen, loaded])

  // Esc to close
  useEffect(() => {
    if (!platformsOpen) return
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") setPlatformsOpen(false) }
    window.addEventListener("keydown", fn)
    return () => window.removeEventListener("keydown", fn)
  }, [platformsOpen])

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = platformsOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [platformsOpen])

  // Focus close button on open
  useEffect(() => {
    if (platformsOpen) {
      const t = setTimeout(() => closeRef.current?.focus(), 60)
      return () => clearTimeout(t)
    }
  }, [platformsOpen])

  const openPlatforms = useCallback(() => setPlatformsOpen(true), [])
  const closePlatforms = useCallback(() => setPlatformsOpen(false), [])

  // Variants
  const backdropVar = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
  const sheetVar = prefersReduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { y: "100%" }, animate: { y: 0 }, exit: { y: "100%" } }
  const modalVar = prefersReduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { opacity: 0, scale: 0.96 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.96 } }
  const spring = prefersReduced
    ? { duration: 0 }
    : { type: "spring" as const, damping: 32, stiffness: 280 }

  const sheetBodyProps = { platforms, loaded, onClose: closePlatforms, titleId, closeRef }

  return (
    <>
      {/* ══════════════════ DESKTOP SIDEBAR ══════════════════ */}
      <aside
        className="hidden md:flex flex-col shrink-0"
        style={{ width: "220px", background: "var(--surface-1)", minHeight: "100%" }}
      >
        <div className="px-3 flex-1 flex flex-col gap-1 pt-4 pb-4">
          <p className="px-2 pb-2 pt-0" style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>
            Menu
          </p>

          {/* Plataformas — destaque verde */}
          <button
            onClick={openPlatforms}
            aria-haspopup="dialog"
            aria-expanded={platformsOpen}
            className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold transition-all w-full text-left"
            style={{
              background: "rgba(23,209,64,0.09)",
              color: "var(--success-accent)",
              border: "none",
              cursor: "pointer",
            }}
          >
            <Layers size={17} />
            Plataformas
          </button>

          {/* Nav items */}
          {DESKTOP_NAV.map(({ href, label, Icon }) => {
            const fullHref = `/${slug}/${href}`
            const isActive = pathname === fullHref
            return (
              <Link
                key={href}
                href={fullHref}
                className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold transition-all"
                style={{
                  background: isActive ? "rgba(139,47,212,0.16)" : "transparent",
                  color: isActive ? "var(--brand-secondary)" : "var(--text-secondary)",
                }}
              >
                <Icon size={17} />
                {label}
              </Link>
            )
          })}
        </div>
      </aside>

      {/* ══════════════════ MOBILE BOTTOM NAV — PILL FLUTUANTE ══════════════════ */}
      <nav
        className="flex fixed md:hidden z-50"
        style={{
          bottom: "max(14px, env(safe-area-inset-bottom, 14px))",
          left: "12px",
          right: "12px",
          borderRadius: "9999px",
          background: "rgba(14,10,24,0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          alignItems: "stretch",
          minHeight: "58px",
          paddingLeft: "6px",
          paddingRight: "6px",
          overflow: "visible",
          boxShadow: "0 8px 40px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.07)",
        }}
      >
        {/* Left: Banca, Jogadas, Histórico */}
        {MOBILE_LEFT.map(({ href, label, Icon }) => (
          <MobileNavItem
            key={href}
            href={`/${slug}/${href}`}
            label={label}
            Icon={Icon}
            isActive={pathname === `/${slug}/${href}`}
          />
        ))}

        {/* Central FAB — Plataformas */}
        <button
          onClick={openPlatforms}
          aria-haspopup="dialog"
          aria-label="Plataformas Parceiras"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-end",
            paddingBottom: "6px",
            border: "none",
            background: "none",
            cursor: "pointer",
            position: "relative",
            minWidth: 0,
          }}
        >
          {/* Elevated circle */}
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "54px",
              height: "54px",
              borderRadius: "50%",
              background: "linear-gradient(145deg, #a855f7 0%, #8b2fd4 55%, #5b0e9c 100%)",
              boxShadow: "0 0 28px rgba(139,47,212,0.75), 0 4px 18px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)",
              transform: "translateY(-16px)",
              flexShrink: 0,
            }}
          >
            <Layers size={22} color="#fff" />
          </span>
          <span style={{ fontSize: "9px", fontWeight: 700, color: "var(--brand-secondary)", lineHeight: 1, marginTop: "-4px" }}>
            Plataformas
          </span>
        </button>

        {/* Right: Vídeos, Suporte, Regras */}
        {MOBILE_RIGHT.map(({ href, label, Icon }) => (
          <MobileNavItem
            key={href}
            href={`/${slug}/${href}`}
            label={label}
            Icon={Icon}
            isActive={pathname === `/${slug}/${href}`}
          />
        ))}
      </nav>

      {/* ══════════════════ PLATFORMS SHEET / MODAL ══════════════════ */}
      <AnimatePresence>
        {platformsOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="plat-backdrop"
              variants={backdropVar}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: prefersReduced ? 0 : 0.2 }}
              aria-hidden="true"
              onClick={closePlatforms}
              style={{
                position: "fixed", inset: 0,
                backgroundColor: "rgba(0,0,0,0.65)",
                backdropFilter: "blur(4px)",
                zIndex: 60,
              }}
            />

            {/* Mobile: bottom sheet */}
            {isMobile && (
              <motion.div
                key="plat-sheet"
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                variants={sheetVar}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={spring}
                style={{
                  position: "fixed", bottom: 0, left: 0, right: 0,
                  height: "65vh",
                  zIndex: 61,
                  background: "var(--surface-2)",
                  borderRadius: "24px 24px 0 0",
                  boxShadow: "0 -8px 40px rgba(0,0,0,0.6)",
                  display: "flex", flexDirection: "column", overflow: "hidden",
                }}
              >
                <SheetBody {...sheetBodyProps} />
              </motion.div>
            )}

            {/* Desktop: centered modal */}
            {!isMobile && (
              <div
                style={{
                  position: "fixed", inset: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: "24px",
                  zIndex: 61,
                  pointerEvents: "none",
                }}
              >
                <motion.div
                  key="plat-modal"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby={titleId}
                  variants={modalVar}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: prefersReduced ? 0 : 0.18 }}
                  style={{
                    width: "100%", maxWidth: "520px", maxHeight: "80vh",
                    background: "var(--surface-2)",
                    borderRadius: "24px",
                    display: "flex", flexDirection: "column", overflow: "hidden",
                    pointerEvents: "auto",
                    boxShadow: "var(--shadow-lg), 0 0 0 1px rgba(255,255,255,0.05)",
                  }}
                >
                  <SheetBody {...sheetBodyProps} />
                </motion.div>
              </div>
            )}
          </>
        )}
      </AnimatePresence>
    </>
  )
}
