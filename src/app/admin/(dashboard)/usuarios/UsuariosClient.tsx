"use client"

import { useState, useMemo } from "react"
import { Download, Search, ShieldCheck, ShieldOff } from "lucide-react"

export type UserRow = {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
  full_name: string | null
  whatsapp: string | null
  marketing_opt_in: boolean | null
  accepted_terms_at: string | null
  role: string | null
  has_active_cycle: boolean
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" })
}

export function UsuariosClient({
  initialUsers,
  currentUserId,
}: {
  initialUsers: UserRow[]
  currentUserId: string
}) {
  const [search, setSearch] = useState("")
  const [onlyOptIn, setOnlyOptIn] = useState(false)
  const [roles, setRoles] = useState<Record<string, string>>(
    Object.fromEntries(initialUsers.map((u) => [u.id, u.role ?? "user"]))
  )
  const [toggling, setToggling] = useState<Set<string>>(new Set())
  const [roleError, setRoleError] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return initialUsers.filter((u) => {
      const q = search.toLowerCase()
      const matchSearch = !q ||
        (u.full_name ?? "").toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      const matchOptIn = !onlyOptIn || !!u.marketing_opt_in
      return matchSearch && matchOptIn
    })
  }, [initialUsers, search, onlyOptIn])

  async function toggleRole(userId: string) {
    const currentRole = roles[userId] ?? "user"
    const newRole = currentRole === "admin" ? "user" : "admin"
    setToggling((s) => new Set(s).add(userId))
    setRoleError(null)

    const res = await fetch("/api/admin/set-role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role: newRole }),
    })

    if (res.ok) {
      setRoles((r) => ({ ...r, [userId]: newRole }))
    } else {
      const { error } = await res.json()
      setRoleError(error ?? "Erro ao alterar permissão.")
    }
    setToggling((s) => { const n = new Set(s); n.delete(userId); return n })
  }

  function exportCsv() {
    const BOM = "\uFEFF"
    const headers = ["Nome;E-mail;WhatsApp;Opt-in;Cadastro;Último acesso;Ciclo ativo;Role"]
    const rows = filtered.map((u) =>
      [
        u.full_name ?? "",
        u.email,
        u.whatsapp ?? "",
        u.marketing_opt_in ? "Sim" : "Não",
        fmtDate(u.created_at),
        fmtDate(u.last_sign_in_at),
        u.has_active_cycle ? "Sim" : "Não",
        roles[u.id] ?? "user",
      ].join(";")
    )
    const csv = BOM + [...headers, ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `usuarios-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const card = {
    backgroundColor: "var(--bg-card)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "14px",
  }

  return (
    <div style={{ padding: "24px 20px", maxWidth: "1100px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 900, color: "var(--text-primary)", fontFamily: "var(--font-display)", margin: 0 }}>
            Usuários
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
            {initialUsers.length} cadastrado{initialUsers.length !== 1 ? "s" : ""}
            {filtered.length !== initialUsers.length && ` · ${filtered.length} exibido${filtered.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          onClick={exportCsv}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 14px",
            borderRadius: "10px",
            border: "1px solid var(--border-subtle)",
            backgroundColor: "var(--bg-elevated)",
            color: "var(--text-secondary)",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <Download size={14} />
          Exportar CSV
        </button>
      </div>

      {roleError && (
        <div style={{ marginBottom: "16px", padding: "10px 14px", borderRadius: "10px", backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", fontSize: "13px" }}>
          {roleError}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou e-mail…"
            style={{
              width: "100%",
              padding: "8px 10px 8px 32px",
              borderRadius: "10px",
              backgroundColor: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
              fontSize: "13px",
              boxSizing: "border-box",
            }}
          />
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
          <input
            type="checkbox"
            checked={onlyOptIn}
            onChange={(e) => setOnlyOptIn(e.target.checked)}
            style={{ accentColor: "var(--brand-primary)" }}
          />
          Apenas opt-in
        </label>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Nenhum usuário encontrado.</p>
      ) : (
        <div style={{ ...card, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                {["Nome", "E-mail", "WhatsApp", "Opt-in", "Cadastro", "Último acesso", "Ciclo", "Permissão"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 14px",
                      textAlign: "left",
                      color: "var(--text-muted)",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, idx) => {
                const isAdmin = (roles[u.id] ?? "user") === "admin"
                const isSelf = u.id === currentUserId
                const isToggling = toggling.has(u.id)

                return (
                  <tr
                    key={u.id}
                    style={{
                      borderBottom: idx < filtered.length - 1 ? "1px solid var(--border-subtle)" : "none",
                    }}
                  >
                    <td style={{ padding: "10px 14px", color: "var(--text-primary)", whiteSpace: "nowrap" }}>
                      {u.full_name ?? <span style={{ color: "var(--text-muted)" }}>{u.email.split("@")[0]}</span>}
                    </td>
                    <td style={{ padding: "10px 14px", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                      {u.email}
                    </td>
                    <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                      {u.whatsapp ? (
                        <a
                          href={`https://wa.me/${u.whatsapp.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#4ade80", fontWeight: 600, textDecoration: "none" }}
                        >
                          {u.whatsapp}
                        </a>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                      {u.marketing_opt_in ? (
                        <span style={{ color: "#22c55e", fontWeight: 600 }}>Sim</span>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>Não</span>
                      )}
                    </td>
                    <td style={{ padding: "10px 14px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                      {fmtDate(u.created_at)}
                    </td>
                    <td style={{ padding: "10px 14px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                      {fmtDate(u.last_sign_in_at)}
                    </td>
                    <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                      {u.has_active_cycle ? (
                        <span style={{ color: "var(--brand-secondary)", fontWeight: 600 }}>Ativo</span>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                      {isAdmin && (
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "var(--brand-secondary)",
                          backgroundColor: "rgba(139,47,212,0.12)",
                          border: "1px solid rgba(139,47,212,0.3)",
                          borderRadius: "6px",
                          padding: "2px 8px",
                          marginRight: "8px",
                        }}>
                          <ShieldCheck size={11} />
                          Admin
                        </span>
                      )}
                      {!isSelf && (
                        <button
                          onClick={() => toggleRole(u.id)}
                          disabled={isToggling}
                          title={isAdmin ? "Remover permissão de admin" : "Tornar admin"}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "4px 10px",
                            borderRadius: "7px",
                            border: `1px solid ${isAdmin ? "rgba(239,68,68,0.35)" : "rgba(139,47,212,0.35)"}`,
                            backgroundColor: isAdmin ? "rgba(239,68,68,0.08)" : "rgba(139,47,212,0.08)",
                            color: isAdmin ? "#f87171" : "var(--brand-secondary)",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: isToggling ? "not-allowed" : "pointer",
                            opacity: isToggling ? 0.5 : 1,
                          }}
                        >
                          {isToggling ? "…" : isAdmin ? (
                            <><ShieldOff size={12} /> Remover</>
                          ) : (
                            <><ShieldCheck size={12} /> Tornar admin</>
                          )}
                        </button>
                      )}
                      {isSelf && (
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>você</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
