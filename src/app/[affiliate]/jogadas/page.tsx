import { JogadasModule } from "@/components/modules/JogadasModule"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Jogadas · Área do Jogador" }

export default function JogadasPage() {
  return <JogadasModule />
}
