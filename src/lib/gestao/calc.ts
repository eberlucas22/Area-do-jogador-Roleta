export type DayStatus = "pending" | "win" | "loss"

export interface CycleDay {
  index: number      // 0-29
  date: string       // YYYY-MM-DD
  status: DayStatus
  end_amount: number // marked = valor real; pending = projeção win
}

export interface Settings {
  stop_win_pct: number   // default 10
  stop_loss_pct: number  // default 40
}

function round2(v: number): number {
  return Math.round(v * 100) / 100
}

/**
 * Propaga os dias do ciclo:
 * - Dias marcados (win/loss): mantém o end_amount REAL armazenado; avança o cursor.
 * - Dias pending: projeta a partir do último valor real usando +stop_win_pct%.
 * Imutável: não modifica o array original.
 */
export function deriveDays(
  initialAmount: number,
  days: CycleDay[],
  settings: Settings
): CycleDay[] {
  let current = initialAmount
  return days.map((day) => {
    if (day.status !== "pending") {
      // Valor real gravado: avança cursor sem recalcular
      current = day.end_amount
      return { ...day }
    }
    // Pending: projeta cenário meta batida
    const projected = round2(current * (1 + settings.stop_win_pct / 100))
    current = projected
    return { ...day, end_amount: projected }
  })
}

/**
 * Saldo real = end_amount do último dia não-pending.
 * Se todos pending, retorna initialAmount.
 */
export function currentBalance(days: CycleDay[], initialAmount: number): number {
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].status !== "pending") return days[i].end_amount
  }
  return initialAmount
}

/**
 * Índice do dia atual = primeiro pending (-1 se ciclo completo).
 */
export function currentDayIndex(days: CycleDay[]): number {
  return days.findIndex((d) => d.status === "pending")
}

/**
 * Deriva o status a partir do valor real vs saldo anterior.
 * win  → end_amount >= prevBalance
 * loss → end_amount <  prevBalance
 */
export function deriveStatus(endAmount: number, prevBalance: number): "win" | "loss" {
  return endAmount >= prevBalance ? "win" : "loss"
}
