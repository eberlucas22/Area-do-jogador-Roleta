"use client"

import { useBranding } from "@/components/BrandingProvider"

// Único ponto do projeto com referência ao asset estático de logo
const FALLBACK = "/banners/logo-rick.png"

type Variant = "header" | "auth" | "sidebar" | "compact"

interface AppLogoProps {
  variant: Variant
}

/**
 * AppLogo — componente único para renderizar a logo do app em todas as superfícies.
 * Lê logo_path do banco via BrandingContext; fallback para o asset padrão.
 *
 * O HEADER tem altura travada em Header.tsx (56px fixo).
 * A logo nunca pode empurrar o header — ela é CONTIDA pelo pai.
 *
 * Variantes:
 *  header  — max-height 40px (mobile) / 44px (desktop), max-width 240px
 *  auth    — slot 64/72px travado, max-height 100%, max-width 280px
 *  sidebar — full-width, height auto
 *  compact — 36×36px
 */
export function AppLogo({ variant }: AppLogoProps) {
  const { logoUrl, appName } = useBranding()
  const src = logoUrl ?? FALLBACK

  if (variant === "header") {
    return (
      // overflow:hidden no pai (Link em Header.tsx) garante que nada vaze
      // max-height garante que a imagem NÃO empurra o header de 56px fixo
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={appName}
        style={{
          maxHeight: "46px",
          width: "auto",
          maxWidth: "480px",
          objectFit: "contain",
          display: "block",
        }}
        fetchPriority="high"
      />
    )
  }

  if (variant === "auth") {
    return (
      // Slot travado: 64px mobile / 72px desktop
      <div
        className="h-16 md:h-[72px]"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={appName}
          style={{
            maxHeight: "100%",
            width: "auto",
            maxWidth: "280px",
            objectFit: "contain",
            display: "block",
          }}
        />
      </div>
    )
  }

  if (variant === "sidebar") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={appName}
        style={{ width: "100%", height: "auto", display: "block", objectFit: "contain" }}
      />
    )
  }

  // compact — AdminSidebar e admin login
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={appName}
      style={{
        width: "36px",
        height: "36px",
        objectFit: "contain",
        borderRadius: "10px",
        display: "block",
        flexShrink: 0,
      }}
    />
  )
}
