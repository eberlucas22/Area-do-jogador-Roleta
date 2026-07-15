export default function HistoricoLoading() {
  return (
    <div style={{ padding: "16px" }}>
      {/* Game selector */}
      <div className="skeleton" style={{ height: 50, borderRadius: 14, marginBottom: 16 }} />

      {/* Number grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(44px, 1fr))", gap: 6 }}>
        {Array.from({ length: 37 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ aspectRatio: "1", borderRadius: 8 }} />
        ))}
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <div className="skeleton" style={{ height: 60, flex: 1, borderRadius: 12 }} />
        <div className="skeleton" style={{ height: 60, flex: 1, borderRadius: 12 }} />
        <div className="skeleton" style={{ height: 60, flex: 1, borderRadius: 12 }} />
      </div>
    </div>
  )
}
