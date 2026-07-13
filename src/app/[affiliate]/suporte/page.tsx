import { SuporteModule } from "@/components/modules/SuporteModule"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Suporte · Área do Jogador" }

export default function SuportePage() {
  return (
    <div>
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
          Suporte
        </h1>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px", marginBottom: 0 }}>
          Fale com o afiliado pelos seus canais oficiais
        </p>
      </div>
      <SuporteModule />
    </div>
  )
}
