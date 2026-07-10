"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

export function UserButton() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<{ full_name?: string } | null>(null)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single()
          .then(({ data }) => setProfile(data))
      }
    })
  }, [])

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  if (!user) return null

  const displayName = profile?.full_name ?? user.email ?? ""
  const initial = displayName.charAt(0).toUpperCase()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth")
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        title={displayName}
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          backgroundColor: "var(--brand-primary)",
          color: "#fff",
          border: "1.5px solid var(--brand-secondary)",
          cursor: "pointer",
          fontSize: "13px",
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {initial}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: "180px",
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "12px",
            padding: "6px",
            zIndex: 100,
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}
        >
          <p style={{ fontSize: "11px", color: "var(--text-muted)", padding: "6px 10px 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user.email}
          </p>
          <hr style={{ border: "none", borderTop: "1px solid var(--border-subtle)", margin: "4px 0" }} />
          <button
            onClick={() => { setOpen(false); router.push("/perfil") }}
            style={{
              display: "block",
              width: "100%",
              padding: "8px 10px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              backgroundColor: "transparent",
              color: "var(--text-secondary)",
              fontSize: "13px",
              textAlign: "left",
            }}
          >
            Meus dados
          </button>
          <button
            onClick={handleSignOut}
            style={{
              display: "block",
              width: "100%",
              padding: "8px 10px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              backgroundColor: "transparent",
              color: "#f87171",
              fontSize: "13px",
              textAlign: "left",
            }}
          >
            Sair
          </button>
        </div>
      )}
    </div>
  )
}
