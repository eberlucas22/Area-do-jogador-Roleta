"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/Toast"
import { FooterDisclaimer } from "@/components/FooterDisclaimer"
import { AppLogo } from "@/components/AppLogo"
import { useBranding } from "@/components/BrandingProvider"

// ─── WhatsApp mask — formato nacional ────────────────────────────────────────
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

// ─── Inner component (uses useSearchParams) ───────────────────────────────────
function AuthForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  const nextUrl = searchParams.get("next") ?? `/${process.env.NEXT_PUBLIC_AFFILIATE_SLUG ?? "afiliado"}/banca`

  const [tab, setTab] = useState<"register" | "login">("register")
  const [loading, setLoading] = useState(false)

  // Register fields
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [password, setPassword] = useState("")
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [marketingOptIn, setMarketingOptIn] = useState(false)

  // Login fields
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [resetSent, setResetSent] = useState(false)

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState("")

  // Email confirmation state
  const [confirmationSent, setConfirmationSent] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendLoading, setResendLoading] = useState(false)

  const supabase = createClient()
  const { appName } = useBranding()

  // Countdown for resend button
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  // Show toast when redirected back after email confirmation
  useEffect(() => {
    if (searchParams.get("confirmed") === "true") {
      showToast("E-mail confirmado, bem-vindo!", "success")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleResend() {
    if (!confirmationSent || resendCooldown > 0) return
    setResendLoading(true)
    await supabase.auth.resend({ type: "signup", email: confirmationSent })
    setResendLoading(false)
    setResendCooldown(60)
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}

    if (!fullName.trim()) errs.fullName = "Nome obrigatório."
    if (!email.trim()) errs.email = "E-mail obrigatório."
    if (!isValidWhatsApp(whatsapp)) errs.whatsapp = "DDD + número inválido. Ex: (11) 99999-9999"
    if (password.length < 8) errs.password = "Mínimo 8 caracteres."
    if (!termsAccepted) errs.terms = "Você precisa aceitar os Termos para continuar."

    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    setGeneralError("")
    setLoading(true)

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
    const whatsappE164 = "+55" + whatsapp.replace(/\D/g, "")
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback`,
        data: {
          full_name: fullName.trim(),
          whatsapp: whatsappE164,
          marketing_opt_in: marketingOptIn,
          accepted_terms: "true",
        },
      },
    })

    if (error) {
      if (error.message.toLowerCase().includes("already")) {
        setErrors({ email: "Este e-mail já está em uso." })
      } else {
        setGeneralError(error.message)
      }
      setLoading(false)
      return
    }

    // If session is null, email confirmation is required
    if (data.session === null) {
      setConfirmationSent(email)
      setLoading(false)
      return
    }

    const firstName = fullName.trim().split(" ")[0]
    showToast(`Bem-vindo, ${firstName}!`, "success")
    router.push(nextUrl)
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setGeneralError("")
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    })

    if (error) {
      const msg = error.message.toLowerCase()
      if (msg.includes("email not confirmed") || msg.includes("not confirmed")) {
        setConfirmationSent(loginEmail)
        setLoading(false)
        return
      }
      setGeneralError("E-mail ou senha incorretos.")
      setLoading(false)
      return
    }

    router.push(nextUrl)
  }

  async function handleResetPassword() {
    if (!loginEmail.trim()) {
      setGeneralError("Digite seu e-mail acima antes de redefinir a senha.")
      return
    }
    setGeneralError("")
    const origin = window.location.origin
    await supabase.auth.resetPasswordForEmail(loginEmail, {
      redirectTo: `${origin}/auth?mode=reset`,
    })
    setResetSent(true)
  }

  const inputStyle: React.CSSProperties = {
    display: "block",
    width: "100%",
    padding: "10px 12px",
    borderRadius: "10px",
    backgroundColor: "var(--surface-4)",
    border: "none",
    color: "var(--text-primary)",
    fontSize: "14px",
    boxSizing: "border-box",
    outline: "none",
  }

  const errorInputStyle: React.CSSProperties = {
    ...inputStyle,
    border: "1px solid #f87171",
  }

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "12px",
    color: "var(--text-muted)",
    marginBottom: "6px",
  }

  const btnBase: React.CSSProperties = {
    padding: "12px",
    borderRadius: "12px",
    border: "none",
    cursor: "pointer",
    backgroundColor: "var(--brand-primary)",
    color: "#fff",
    fontSize: "14px",
    fontWeight: 700,
    marginTop: "4px",
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--bg-base)",
        backgroundImage: "radial-gradient(ellipse 120% 55% at 50% -5%, rgba(26,16,48,0.92) 0%, transparent 62%)",
      }}
    >
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
        {/* Logo */}
        <div style={{ marginBottom: "28px", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
            <AppLogo variant="auth" />
          </div>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            {appName} · Conteúdo exclusivo +18
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            width: "100%",
            maxWidth: "400px",
            backgroundColor: "var(--surface-2)",
            borderRadius: "24px",
            padding: "28px 24px",
            boxShadow: "var(--shadow-lg), 0 0 0 1px rgba(255,255,255,0.06)",
          }}
        >
          {/* ── Email confirmation screen ── */}
          {confirmationSent !== null ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px", lineHeight: 1 }}>✉️</div>
                <h2 style={{ fontSize: "20px", fontWeight: 900, color: "var(--text-primary)", fontFamily: "var(--font-display)", margin: "0 0 12px" }}>
                  Confirme seu e-mail
                </h2>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.6 }}>
                  Enviamos um link de confirmação para{" "}
                  <strong style={{ color: "var(--text-secondary)" }}>{confirmationSent}</strong>.{" "}
                  Abra sua caixa de entrada (e o spam) para ativar sua conta.
                </p>
              </div>

              <button
                onClick={handleResend}
                disabled={resendLoading || resendCooldown > 0}
                style={{
                  ...btnBase,
                  opacity: resendLoading || resendCooldown > 0 ? 0.6 : 1,
                  cursor: resendLoading || resendCooldown > 0 ? "not-allowed" : "pointer",
                }}
              >
                {resendLoading
                  ? "Enviando…"
                  : resendCooldown > 0
                  ? `Reenviar em ${resendCooldown}s`
                  : "Reenviar e-mail"}
              </button>

              <button
                onClick={() => setConfirmationSent(null)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  fontSize: "13px",
                  textAlign: "center",
                  padding: "4px",
                  textDecoration: "underline",
                }}
              >
                Usar outro e-mail
              </button>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div style={{ display: "flex", gap: "4px", marginBottom: "24px", backgroundColor: "var(--surface-3)", borderRadius: "10px", padding: "4px" }}>
                {(["register", "login"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setTab(t); setErrors({}); setGeneralError("") }}
                    style={{
                      flex: 1,
                      padding: "8px",
                      borderRadius: "8px",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: 700,
                      backgroundColor: tab === t ? "var(--brand-primary)" : "transparent",
                      color: tab === t ? "#fff" : "var(--text-muted)",
                      transition: "all 200ms",
                    }}
                  >
                    {t === "register" ? "Criar conta" : "Entrar"}
                  </button>
                ))}
              </div>

              {/* Register form */}
              {tab === "register" && (
                <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <label style={labelStyle}>Nome completo</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Seu nome"
                      style={errors.fullName ? errorInputStyle : inputStyle}
                      autoComplete="name"
                    />
                    {errors.fullName && <p style={{ fontSize: "12px", color: "#f87171", marginTop: "4px" }}>{errors.fullName}</p>}
                  </div>

                  <div>
                    <label style={labelStyle}>E-mail</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      style={errors.email ? errorInputStyle : inputStyle}
                      autoComplete="email"
                    />
                    {errors.email && <p style={{ fontSize: "12px", color: "#f87171", marginTop: "4px" }}>{errors.email}</p>}
                  </div>

                  <div>
                    <label style={labelStyle}>WhatsApp</label>
                    <input
                      type="tel"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(maskWhatsApp(e.target.value))}
                      placeholder="(11) 99999-9999"
                      style={errors.whatsapp ? errorInputStyle : inputStyle}
                      autoComplete="tel"
                    />
                    {errors.whatsapp && <p style={{ fontSize: "12px", color: "#f87171", marginTop: "4px" }}>{errors.whatsapp}</p>}
                  </div>

                  <div>
                    <label style={labelStyle}>Senha</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      style={errors.password ? errorInputStyle : inputStyle}
                      autoComplete="new-password"
                    />
                    {errors.password && <p style={{ fontSize: "12px", color: "#f87171", marginTop: "4px" }}>{errors.password}</p>}
                  </div>

                  {/* Terms checkbox */}
                  <div>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                        cursor: "pointer",
                        fontSize: "12px",
                        color: "var(--text-secondary)",
                        lineHeight: "1.5",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        style={{
                          marginTop: "2px",
                          flexShrink: 0,
                          accentColor: "var(--brand-primary)",
                          outline: errors.terms ? "2px solid #f87171" : "none",
                        }}
                      />
                      <span>
                        Li e aceito os{" "}
                        <a href="/termos" target="_blank" rel="noopener noreferrer" style={{ color: "var(--brand-secondary)" }}>
                          Termos de Uso
                        </a>{" "}
                        e a{" "}
                        <a href="/privacidade" target="_blank" rel="noopener noreferrer" style={{ color: "var(--brand-secondary)" }}>
                          Política de Privacidade
                        </a>
                      </span>
                    </label>
                    {errors.terms && <p style={{ fontSize: "12px", color: "#f87171", marginTop: "4px" }}>{errors.terms}</p>}
                  </div>

                  {/* Marketing opt-in */}
                  <label
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      cursor: "pointer",
                      fontSize: "12px",
                      color: "var(--text-muted)",
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

                  {generalError && <p style={{ fontSize: "13px", color: "#f87171" }}>{generalError}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    style={{ ...btnBase, opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}
                  >
                    {loading ? "Criando conta…" : "Criar conta"}
                  </button>
                </form>
              )}

              {/* Login form */}
              {tab === "login" && (
                <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <label style={labelStyle}>E-mail</label>
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="seu@email.com"
                      style={inputStyle}
                      autoComplete="email"
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Senha</label>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Sua senha"
                      style={inputStyle}
                      autoComplete="current-password"
                    />
                  </div>

                  {resetSent ? (
                    <p style={{ fontSize: "13px", color: "var(--brand-secondary)", textAlign: "center" }}>
                      Verifique seu e-mail ✓
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResetPassword}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--text-muted)",
                        fontSize: "12px",
                        textAlign: "left",
                        padding: 0,
                      }}
                    >
                      Esqueci minha senha
                    </button>
                  )}

                  {generalError && <p style={{ fontSize: "13px", color: "#f87171" }}>{generalError}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    style={{ ...btnBase, opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}
                  >
                    {loading ? "Entrando…" : "Entrar"}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>

      <FooterDisclaimer />
    </div>
  )
}

// ─── Page wrapper (Suspense for useSearchParams) ──────────────────────────────
export default function AuthPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  )
}
