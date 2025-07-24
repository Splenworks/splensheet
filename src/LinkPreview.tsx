import React, { useRef, useState, useEffect, useCallback } from "react"
import { twJoin } from "tailwind-merge"
import Spinner from "./Spinner"

interface LinkPreviewProps {
  url: string
  delay?: number
  children: React.ReactNode
}

interface Metadata {
  title?: string
  thumbnail?: string
  author?: string
  text?: string
  lastModified?: string
}

const fetchYouTube = async (url: string): Promise<Metadata> => {
  const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`)
  if (!res.ok) throw new Error("noembed failed")
  const data = await res.json()
  return { title: data.title as string, thumbnail: data.thumbnail_url as string }
}

const fetchGeneric = async (url: string): Promise<Metadata> => {
  const res = await fetch(url)
  const text = await res.text()
  const match = text.match(/<title>(.*?)<\/title>/i)
  return { title: match ? match[1] : url }
}

const LinkPreview: React.FC<LinkPreviewProps> = ({ url, delay = 300, children }) => {
  const [show, setShow] = useState(false)
  const [showAbove, setShowAbove] = useState(false)
  const [metadata, setMetadata] = useState<Metadata | null>(null)
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<number | null>(null)
  const containerRef = useRef<HTMLSpanElement>(null)

  const loadMetadata = useCallback(async () => {
    try {
      const u = new URL(url)
      setLoading(true)
      if (u.hostname.includes("youtube.com") || u.hostname.includes("youtu.be")) {
        setMetadata(await fetchYouTube(url))
      } else {
        setMetadata(await fetchGeneric(url))
      }
    } catch {
      setMetadata(null)
    } finally {
      setLoading(false)
    }
  }, [url])

  useEffect(() => {
    if (show && !metadata && !loading) {
      loadMetadata()
    }
  }, [show, metadata, loading, loadMetadata])

  const handleMouseEnter = () => {
    timerRef.current = window.setTimeout(() => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setShowAbove(rect.top > window.innerHeight / 2)
      }
      setShow(true)
    }, delay)
  }

  const handleMouseLeave = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setShow(false)
  }

  return (
    <span
      ref={containerRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {show && (
        <div
          className={twJoin(
            "absolute max-w-64 left-1/2 z-20 -translate-x-1/2 rounded-md border border-gray-300 bg-white p-2 shadow-lg dark:border-neutral-600 dark:bg-neutral-800 text-xs",
            showAbove ? "bottom-full mb-2" : "top-full mt-2",
          )}
        >
          {loading && <Spinner />}
          {metadata && (
            <div className="flex flex-col gap-2">
              {metadata.title && (
                <div className="font-bold truncate" title={metadata.title}>
                  {metadata.title}
                </div>
              )}
              {metadata.thumbnail && (
                <img
                  src={metadata.thumbnail}
                  alt="thumbnail"
                  className="object-cover rounded"
                />
              )}
            </div>
          )}
        </div>
      )}
    </span>
  )
}

export default LinkPreview
