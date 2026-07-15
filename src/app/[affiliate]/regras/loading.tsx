export default function RegrasLoading() {
  return (
    <div style={{ padding: "20px 16px" }}>
      <div className="skeleton" style={{ height: 22, width: 100, marginBottom: 16, borderRadius: 8 }} />
      {/* Material hero card */}
      <div className="skeleton" style={{ height: 110, borderRadius: 20, marginBottom: 14 }} />
      {/* Accordion items */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {[52, 52, 52, 52, 52].map((h, i) => (
          <div key={i} className="skeleton" style={{ height: h, borderRadius: 14 }} />
        ))}
      </div>
    </div>
  )
}
