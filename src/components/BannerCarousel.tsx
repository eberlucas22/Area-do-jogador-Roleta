"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { AnimatePresence, motion } from "framer-motion"
import Image from "next/image"

export interface BannerItem {
  id: string
  imageUrl: string
  link_url: string | null
}

// ── Variantes ─────────────────────────────────────────────────────────────────

const SLIDE_CENTER = {
  enter: (dir: number) => ({ x: dir > 0 ? "60%" : "-60%", opacity: 0 }),
  center: { x: "0%", opacity: 1 },
  exit:  (dir: number) => ({ x: dir > 0 ? "-60%" : "60%", opacity: 0 }),
}

const SLIDE_MOBILE = {
  enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%" }),
  center: { x: "0%" },
  exit:  (dir: number) => ({ x: dir > 0 ? "-100%" : "100%" }),
}

const TRANSITION = { type: "tween" as const, duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] as [number,number,number,number] }

// ── Painel lateral (sempre embaçado) ─────────────────────────────────────────

function SidePanel({ banner, onClick }: { banner: BannerItem; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        width: "20%",
        flexShrink: 0,
        overflow: "hidden",
        borderRadius: "10px",
        aspectRatio: "1600/560",
        cursor: "pointer",
        filter: "blur(4px) brightness(0.35)",
        position: "relative",
      }}
    >
      <Image src={banner.imageUrl} alt="Banner" fill sizes="20vw" style={{ objectFit: "cover" }} />
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
// Recebe banners via prop (buscados uma única vez no layout server component).
// Não remonta ao trocar de seção — o carrossel mantém posição e timer.

export function BannerCarousel({ banners }: { banners: BannerItem[] }) {
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(1)
  const [paused, setPaused] = useState(false)
  const touchStartX = useRef(0)

  const goNext = useCallback(() => {
    setDirection(1)
    setCurrent((c) => (c + 1) % banners.length)
  }, [banners.length])

  const goPrev = useCallback(() => {
    setDirection(-1)
    setCurrent((c) => (c - 1 + banners.length) % banners.length)
  }, [banners.length])

  useEffect(() => {
    if (banners.length < 2 || paused) return
    const id = setInterval(goNext, 5000)
    return () => clearInterval(id)
  }, [banners.length, paused, goNext])

  if (banners.length === 0) return null

  // Reset current if out of bounds (e.g. banner removed in admin)
  const safeIdx = current % banners.length
  const prevIdx = (safeIdx - 1 + banners.length) % banners.length
  const nextIdx = (safeIdx + 1) % banners.length
  const curr = banners[safeIdx]

  const hoverProps = {
    onMouseEnter: () => setPaused(true),
    onMouseLeave: () => setPaused(false),
  }

  // ── 1 único banner ────────────────────────────────────────────────────────
  if (banners.length === 1) {
    return (
      <div style={{ width: "100%", overflow: "hidden", position: "relative", aspectRatio: "1600/560" }}>
        {curr.link_url ? (
          <a href={curr.link_url} target="_blank" rel="noopener noreferrer"
            style={{ display: "block", width: "100%", height: "100%" }}>
            <Image src={curr.imageUrl} alt="Banner" fill sizes="100vw" style={{ objectFit: "cover" }} priority />
          </a>
        ) : (
          <Image src={curr.imageUrl} alt="Banner" fill sizes="100vw" style={{ objectFit: "cover" }} priority />
        )}
      </div>
    )
  }

  return (
    <>
      {/* ══ DESKTOP: lados fixos embaçados + centro com slide animado ══ */}
      <div
        className="hidden md:flex"
        style={{ width: "100%", gap: "8px", alignItems: "stretch" }}
        {...hoverProps}
      >
        <SidePanel banner={banners[prevIdx]} onClick={goPrev} />

        <div
          style={{
            flex: 1,
            overflow: "hidden",
            borderRadius: "14px",
            aspectRatio: "1600/560",
            position: "relative",
            boxShadow: "0 6px 32px rgba(139,47,212,0.4)",
          }}
        >
          <AnimatePresence mode="popLayout" custom={direction} initial={false}>
            <motion.div
              key={curr.id}
              custom={direction}
              variants={SLIDE_CENTER}
              initial="enter"
              animate="center"
              exit="exit"
              transition={TRANSITION}
              style={{ position: "absolute", inset: 0 }}
            >
              {curr.link_url ? (
                <a href={curr.link_url} target="_blank" rel="noopener noreferrer"
                  style={{ display: "block", width: "100%", height: "100%" }}>
                  <Image src={curr.imageUrl} alt="Banner" fill sizes="(max-width: 768px) 100vw, 70vw" style={{ objectFit: "cover" }} priority />
                </a>
              ) : (
                <Image src={curr.imageUrl} alt="Banner" fill sizes="(max-width: 768px) 100vw, 70vw" style={{ objectFit: "cover" }} priority />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <SidePanel banner={banners[nextIdx]} onClick={goNext} />
      </div>

      {/* ══ MOBILE: slide full-width com dots ══ */}
      <div
        className="md:hidden"
        role="region"
        aria-label="Banner carousel"
        style={{
          position: "relative",
          width: "100%",
          overflow: "hidden",
          borderRadius: "14px",
          aspectRatio: "1600/560",
          userSelect: "none",
        }}
        {...hoverProps}
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX }}
        onTouchEnd={(e) => {
          const dx = touchStartX.current - e.changedTouches[0].clientX
          if (Math.abs(dx) > 50) { if (dx > 0) goNext(); else goPrev() }
        }}
      >
        <AnimatePresence mode="sync" custom={direction} initial={false}>
          <motion.div
            key={safeIdx}
            custom={direction}
            variants={SLIDE_MOBILE}
            initial="enter"
            animate="center"
            exit="exit"
            transition={TRANSITION}
            style={{ position: "absolute", inset: 0 }}
          >
            {curr.link_url ? (
              <a href={curr.link_url} target="_blank" rel="noopener noreferrer"
                style={{ display: "block", width: "100%", height: "100%" }}>
                <Image src={curr.imageUrl} alt="Banner" fill sizes="100vw" style={{ objectFit: "cover" }} priority />
              </a>
            ) : (
              <Image src={curr.imageUrl} alt="Banner" fill sizes="100vw" style={{ objectFit: "cover" }} priority />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Dots */}
        <div
          style={{
            position: "absolute", bottom: "10px", left: "50%",
            transform: "translateX(-50%)", display: "flex", gap: "7px", zIndex: 10,
          }}
        >
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => { setDirection(i > safeIdx ? 1 : -1); setCurrent(i) }}
              aria-label={`Slide ${i + 1}`}
              style={{
                width: i === safeIdx ? "22px" : "7px",
                height: "7px",
                borderRadius: "99px",
                backgroundColor: i === safeIdx ? "var(--brand-primary)" : "rgba(255,255,255,0.45)",
                border: "none",
                cursor: "pointer",
                padding: 0,
                transition: "all 300ms",
              }}
            />
          ))}
        </div>
      </div>
    </>
  )
}
