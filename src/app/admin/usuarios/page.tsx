import { createAdminClient } from "@/lib/supabase/admin"
import { UsuariosClient } from "./UsuariosClient"

export const dynamic = "force-dynamic"

export default async function AdminUsuariosPage() {
  const admin = createAdminClient()

  const [authResult, profilesResult, cyclesResult] = await Promise.all([
    admin.auth.admin.listUsers({ perPage: 1000 }),
    admin.from("profiles").select("id,full_name,whatsapp,marketing_opt_in,accepted_terms_at,role"),
    admin.from("gestao_cycles").select("user_id").eq("is_active", true),
  ])

  const activeUserIds = new Set(
    (cyclesResult.data ?? [])
      .map((c: { user_id: string | null }) => c.user_id)
      .filter(Boolean) as string[]
  )

  type ProfileRow = {
    id: string
    full_name: string | null
    whatsapp: string | null
    marketing_opt_in: boolean | null
    accepted_terms_at: string | null
    role: string | null
  }

  const profileMap = Object.fromEntries(
    (profilesResult.data ?? []).map((p: ProfileRow) => [p.id, p])
  )

  const users = (authResult.data?.users ?? []).map((u) => ({
    id: u.id,
    email: u.email ?? "",
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at ?? null,
    full_name: (profileMap[u.id] as ProfileRow | undefined)?.full_name ?? null,
    whatsapp: (profileMap[u.id] as ProfileRow | undefined)?.whatsapp ?? null,
    marketing_opt_in: (profileMap[u.id] as ProfileRow | undefined)?.marketing_opt_in ?? false,
    accepted_terms_at: (profileMap[u.id] as ProfileRow | undefined)?.accepted_terms_at ?? null,
    role: (profileMap[u.id] as ProfileRow | undefined)?.role ?? "user",
    has_active_cycle: activeUserIds.has(u.id),
  }))

  return <UsuariosClient initialUsers={users} />
}
