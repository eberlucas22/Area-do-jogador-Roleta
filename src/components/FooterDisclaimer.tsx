export function FooterDisclaimer() {
  return (
    <footer
      style={{
        width: "100%",
        padding: "16px",
        background: "transparent",
      }}
    >
      <p
        style={{
          margin: "0 auto",
          maxWidth: "860px",
          textAlign: "center",
          fontSize: "11px",
          lineHeight: "1.5",
          color: "var(--text-muted)",
        }}
      >
        <strong style={{ color: "var(--text-secondary)" }}>+18 · Jogue com responsabilidade.</strong>{" "}
        Apostas envolvem risco financeiro e podem causar dependência — destinado exclusivamente a maiores de 18 anos.
        Acesse jogoresponsavel.gov.br se precisar de ajuda.
      </p>
    </footer>
  )
}
