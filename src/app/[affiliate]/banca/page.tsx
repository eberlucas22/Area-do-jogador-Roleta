import { BancaModule } from "@/components/modules/BancaModule"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Banca · Área do Jogador" }

export default function BancaPage() {
  return <BancaModule />
}
