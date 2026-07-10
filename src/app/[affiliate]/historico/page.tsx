import { HistoricoModule } from "@/components/modules/HistoricoModule"
import { BannerCarousel } from "@/components/BannerCarousel"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Histórico · Área do Jogador" }

interface Props {
  params: Promise<{ affiliate: string }>
}

export default async function HistoricoPage({ params }: Props) {
  const { affiliate } = await params
  return (
    <>
      <BannerCarousel section="historico" />
      <HistoricoModule slug={affiliate} />
    </>
  )
}
