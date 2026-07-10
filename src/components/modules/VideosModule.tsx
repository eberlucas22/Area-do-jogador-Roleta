"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Play } from "lucide-react"

interface Video {
  id: string
  video_id: string
  title: string | null
}

function VideoCard({ video }: { video: Video }) {
  const [playing, setPlaying] = useState(false)
  const thumb = `https://i.ytimg.com/vi/${video.video_id}/hqdefault.jpg`
  const embedUrl = `https://www.youtube-nocookie.com/embed/${video.video_id}?autoplay=1`

  return (
    <div
      style={{
        backgroundColor: "var(--surface-1)",
        borderRadius: "20px",
        overflow: "hidden",
        boxShadow: "var(--shadow-md)",
      }}
    >
      <div style={{ position: "relative", aspectRatio: "16/9", backgroundColor: "#000" }}>
        {playing ? (
          <iframe
            src={embedUrl}
            title={video.title ?? "Vídeo"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
          />
        ) : (
          <button
            onClick={() => setPlaying(true)}
            aria-label="Reproduzir vídeo"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              padding: 0,
              border: "none",
              cursor: "pointer",
              background: "none",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumb}
              alt={video.title ?? "Vídeo"}
              loading="lazy"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            {/* Play overlay */}
            <span
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(0,0,0,0.35)",
                transition: "background-color 200ms",
              }}
              onMouseOver={(e) => ((e.currentTarget as HTMLSpanElement).style.backgroundColor = "rgba(0,0,0,0.5)")}
              onMouseOut={(e) => ((e.currentTarget as HTMLSpanElement).style.backgroundColor = "rgba(0,0,0,0.35)")}
            >
              <span
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  background: "linear-gradient(145deg, #a855f7 0%, #8b2fd4 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 28px rgba(139,47,212,0.7), 0 4px 16px rgba(0,0,0,0.4)",
                }}
              >
                <Play size={24} fill="#fff" color="#fff" />
              </span>
            </span>
          </button>
        )}
      </div>

      {video.title && (
        <div style={{ padding: "14px 16px" }}>
          <p
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "var(--text-primary)",
              lineHeight: 1.4,
              margin: 0,
            }}
          >
            {video.title}
          </p>
        </div>
      )}
    </div>
  )
}

export function VideosModule() {
  const [videos, setVideos] = useState<Video[] | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from("videos")
      .select("id,video_id,title")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => setVideos(data ?? []))
  }, [])

  if (videos === null) {
    return (
      <div style={{ padding: "24px 16px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "12px",
          }}
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="skeleton"
              style={{ aspectRatio: "16/9", borderRadius: "var(--radius-md)" }}
            />
          ))}
        </div>
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div style={{ padding: "48px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>
        Nenhum vídeo disponível ainda.
      </div>
    )
  }

  return (
    <div style={{ padding: "24px 16px" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "16px",
        }}
      >
        {videos.map((v) => (
          <VideoCard key={v.id} video={v} />
        ))}
      </div>
    </div>
  )
}
