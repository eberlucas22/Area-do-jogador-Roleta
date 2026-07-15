export default function VideosLoading() {
  return (
    <div style={{ padding: "20px 16px 8px", borderBottom: "1px solid var(--border-subtle)", marginBottom: 16 }}>
      <div className="skeleton" style={{ height: 24, width: 80, marginBottom: 8, borderRadius: 8 }} />
      <div className="skeleton" style={{ height: 14, width: 220, borderRadius: 6, marginBottom: 16 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            <div className="skeleton" style={{ aspectRatio: "16/9", borderRadius: 10, marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 14, borderRadius: 6, marginBottom: 4 }} />
            <div className="skeleton" style={{ height: 12, width: "60%", borderRadius: 6 }} />
          </div>
        ))}
      </div>
    </div>
  )
}
