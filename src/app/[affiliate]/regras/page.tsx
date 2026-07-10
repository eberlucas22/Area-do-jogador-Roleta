import { RegrasModule } from "@/components/modules/RegrasModule"
import { BannerCarousel } from "@/components/BannerCarousel"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Regras · Área do Jogador" }

export default function RegrasPage() {
  return (
    <>
      <BannerCarousel section="regras" />
      <RegrasModule />
    </>
  )
}
