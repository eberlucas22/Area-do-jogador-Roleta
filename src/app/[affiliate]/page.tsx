import { redirect } from "next/navigation"
import { notFound } from "next/navigation"
import type { AffiliateConfig } from "@/config/types"

async function getAffiliateConfig(slug: string): Promise<AffiliateConfig | null> {
  try {
    const mod = await import(`@/config/affiliates/${slug}`)
    return mod.config as AffiliateConfig
  } catch {
    return null
  }
}

interface AffiliatePageProps {
  params: Promise<{ affiliate: string }>
}

export default async function AffiliatePage({ params }: AffiliatePageProps) {
  const { affiliate } = await params
  const config = await getAffiliateConfig(affiliate)

  if (!config) {
    notFound()
  }

  redirect(`/${affiliate}/banca`)
}
