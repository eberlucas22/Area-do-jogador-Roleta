import { unstable_cache } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { MessageCircle, Send, Camera, PlayCircle, ExternalLink } from "lucide-react"

interface SupportChannel {
  id: string
  name: string
  channel_type: string
  url: string
  image_path: string | null
  description: string | null
  imageUrl: string | null
}

function ChannelIcon({ type }: { type: string }) {
  const size = 26
  switch (type) {
    case "whatsapp":
      return <MessageCircle size={size} style={{ color: "#25D366" }} />
    case "telegram":
      return <Send size={size} style={{ color: "#229ED9" }} />
    case "instagram":
      return <Camera size={size} style={{ color: "#E1306C" }} />
    case "youtube":
      return <PlayCircle size={size} style={{ color: "#FF0000" }} />
    default:
      return <ExternalLink size={size} style={{ color: "var(--brand-primary)" }} />
  }
}

function channelTypeLabel(type: string): string {
  switch (type) {
    case "whatsapp":  return "WhatsApp"
    case "telegram":  return "Telegram"
    case "instagram": return "Instagram"
    case "youtube":   return "YouTube"
    default:          return "Link"
  }
}

function channelPriority(type: string): number {
  if (type === "whatsapp") return 0
  if (type === "telegram") return 1
  return 2
}

// Cache 60s — dados de suporte raramente mudam.
const getChannels = unstable_cache(
  async (): Promise<SupportChannel[]> => {
    const admin = createAdminClient()
    const { data } = await admin
      .from("support_channels")
      .select("id,name,channel_type,url,image_path,description")
      .eq("is_active", true)
      .order("sort_order")

    if (!data || data.length === 0) return []

    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    return data.map((ch) => ({
      ...ch,
      imageUrl: ch.image_path
        ? `${baseUrl}/storage/v1/object/public/support/${ch.image_path}`
        : null,
    }))
  },
  ["support-channels"],
  { revalidate: 60 }
)

export async function SuporteModule() {
  const data = await getChannels()

  if (data.length === 0) {
    return (
      <div style={{ padding: "48px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>
        Nenhum canal de suporte cadastrado ainda.
      </div>
    )
  }

  const channels = [...data].sort(
    (a, b) => channelPriority(a.channel_type) - channelPriority(b.channel_type)
  )

  return (
    <div style={{ padding: "24px 16px", maxWidth: "600px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {channels.map((ch, idx) => {
          const isFirst = idx === 0

          return (
            <a
              key={ch.id}
              href={ch.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-85 transition-opacity"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                padding: "20px",
                borderRadius: "24px",
                backgroundColor: isFirst ? "rgba(139,47,212,0.14)" : "var(--surface-1)",
                textDecoration: "none",
                boxShadow: isFirst
                  ? "var(--shadow-glow), var(--shadow-md)"
                  : "var(--shadow-sm)",
              }}
            >
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "14px",
                  backgroundColor: "var(--surface-2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  overflow: "hidden",
                }}
              >
                {ch.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ch.imageUrl} alt={ch.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <ChannelIcon type={ch.channel_type} />
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: "var(--text-title)",
                    fontWeight: "var(--weight-title)",
                    color: "var(--text-primary)",
                    marginBottom: "2px",
                  }}
                >
                  {ch.name}
                </p>
                {ch.description ? (
                  <p
                    style={{
                      margin: 0,
                      fontSize: "var(--text-body)",
                      color: "var(--text-secondary)",
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {ch.description}
                  </p>
                ) : (
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>
                    {channelTypeLabel(ch.channel_type)}
                  </p>
                )}
              </div>

              {isFirst ? (
                <span
                  style={{
                    flexShrink: 0,
                    padding: "7px 14px",
                    borderRadius: "var(--radius-sm)",
                    backgroundColor: "var(--brand-primary)",
                    color: "#fff",
                    fontSize: "12px",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  }}
                >
                  Entrar agora
                </span>
              ) : (
                <ExternalLink size={18} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
              )}
            </a>
          )
        })}
      </div>
    </div>
  )
}
