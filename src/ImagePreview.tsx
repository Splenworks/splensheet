import React, { useRef, useState } from "react"
import { twJoin } from "tailwind-merge"

interface ImagePreviewProps {
  url: string
  delay?: number
  children: React.ReactNode
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ url, delay = 300, children }) => {
  const [show, setShow] = useState(false)
  const [showAbove, setShowAbove] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const timerRef = useRef<number | null>(null)
  const containerRef = useRef<HTMLSpanElement>(null)

  const handleMouseEnter = () => {
    timerRef.current = window.setTimeout(() => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setShowAbove(rect.top > window.innerHeight / 2)
      }
      setShow(true)
      setImageLoaded(false)
    }, delay)
  }

  const handleMouseLeave = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setShow(false)
    setImageLoaded(false)
  }

  const handleImageLoad = () => {
    setImageLoaded(true)
  }

  const handleImageError = () => {
    setImageLoaded(false)
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
            "absolute left-1/2 z-20 -translate-x-1/2 rounded-md border border-gray-300 bg-white p-1 shadow-lg dark:border-neutral-600 dark:bg-neutral-800",
            showAbove ? "bottom-full mb-2" : "top-full mt-2",
            imageLoaded ? "block" : "hidden",
          )}
        >
          <img
            src={url}
            alt="preview"
            className="max-h-64 max-w-64 object-contain rounded-sm"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        </div>
      )}
    </span>
  )
}

export default ImagePreview
