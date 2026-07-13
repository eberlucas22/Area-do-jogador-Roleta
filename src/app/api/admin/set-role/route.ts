import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  // Verify caller is an authenticated admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!callerProfile || callerProfile.role !== "admin") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  const { userId, role } = await request.json()

  if (!userId || !["admin", "user"].includes(role)) {
    return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 })
  }

  if (userId === user.id) {
    return NextResponse.json({ error: "Você não pode alterar seu próprio role" }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from("profiles")
    .upsert({ id: userId, role }, { onConflict: "id" })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
