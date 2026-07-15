export default function BancaLoading() {
  return (
    <div style={{ padding: "20px 16px", maxWidth: "520px" }}>
      {/* Header */}
      <div className="skeleton" style={{ height: 22, width: 160, marginBottom: 20, borderRadius: 8 }} />

      {/* Cycle card */}
      <div style={{
        background: "var(--surface-2)",
        borderRadius: 20,
        padding: "20px",
        marginBottom: 14,
      }}>
        <div className="skeleton" style={{ height: 14, width: 100, marginBottom: 14, borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 8, width: "100%", borderRadius: 99, marginBottom: 20 }} />

        {/* Day grid 6 columns × 5 rows = 30 days */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ aspectRatio: "1", borderRadius: 8 }} />
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div className="skeleton" style={{ height: 72, borderRadius: 14 }} />
        <div className="skeleton" style={{ height: 72, borderRadius: 14 }} />
      </div>
    </div>
  )
}
