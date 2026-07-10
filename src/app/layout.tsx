import type { Metadata } from "next"
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { AgeGate } from "@/components/AgeGate"
import { ToastProvider } from "@/components/Toast"
import { BrandingProvider } from "@/components/BrandingProvider"
import { fetchBranding } from "@/lib/branding"

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
})

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
})

export async function generateMetadata(): Promise<Metadata> {
  const branding = await fetchBranding()
  return {
    title: {
      default: branding.appName,
      template: `%s · ${branding.appName}`,
    },
    description: "Área exclusiva do jogador +18",
    robots: "noindex",
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const branding = await fetchBranding()

  return (
    <html
      lang="pt-BR"
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col antialiased">
        <BrandingProvider value={branding}>
          <ToastProvider>
            <AgeGate>{children}</AgeGate>
          </ToastProvider>
        </BrandingProvider>
      </body>
    </html>
  )
}
