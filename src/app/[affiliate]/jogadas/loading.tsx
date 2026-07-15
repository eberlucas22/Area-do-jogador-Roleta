export default function JogadasLoading() {
  return (
    <div style={{ padding: "20px 16px" }}>
      <div className="skeleton" style={{ height: 22, width: 120, marginBottom: 16, borderRadius: 8 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[56, 56, 56, 56, 56].map((h, i) => (
          <div key={i} className="skeleton" style={{ height: h, borderRadius: 14 }} />
        ))}
      </div>
    </div>
  )
}
