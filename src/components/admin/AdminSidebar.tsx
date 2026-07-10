"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Zap, FileText, Settings, LogOut, ImageIcon, Building2, Video, Headphones, Users, History } from "lucide-react"
import { AppLogo } from "@/components/AppLogo"
import { createClient } from "@/lib/supabase/client"

const NAV_ITEMS = [
  { href: "/admin/jogadas",       label: "Jogadas",      shortLabel: "Jogadas",  Icon: Zap },
  { href: "/admin/materiais",     label: "Materiais",    shortLabel: "Materiais",Icon: FileText },
  { href: "/admin/banners",       label: "Banners",      shortLabel: "Banners",  Icon: ImageIcon },
  { href: "/admin/platforms",     label: "Plataformas",  shortLabel: "Plats.",   Icon: Building2 },
  { href: "/admin/videos",        label: "Vídeos",       shortLabel: "Vídeos",   Icon: Video },
  { href: "/admin/suporte",       label: "Suporte",      shortLabel: "Suporte",  Icon: Headphones },
  { href: "/admin/historico",     label: "Histórico",    shortLabel: "Histór.",  Icon: History },
  { href: "/admin/usuarios",      label: "Usuários",     shortLabel: "Users",    Icon: Users },
  { href: "/admin/configuracoes", label: "Configurações",shortLabel: "Config",   Icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/admin/login")
  }

  return (
    <>
      {/* ══════════════ DESKTOP SIDEBAR (md+) ══════════════ */}
      <aside
        className="hidden md:flex flex-col shrink-0"
        style={{
          width: "220px",
          backgroundColor: "var(--surface-1)",
          borderRight: "1px solid rgba(255,255,255,0.04)",
          minHeight: "100%",
        }}
      >
        <div className="p-4 flex items-center gap-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <AppLogo variant="compact" />
          <div>
            <p className="text-xs font-black" style={{ color: "var(--text-primary)" }}>Rick Roleta</p>
            <p className="text-xs" style={{ color: "var(--brand-primary)" }}>Admin</p>
          </div>
        </div>

        <nav className="flex-1 px-2 py-3 flex flex-col gap-1">
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{
                  backgroundColor: isActive ? "rgba(139,47,212,0.18)" : "transparent",
                  color: isActive ? "var(--brand-secondary)" : "var(--text-secondary)",
                }}
              >
                <Icon size={17} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="p-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80"
            style={{ color: "var(--text-muted)" }}
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </aside>

      {/* ══════════════ MOBILE BOTTOM NAV (< md) ══════════════ */}
      {/* IMPORTANTE: display:flex no className para md:hidden funcionar */}
      <nav
        className="flex fixed bottom-0 left-0 right-0 md:hidden z-50"
        style={{
          backgroundColor: "rgba(14,10,24,0.96)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          alignItems: "stretch",
          minHeight: "56px",
        }}
      >
        {NAV_ITEMS.map(({ href, shortLabel, Icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "2px",
                padding: "6px 1px 8px",
                color: isActive ? "var(--brand-secondary)" : "var(--text-muted)",
                textDecoration: "none",
                fontSize: "8px",
                fontWeight: isActive ? 700 : 500,
                minWidth: 0,
                borderTop: isActive ? "2px solid var(--brand-primary)" : "2px solid transparent",
                transition: "color 150ms",
              }}
            >
              <Icon size={17} />
              <span style={{ opacity: isActive ? 1 : 0, height: isActive ? "auto" : 0, overflow: "hidden" }}>
                {shortLabel}
              </span>
            </Link>
          )
        })}

        {/* Sair — botão no fim */}
        <button
          onClick={handleLogout}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "2px",
            padding: "6px 1px 8px",
            color: "var(--text-muted)",
            background: "none",
            border: "none",
            borderTop: "2px solid transparent",
            cursor: "pointer",
            fontSize: "8px",
            minWidth: 0,
          }}
        >
          <LogOut size={17} />
          <span style={{ height: 0, overflow: "hidden" }}>Sair</span>
        </button>
      </nav>
    </>
  )
}
