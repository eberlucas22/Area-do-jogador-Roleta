import type { MetadataRoute } from "next"

export const dynamic = "force-dynamic"

const DEFAULT_ICON = "/banners/logo-rick.png"
const DEFAULT_NAME = "Rick Roleta"

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let appName = DEFAULT_NAME
  let iconSrc = DEFAULT_ICON

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const res = await fetch(
      `${url}/rest/v1/settings?select=app_name,logo_compact_path,logo_path&limit=1`,
      {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        next: { revalidate: 60 },
      }
    )
    const [data] = await res.json()
    if (data?.app_name) appName = data.app_name
    const path = data?.logo_compact_path || data?.logo_path
    if (path) iconSrc = `${url}/storage/v1/object/public/branding/${path}`
  } catch { /* usa defaults */ }

  return {
    name: `Área do Jogador · ${appName}`,
    short_name: appName,
    description: "Área exclusiva do jogador +18",
    start_url: "/rick-roleta",
    display: "standalone",
    background_color: "#080010",
    theme_color: "#080010",
    icons: [
      { src: iconSrc, sizes: "any", type: "image/png" },
    ],
  }
}
