export interface AffiliateConfig {
  slug: string
  displayName: string
  logoUrl?: string
  avatarUrl?: string
  telegramUrl?: string
  brandOverrides?: Partial<Record<string, string>>
  modules: {
    bankroll: boolean
    playsExplained: boolean
    rules: boolean
    history: boolean
  }
  ctaTrackingParams?: string
}
