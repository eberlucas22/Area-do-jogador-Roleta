"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import type { AffiliateConfig } from "@/config/types"
import { UserButton } from "@/components/UserButton"
import { AppLogo } from "@/components/AppLogo"

interface HeaderProps {
  config: AffiliateConfig
}

export function Header({ config }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between px-4 md:px-6"
      style={{
        height: "56px",
        backgroundColor: scrolled ? "rgba(10,10,15,0.88)" : "rgba(10,10,15,0.60)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.05)" : "1px solid transparent",
        transition: "background-color 250ms, border-color 250ms",
        flexShrink: 0,
      }}
    >
      <Link
        href={`/${config.slug}`}
        className="flex items-center transition-opacity hover:opacity-80"
        style={{ overflow: "hidden", flexShrink: 0 }}
      >
        <AppLogo variant="header" />
      </Link>

      <div className="flex items-center gap-3" style={{ flexShrink: 0 }}>
        <Link
          href="/jogo-responsavel"
          className="hidden text-xs transition-opacity hover:opacity-70 sm:block"
          style={{ color: "var(--text-muted)" }}
        >
          Jogo Responsável
        </Link>

        <UserButton />

        <span
          className="flex h-7 w-9 items-center justify-center rounded-full text-xs font-black"
          style={{
            background: "rgba(139,47,212,0.18)",
            color: "var(--brand-secondary)",
          }}
        >
          +18
        </span>
      </div>
    </header>
  )
}
