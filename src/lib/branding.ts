import { unstable_noStore as noStore } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export interface BrandingData {
  logoUrl: string | null
  logoCompactUrl: string | null
  appName: string
  logoHeightPx: number
}

const DEFAULTS: BrandingData = {
  logoUrl: null,
  logoCompactUrl: null,
  appName: process.env.NEXT_PUBLIC_AFFILIATE_NAME ?? "Área do Jogador",
  logoHeightPx: 40,
}

export async function fetchBranding(): Promise<BrandingData> {
  noStore()
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from("settings")
      .select("logo_path,logo_compact_path,app_name,logo_height_px")
      .limit(1)
      .single()

    if (!data) return DEFAULTS

    const logoUrl = data.logo_path
      ? supabase.storage.from("branding").getPublicUrl(data.logo_path).data.publicUrl
      : null
    const logoCompactUrl = data.logo_compact_path
      ? supabase.storage.from("branding").getPublicUrl(data.logo_compact_path).data.publicUrl
      : null

    return {
      logoUrl,
      logoCompactUrl,
      appName: data.app_name || process.env.NEXT_PUBLIC_AFFILIATE_NAME || "Área do Jogador",
      logoHeightPx: data.logo_height_px ?? 40,
    }
  } catch {
    return DEFAULTS
  }
}
