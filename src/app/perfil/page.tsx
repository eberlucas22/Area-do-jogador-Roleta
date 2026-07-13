"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/Toast"
import { FooterDisclaimer } from "@/components/FooterDisclaimer"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

function maskWhatsApp(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11)
  if (d.length === 0) return ""
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

function isValidWhatsApp(v: string): boolean {
  const digits = v.replace(/\D/g, "")
  return digits.length >= 10 && digits.length <= 11
}

interface Profile {
  full_name: string | null
  whatsapp: string | null
  marketing_opt_in: boolean
}

export default function PerfilPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [email, setEmail] = useState("")
  const [backHref, setBackHref] = useState(`/${process.env.NEXT_PUBLIC_AFFILIATE_SLUG ?? "afiliado"}/banca`)

  const [fullName, setFullName] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [marketingOptIn, setMarketingOptIn] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/auth"); return }

      setEmail(user.email ?? "")

      // Try to derive back href from referrer or default
      const ref = document.referrer
      if (ref && ref.includes(`/${process.env.NEXT_PUBLIC_AFFILIATE_SLUG ?? "afiliado"}`)) {
        try {
          const url = new URL(ref)
          setBackHref(url.pathname)
        } catch { /* keep default */ }
      }

      const { data } = await supabase
        .from("profiles")
        .select("full_name,whatsapp,marketing_opt_in")
        .eq("id", user.id)
        .single<Profile>()

      if (data) {
        setFullName(data.full_name ?? "")
        // Convert stored E.164 (+5511...) to national display format
        const raw = data.whatsapp ?? ""
        const digits = raw.replace(/\D/g, "")
        const national = digits.startsWith("55") && digits.length >= 12 ? digits.slice(2) : digits
        setWhatsapp(maskWhatsApp(national))
        setMarketingOptIn(data.marketing_opt_in ?? false)
      }
      setLoading(false)
    }
    load()
  }, [router])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (whatsapp && !isValidWhatsApp(whatsapp)) {
      showToast("DDD + número inválido. Ex: (11) 99999-9999", "error")
      return
    }
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const whatsappE164 = whatsapp ? "+55" + whatsapp.replace(/\D/g, "") : ""
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim(), whatsapp: whatsappE164, marketing_opt_in: marketingOptIn })
      .eq("id", user.id)

    setSaving(false)
    if (error) {
      showToast("Erro ao salvar. Tente novamente.", "error")
    } else {
      showToast("Dados atualizados com sucesso!", "success")
    }
  }

  const inputStyle: React.CSSProperties = {
    display: "block",
    width: "100%",
    padding: "10px 12px",
    borderRadius: "10px",
    backgroundColor: "var(--bg-elevated)",
    border: "1px solid var(--border-subtle)",
    color: "var(--text-primary)",
    fontSize: "14px",
    boxSizing: "border-box",
  }

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "12px",
    color: "var(--text-muted)",
    marginBottom: "6px",
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "var(--bg-base)" }}>
      <main style={{ flex: 1, maxWidth: "480px", margin: "0 auto", padding: "24px 16px", width: "100%" }}>
        <Link
          href={backHref}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "13px",
            color: "var(--text-muted)",
            marginBottom: "24px",
            textDecoration: "none",
          }}
        >
          <ArrowLeft size={14} />
          Voltar
        </Link>

        <h1 style={{ fontSize: "20px", fontWeight: 900, color: "var(--text-primary)", fontFamily: "var(--font-display)", marginBottom: "6px" }}>
          Meus dados
        </h1>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "28px" }}>
          {email}
        </p>

        {loading ? (
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Carregando…</p>
        ) : (
          <form
            onSubmit={handleSave}
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "18px",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div>
              <label style={labelStyle}>Nome completo</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Seu nome"
                style={inputStyle}
                autoComplete="name"
              />
            </div>

            <div>
              <label style={labelStyle}>WhatsApp</label>
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(maskWhatsApp(e.target.value))}
                placeholder="(11) 99999-9999"
                style={inputStyle}
                autoComplete="tel"
              />
            </div>

            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                cursor: "pointer",
                fontSize: "13px",
                color: "var(--text-secondary)",
                lineHeight: "1.5",
              }}
            >
              <input
                type="checkbox"
                checked={marketingOptIn}
                onChange={(e) => setMarketingOptIn(e.target.checked)}
                style={{ marginTop: "2px", flexShrink: 0, accentColor: "var(--brand-primary)" }}
              />
              <span>Aceito receber conteúdos e novidades por e-mail e WhatsApp</span>
            </label>

            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "12px",
                borderRadius: "12px",
                border: "none",
                cursor: saving ? "not-allowed" : "pointer",
                backgroundColor: "var(--brand-primary)",
                color: "#fff",
                fontSize: "14px",
                fontWeight: 700,
                opacity: saving ? 0.7 : 1,
                marginTop: "4px",
              }}
            >
              {saving ? "Salvando…" : "Salvar alterações"}
            </button>
          </form>
        )}
      </main>
      <FooterDisclaimer />
    </div>
  )
}
