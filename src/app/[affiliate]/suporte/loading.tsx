export default function SuporteLoading() {
  return (
    <div style={{ padding: "20px 16px 8px", borderBottom: "1px solid var(--border-subtle)", marginBottom: 0 }}>
      <div className="skeleton" style={{ height: 24, width: 100, marginBottom: 8, borderRadius: 8 }} />
      <div className="skeleton" style={{ height: 14, width: 280, borderRadius: 6, marginBottom: 24 }} />
      <div style={{ maxWidth: "600px", display: "flex", flexDirection: "column", gap: 12 }}>
        {[92, 72, 72].map((h, i) => (
          <div key={i} className="skeleton" style={{ height: h, borderRadius: 24 }} />
        ))}
      </div>
    </div>
  )
}
