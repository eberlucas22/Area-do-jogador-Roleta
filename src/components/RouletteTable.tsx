const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36])

const TABLE_ROWS = [
  [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
  [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
  [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
]

function getNumColor(n: number): "red" | "black" | "green" {
  if (n === 0) return "green"
  return RED_NUMBERS.has(n) ? "red" : "black"
}

// Highlight accent: roxo vibrante do Rick Roleta
const HL_COLOR = "#c084fc"      // brand-secondary
const HL_FILL  = "rgba(139,47,212,0.20)"

interface RouletteTableProps {
  highlighted?: number[]
}

const CW = 38
const CH = 42
const ZERO_W = 44

export function RouletteTable({ highlighted = [] }: RouletteTableProps) {
  const hlSet = new Set(highlighted)
  const totalW = ZERO_W + 12 * CW
  const totalH = 3 * CH

  return (
    <>
      <div className="w-full overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" as React.CSSProperties["WebkitOverflowScrolling"] }}>
        <svg
          viewBox={`0 0 ${totalW} ${totalH}`}
          width={totalW}
          height={totalH}
          style={{ display: "block" }}
          aria-label="Mesa de roleta europeia"
        >
          {/* 0 — verde */}
          {(() => {
            const isHl = hlSet.has(0)
            return (
              <g key="zero" style={isHl ? { filter: "drop-shadow(0 0 5px rgba(139,47,212,0.8))" } : undefined}>
                <rect
                  x={1} y={1}
                  width={ZERO_W - 2} height={totalH - 2}
                  rx={5}
                  fill={isHl ? "#15803d" : "#166534"}
                  stroke={isHl ? HL_COLOR : "#1a5c2a"}
                  strokeWidth={isHl ? 2.5 : 1}
                />
                {isHl && (
                  <rect x={3} y={3} width={ZERO_W - 6} height={totalH - 6} rx={3} fill={HL_FILL} />
                )}
                <text
                  x={ZERO_W / 2} y={totalH / 2}
                  textAnchor="middle" dominantBaseline="middle"
                  fill={isHl ? HL_COLOR : "white"} fontSize={16} fontWeight="bold"
                  fontFamily="monospace"
                >0</text>
              </g>
            )
          })()}

          {/* Numbered cells */}
          {TABLE_ROWS.map((row, rowIdx) =>
            row.map((num, colIdx) => {
              const x = ZERO_W + colIdx * CW
              const y = rowIdx * CH
              const color = getNumColor(num)
              const isHl = hlSet.has(num)
              const dimmed = highlighted.length > 0 && !isHl

              const fillBase = color === "red" ? "#b91c1c" : "#262626"
              const fillHl   = color === "red" ? "#7e1c9b" : "#2d1a40"
              const strokeBase = color === "red" ? "#7f1d1d" : "#3d3d3d"

              return (
                <g
                  key={num}
                  style={{
                    opacity: dimmed ? 0.3 : 1,
                    transition: "opacity 200ms",
                    ...(isHl ? { filter: "drop-shadow(0 0 5px rgba(139,47,212,0.8))" } : {}),
                  }}
                >
                  <rect
                    x={x + 0.5} y={y + 0.5}
                    width={CW - 1} height={CH - 1}
                    rx={3}
                    fill={isHl ? fillHl : fillBase}
                    stroke={isHl ? HL_COLOR : strokeBase}
                    strokeWidth={isHl ? 2 : 1}
                  />
                  {isHl && (
                    <rect x={x + 3} y={y + 3} width={CW - 6} height={CH - 6} rx={2} fill={HL_FILL} />
                  )}
                  <text
                    x={x + CW / 2} y={y + CH / 2}
                    textAnchor="middle" dominantBaseline="middle"
                    fill={isHl ? HL_COLOR : "white"}
                    fontSize={13} fontWeight={isHl ? "bold" : "normal"}
                    fontFamily="monospace"
                  >
                    {num}
                  </text>
                </g>
              )
            })
          )}
        </svg>
      </div>
      <p className="md:hidden" style={{ textAlign: "center", fontSize: "10px", color: "var(--text-muted)", marginTop: "4px" }}>
        ← deslize para ver a mesa completa →
      </p>
    </>
  )
}
