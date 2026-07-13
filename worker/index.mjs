import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const CHANNEL = process.env.CHANNEL ?? "roleta_brasileira_playtech_results"

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("[worker] SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

console.log(`[worker] Iniciando — canal: ${CHANNEL}`)

function connect() {
  const channel = supabase
    .channel(CHANNEL, {
      config: {
        private: true,
        broadcast: { self: false },
      },
    })
    .on("broadcast", { event: "roulette_result" }, async (msg) => {
      const payload = msg?.payload
      const num = payload?.result

      if (typeof num !== "number" || num < 0 || num > 36) {
        console.warn("[worker] Payload inválido recebido:", JSON.stringify(payload))
        return
      }

      console.log(`[worker] Número recebido: ${num}`)

      const { error } = await supabase
        .from("roulette_results")
        .insert({ channel: CHANNEL, number: num, multipliers: payload?.multipliers ?? null })

      if (error) {
        console.error("[worker] Erro ao salvar:", error.message)
      } else {
        console.log(`[worker] ✓ Salvo: ${num}`)
      }
    })
    .subscribe((status) => {
      console.log(`[worker] Status: ${status}`)

      if (status === "CHANNEL_ERROR" || status === "CLOSED") {
        console.warn("[worker] Canal perdido — reconectando em 5s...")
        setTimeout(connect, 5000)
      }
    })
}

connect()

// Manter processo vivo
process.on("SIGTERM", () => process.exit(0))
