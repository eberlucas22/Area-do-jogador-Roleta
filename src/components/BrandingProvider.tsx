"use client"

import { createContext, useContext } from "react"
import type { BrandingData } from "@/lib/branding"

const BrandingContext = createContext<BrandingData>({
  logoUrl: null,
  logoCompactUrl: null,
  appName: "Rick Roleta",
})

export function BrandingProvider({
  value,
  children,
}: {
  value: BrandingData
  children: React.ReactNode
}) {
  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>
}

export function useBranding(): BrandingData {
  return useContext(BrandingContext)
}
