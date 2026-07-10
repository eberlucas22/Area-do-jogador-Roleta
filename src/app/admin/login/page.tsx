"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { AppLogo } from "@/components/AppLogo"
import { Suspense } from "react"

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(
    params.get("error") === "unauthorized" ? "Acesso negado. Apenas administradores." : null
  )

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError("E-mail ou senha inválidos.")
      setLoading(false)
      return
    }

    router.push("/admin/jogadas")
    router.refresh()
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      {error && (
        <div
          className="rounded-xl px-4 py-3 text-sm"
          style={{
            backgroundColor: "rgba(239,68,68,0.12)",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "#ef4444",
          }}
        >
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
          E-mail
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl px-4 py-3 text-sm"
          style={{
            backgroundColor: "var(--surface-3)",
            border: "none",
            color: "var(--text-primary)",
            outline: "none",
          }}
          placeholder="admin@exemplo.com"
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
          Senha
        </label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl px-4 py-3 text-sm"
          style={{
            backgroundColor: "var(--surface-3)",
            border: "none",
            color: "var(--text-primary)",
            outline: "none",
          }}
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl py-3 text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50"
        style={{
          backgroundColor: "var(--brand-primary)",
          color: "white",
        }}
      >
        {loading ? "Entrando…" : "Entrar"}
      </button>
    </form>
  )
}

export default function AdminLoginPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundColor: "var(--bg-base)",
        backgroundImage: "radial-gradient(ellipse 130% 60% at 50% -8%, rgba(26,16,48,0.92) 0%, transparent 65%)",
      }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-8 space-y-6"
        style={{
          backgroundColor: "var(--surface-2)",
          boxShadow: "var(--shadow-lg), 0 0 0 1px rgba(255,255,255,0.06)",
        }}
      >
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <AppLogo variant="auth" />
          </div>
          <h1
            className="text-xl font-black"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
          >
            Admin · Rick Roleta
          </h1>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Acesso restrito a administradores
          </p>
        </div>

        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
