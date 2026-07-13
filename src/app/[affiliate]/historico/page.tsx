import { HistoricoModule } from "@/components/modules/HistoricoModule"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Histórico · Área do Jogador" }

interface Props {
  params: Promise<{ affiliate: string }>
}

export default async function HistoricoPage({ params }: Props) {
  const { affiliate } = await params
  return <HistoricoModule slug={affiliate} />
}
