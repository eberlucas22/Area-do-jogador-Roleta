interface HeroCardProps {
  children: React.ReactNode
  className?: string
  /** Override o gradiente padrão roxo */
  gradient?: string
  /** Desativa o shimmer de canto */
  noShimmer?: boolean
}

/** Cartão hero com gradiente roxo diagonal e shimmer */
export function HeroCard({ children, className, gradient, noShimmer }: HeroCardProps) {
  return (
    <div
      className={className}
      style={{
        background: gradient ?? "linear-gradient(145deg, #6B1FA8 0%, #4A0E82 45%, #2A005E 100%)",
        borderRadius: "var(--radius-card)",
        padding: "24px",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 12px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.08)",
      }}
    >
      {/* Shimmer esférico no canto superior direito */}
      {!noShimmer && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "-20px",
            right: "-20px",
            width: "220px",
            height: "220px",
            background: "radial-gradient(circle, rgba(255,255,255,0.09) 0%, transparent 68%)",
            pointerEvents: "none",
          }}
        />
      )}
      {/* Shimmer inferior esquerdo (sutil) */}
      {!noShimmer && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "120px",
            height: "120px",
            background: "radial-gradient(circle, rgba(139,47,212,0.18) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
      )}
      <div style={{ position: "relative", zIndex: 1 }}>
        {children}
      </div>
    </div>
  )
}
