export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div
        className="w-full max-w-md rounded-2xl p-8 text-center"
        style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-muted)" }}
      >
        <h1
          className="mb-2 text-2xl font-bold"
          style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
        >
          Entrar
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Login disponível na Fase 2.
        </p>
      </div>
    </div>
  )
}
