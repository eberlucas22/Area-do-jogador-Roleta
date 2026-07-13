import { FooterDisclaimer } from "@/components/FooterDisclaimer"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Termos de Uso · Área do Jogador" }

export default function TermosPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "var(--bg-base)" }}>
      <main style={{ flex: 1, maxWidth: "720px", margin: "0 auto", padding: "40px 20px", width: "100%" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 900, color: "var(--text-primary)", fontFamily: "var(--font-display)", marginBottom: "8px" }}>
          Termos de Uso
        </h1>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "32px" }}>
          Última atualização: julho de 2025
        </p>

        <section style={{ marginBottom: "28px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "10px" }}>
            1. Responsável pelo conteúdo
          </h2>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.7" }}>
            A Área do Jogador é uma plataforma de conteúdo educativo sobre gestão de banca e estratégias de apostas.
            Todo o conteúdo disponibilizado tem caráter informativo e educacional, não constituindo aconselhamento financeiro ou
            garantia de resultados. O acesso é destinado exclusivamente a maiores de 18 anos.
          </p>
        </section>

        <section style={{ marginBottom: "28px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "10px" }}>
            2. Restrição de idade
          </h2>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.7" }}>
            O acesso à plataforma é estritamente proibido a menores de 18 anos. Ao se cadastrar, você declara ter 18 anos ou mais
            e ser legalmente capaz de usar este serviço na sua jurisdição.
          </p>
        </section>

        <section style={{ marginBottom: "28px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "10px" }}>
            3. Dados coletados
          </h2>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.7" }}>
            Ao se cadastrar, coletamos: nome completo, endereço de e-mail e número de WhatsApp.
            Esses dados são utilizados exclusivamente para comunicação sobre o conteúdo da plataforma e,
            caso você autorize, envio de materiais e novidades.
          </p>
        </section>

        <section style={{ marginBottom: "28px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "10px" }}>
            4. Finalidade e base legal
          </h2>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.7" }}>
            O tratamento de dados é realizado com base no seu consentimento (Art. 7º, I da LGPD).
            O consentimento para comunicações de marketing é opcional e pode ser revogado a qualquer momento.
          </p>
        </section>

        <section style={{ marginBottom: "28px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "10px" }}>
            5. Como revogar o consentimento
          </h2>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.7" }}>
            Você pode revogar seu consentimento a qualquer momento acessando seu perfil na plataforma ou
            entrando em contato pelos canais de suporte. A revogação não afeta o tratamento realizado anteriormente.
          </p>
        </section>

        <section style={{ marginBottom: "28px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "10px" }}>
            6. Responsabilidade
          </h2>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.7" }}>
            Apostas e jogos envolvem risco financeiro real. O conteúdo educativo desta plataforma não garante
            quaisquer resultados financeiros. Jogue com responsabilidade. Se precisar de ajuda, acesse{" "}
            <a href="https://jogoresponsavel.gov.br" target="_blank" rel="noopener noreferrer" style={{ color: "var(--brand-secondary)" }}>
              jogoresponsavel.gov.br
            </a>.
          </p>
        </section>
      </main>
      <FooterDisclaimer />
    </div>
  )
}
