import { VideosModule } from "@/components/modules/VideosModule"
import { BannerCarousel } from "@/components/BannerCarousel"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Vídeos · Área do Jogador" }

export default function VideosPage() {
  return (
    <div>
      <BannerCarousel section="videos" />
      <div
        style={{
          padding: "20px 16px 8px",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <h1
          style={{
            fontSize: "20px",
            fontWeight: 900,
            color: "var(--text-primary)",
            fontFamily: "var(--font-display)",
            margin: 0,
          }}
        >
          Vídeos
        </h1>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px", marginBottom: 0 }}>
          Conteúdo exclusivo do Rick Roleta
        </p>
      </div>
      <VideosModule />
    </div>
  )
}
