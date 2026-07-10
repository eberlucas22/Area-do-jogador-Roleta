import { notFound, redirect } from "next/navigation"
import type { Metadata } from "next"
import { Header } from "@/components/Header"
import { FooterDisclaimer } from "@/components/FooterDisclaimer"
import { Sidebar } from "@/components/Sidebar"
import { createClient } from "@/lib/supabase/server"
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

  // Branding dinâmico — override da logo e nome do config estático
  const branding = await fetchBranding()
  if (branding.logoUrl) config.logoUrl = branding.logoUrl

  return (
    <div className="flex min-h-screen flex-col">
      <Header config={config} />
      <div className="flex flex-1 flex-col md:flex-row">
        <Sidebar slug={config.slug} />
        {/* Content area: page content → disclaimer */}
        <div className="flex-1 min-w-0 flex flex-col pb-28 md:pb-0">
          <main className="flex-1">{children}</main>
          <FooterDisclaimer />
        </div>
      </div>
    </div>
  )
}
