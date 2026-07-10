// SERVER ONLY — não importar em client components
import { createClient as create } from "@supabase/supabase-js"

export function createAdminClient() {
  return create(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
