import { notFound, redirect } from "next/navigation"
import { unstable_cache } from "next/cache"
import type { Metadata } from "next"
import { Header } from "@/components/Header"
import { FooterDisclaimer } from "@/components/FooterDisclaimer"
import { Sidebar } from "@/components/Sidebar"
import { BannerCarousel } from "@/components/BannerCarousel"
import type { BannerItem } from "@/components/BannerCarousel"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { fetchBranding } from "@/lib/branding"
import type { AffiliateConfig } from "@/config/types"

async function getAffiliateConfig(slug: string): Promise<AffiliateConfig | null> {
  try {
    const mod = await import(`@/config/affiliates/${slug}`)
    return mod.config as AffiliateConfig
  } catch {
    return null
  }
}

// Fetch com cache de 60s — banners globais buscados uma única vez por visita.
// Trocar de seção NÃO dispara nova request.
const getGlobalBanners = unstable_cache(
  async (): Promise<BannerItem[]> => {
    const admin = createAdminClient()
    const { data } = await admin
      .from("banners")
      .select("id,image_path,link_url")
      .eq("is_active", true)
      .eq("section", "global")
      .order("sort_order")

    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    return (data ?? []).map((b) => ({
      id: b.id,
      imageUrl: `${baseUrl}/storage/v1/object/public/banners/${b.image_path}`,
      link_url: b.link_url,
    }))
  },
  ["global-banners"],
  { revalidate: 60 }
)

interface AffiliateLayoutProps {
  children: React.ReactNode
  params: Promise<{ affiliate: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  const branding = await fetchBranding()
  return { title: branding.appName }
}

export default async function AffiliateLayout({ children, params }: AffiliateLayoutProps) {
  const { affiliate } = await params
  const config = await getAffiliateConfig(affiliate)

  if (!config) {
    notFound()
  }

  // Auth check — redireciona para /auth se não autenticado
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/auth?next=/${affiliate}`)
  }

  // Branding dinâmico + banners em paralelo
  const [branding, banners] = await Promise.all([
    fetchBranding(),
    getGlobalBanners(),
  ])
  if (branding.logoUrl) config.logoUrl = branding.logoUrl

  return (
    <div className="flex min-h-screen flex-col">
      <Header config={config} />
      <div className="flex flex-1 flex-col md:flex-row">
        <Sidebar slug={config.slug} />
        {/* Content area: banner global → conteúdo da página → disclaimer */}
        <div className="flex-1 min-w-0 flex flex-col pb-28 md:pb-0">
          <BannerCarousel banners={banners} />
          <main className="flex-1">{children}</main>
          <FooterDisclaimer />
        </div>
      </div>
    </div>
  )
}
