import { JogadasModule } from "@/components/modules/JogadasModule"
import { BannerCarousel } from "@/components/BannerCarousel"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Jogadas · Área do Jogador" }

export default function JogadasPage() {
  return (
    <>
      <BannerCarousel section="jogadas" />
      <JogadasModule />
    </>
  )
}
