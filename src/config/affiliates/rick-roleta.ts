import type { AffiliateConfig } from "@/config/types"

export const config: AffiliateConfig = {
  slug: "rick-roleta",
  displayName: "Rick Roleta",
  logoUrl: "/banners/logo-rick.png",
  modules: {
    bankroll: true,
    playsExplained: true,
    rules: true,
    history: true,
  },
}
