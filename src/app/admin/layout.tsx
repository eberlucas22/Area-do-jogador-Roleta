import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { FooterDisclaimer } from "@/components/FooterDisclaimer"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: "var(--bg-base)" }}>
      {/* Admin header */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-4 py-3"
        style={{
          backgroundColor: "rgba(8,0,16,0.95)",
          borderBottom: "1px solid var(--border-subtle)",
          backdropFilter: "blur(10px)",
        }}
      >
        <span
          className="text-sm font-black tracking-tight"
          style={{ fontFamily: "var(--font-display)", color: "var(--brand-primary)" }}
        >
          Rick Roleta · Backoffice
        </span>
        <span
          className="flex h-7 w-10 items-center justify-center rounded-lg text-xs font-black"
          style={{
            backgroundColor: "rgba(139,47,212,0.15)",
            color: "var(--brand-secondary)",
            border: "1px solid var(--border-muted)",
          }}
        >
          +18
        </span>
      </header>

      <div className="flex flex-1 flex-col md:flex-row">
        <AdminSidebar />
        <main className="flex-1 min-w-0 pb-16 md:pb-0">{children}</main>
      </div>

      <FooterDisclaimer />
    </div>
  )
}
