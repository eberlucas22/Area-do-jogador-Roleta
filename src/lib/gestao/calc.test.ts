import { describe, it, expect } from "vitest"
import {
  deriveDays, currentBalance, currentDayIndex, deriveStatus,
  type CycleDay, type Settings,
} from "./calc"

const S: Settings = { stop_win_pct: 10, stop_loss_pct: 40 }

function day(index: number, status: "pending" | "win" | "loss", end_amount = 0): CycleDay {
  return {
    index,
    date: `2025-01-${String(index + 1).padStart(2, "0")}`,
    status,
    end_amount,
  }
}

// ─── deriveDays: pending projection ───────────────────────────────────────
describe("deriveDays — pending projection", () => {
  it("Todos pending: projeta +10% em cascata (arredonda a 2 casas)", () => {
    const result = deriveDays(100, [day(0, "pending"), day(1, "pending")], S)
    expect(result[0].end_amount).toBe(110.00)
    expect(result[1].end_amount).toBe(121.00)
  })

  it("Retorna array imutável: original não é modificado", () => {
    const days = [day(0, "pending"), day(1, "pending")]
    const original = JSON.stringify(days)
    deriveDays(100, days, S)
    expect(JSON.stringify(days)).toBe(original)
  })
})

// ─── deriveDays: real values preserved ────────────────────────────────────
describe("deriveDays — dias marcados mantêm valor real", () => {
  it("Valor real acima da meta (115 > 110): projeta próximo de 115", () => {
    const result = deriveDays(100, [day(0, "win", 115), day(1, "pending")], S)
    expect(result[0].end_amount).toBe(115)
    expect(result[1].end_amount).toBeCloseTo(115 * 1.1, 2)   // 126.50
  })

  it("Valor real entre piso e meta (105): projeta próximo de 105", () => {
    const result = deriveDays(100, [day(0, "win", 105), day(1, "pending")], S)
    expect(result[0].end_amount).toBe(105)
    expect(result[1].end_amount).toBeCloseTo(105 * 1.1, 2)   // 115.50
  })

  it("Valor real abaixo do piso (55, pior que stop_loss=60): projeta de 55", () => {
    const result = deriveDays(100, [day(0, "loss", 55), day(1, "pending")], S)
    expect(result[0].end_amount).toBe(55)
    expect(result[1].end_amount).toBeCloseTo(55 * 1.1, 2)    // 60.50
  })

  it("Mix com valores reais: cascata correta", () => {
    const result = deriveDays(
      100,
      [day(0, "win", 115), day(1, "loss", 80), day(2, "pending")],
      S
    )
    expect(result[0].end_amount).toBe(115)
    expect(result[1].end_amount).toBe(80)
    expect(result[2].end_amount).toBeCloseTo(80 * 1.1, 2)    // 88.00
  })
})

// ─── deriveDays: retroactive correction ───────────────────────────────────
describe("deriveDays — correção retroativa", () => {
  it("Corrigir dia 0 recalcula projeções seguintes", () => {
    const setup = [day(0, "win", 110), day(1, "pending"), day(2, "pending")]
    const r1 = deriveDays(100, setup, S)
    expect(r1[1].end_amount).toBe(121.00)
    expect(r1[2].end_amount).toBeCloseTo(133.1, 1)

    // Corrigir para 95 (abaixo do anterior → loss)
    const corrected = r1.map((d, i) => (i === 0 ? { ...d, end_amount: 95 } : d))
    const r2 = deriveDays(100, corrected, S)
    expect(r2[0].end_amount).toBe(95)
    expect(r2[1].end_amount).toBeCloseTo(95 * 1.1, 2)        // 104.50
    expect(r2[2].end_amount).toBeCloseTo(95 * 1.1 * 1.1, 2)  // 114.95
  })

  it("Dois dias marcados; corrigir segundo mantém primeiro inalterado", () => {
    const setup = [day(0, "win", 110), day(1, "win", 121), day(2, "pending")]
    const r1 = deriveDays(100, setup, S)
    expect(r1[2].end_amount).toBeCloseTo(133.1, 1)

    // Corrigir dia 1 para 115
    const corrected = r1.map((d, i) => (i === 1 ? { ...d, end_amount: 115 } : d))
    const r2 = deriveDays(100, corrected, S)
    expect(r2[0].end_amount).toBe(110)                        // inalterado
    expect(r2[1].end_amount).toBe(115)                        // novo real
    expect(r2[2].end_amount).toBeCloseTo(115 * 1.1, 2)        // 126.50
  })
})

// ─── currentBalance ────────────────────────────────────────────────────────
describe("currentBalance", () => {
  it("Retorna initialAmount se todos pending", () => {
    const days = deriveDays(500, [day(0, "pending"), day(1, "pending")], S)
    expect(currentBalance(days, 500)).toBe(500)
  })

  it("Retorna end_amount real do último dia marcado", () => {
    const days = deriveDays(100, [day(0, "win", 115), day(1, "pending")], S)
    expect(currentBalance(days, 100)).toBe(115)
  })
})

// ─── currentDayIndex ───────────────────────────────────────────────────────
describe("currentDayIndex", () => {
  it("Retorna 0 se todos pending", () => {
    expect(currentDayIndex([day(0, "pending"), day(1, "pending")])).toBe(0)
  })

  it("Retorna -1 se ciclo completo (sem pending)", () => {
    expect(currentDayIndex([day(0, "win", 110), day(1, "win", 121)])).toBe(-1)
  })

  it("Retorna índice do primeiro pending", () => {
    expect(
      currentDayIndex([day(0, "win", 110), day(1, "loss", 66), day(2, "pending")])
    ).toBe(2)
  })
})

// ─── deriveStatus ──────────────────────────────────────────────────────────
describe("deriveStatus", () => {
  it("win quando end_amount >= prevBalance", () => {
    expect(deriveStatus(110, 100)).toBe("win")
    expect(deriveStatus(100, 100)).toBe("win")  // empate = win
  })

  it("loss quando end_amount < prevBalance", () => {
    expect(deriveStatus(99, 100)).toBe("loss")
    expect(deriveStatus(55, 100)).toBe("loss")
  })
})
