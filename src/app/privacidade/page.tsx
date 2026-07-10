import { FooterDisclaimer } from "@/components/FooterDisclaimer"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Política de Privacidade · Rick Roleta" }

export default function PrivacidadePage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "var(--bg-base)" }}>
      <main style={{ flex: 1, maxWidth: "720px", margin: "0 auto", padding: "40px 20px", width: "100%" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 900, color: "var(--text-primary)", fontFamily: "var(--font-display)", marginBottom: "8px" }}>
          Política de Privacidade
        </h1>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "32px" }}>
          Última atualização: julho de 2025
        </p>

        <section style={{ marginBottom: "28px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "10px" }}>
            1. Dados coletados e finalidade
          </h2>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.7" }}>
            Coletamos os seguintes dados pessoais no momento do cadastro:
          </p>
          <ul style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.7", paddingLeft: "20px", marginTop: "8px" }}>
            <li><strong>Nome completo</strong> — identificação na plataforma</li>
            <li><strong>E-mail</strong> — autenticação e comunicação</li>
            <li><strong>WhatsApp</strong> — comunicação opcional mediante consentimento</li>
          </ul>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.7", marginTop: "10px" }}>
            Também coletamos dados de uso da plataforma (histórico de banca, ciclos de gestão) para fornecer
            as funcionalidades do serviço.
          </p>
        </section>

        <section style={{ marginBottom: "28px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "10px" }}>
            2. Parceiros e afiliados
          </h2>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.7" }}>
            A plataforma pode exibir links para plataformas de cassino parceiras. Ao acessar esses links,
            você estará sujeito às políticas de privacidade de cada plataforma parceira, sobre as quais
            não temos controle. Não compartilhamos seus dados pessoais com terceiros sem seu consentimento expresso.
          </p>
        </section>

        <section style={{ marginBottom: "28px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "10px" }}>
            3. Prazo de retenção
          </h2>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.7" }}>
            Seus dados serão mantidos enquanto sua conta estiver ativa ou pelo prazo necessário para cumprir
            obrigações legais. Você pode solicitar a exclusão a qualquer momento.
          </p>
        </section>

        <section style={{ marginBottom: "28px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "10px" }}>
            4. Seus direitos (LGPD)
          </h2>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.7" }}>
            Nos termos da Lei nº 13.709/2018 (LGPD), você tem direito a:
          </p>
          <ul style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.7", paddingLeft: "20px", marginTop: "8px" }}>
            <li><strong>Acesso</strong> — consultar quais dados temos sobre você</li>
            <li><strong>Correção</strong> — atualizar dados incorretos ou incompletos</li>
            <li><strong>Exclusão</strong> — solicitar a remoção dos seus dados</li>
            <li><strong>Portabilidade</strong> — receber seus dados em formato estruturado</li>
            <li><strong>Revogação do consentimento</strong> — retirar autorização a qualquer momento</li>
          </ul>
        </section>

        <section style={{ marginBottom: "28px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "10px" }}>
            5. Contato
          </h2>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.7" }}>
            Para exercer seus direitos ou tirar dúvidas sobre esta política, entre em contato pelos canais
            de suporte disponíveis na plataforma (seção Suporte).
          </p>
        </section>
      </main>
      <FooterDisclaimer />
    </div>
  )
}
