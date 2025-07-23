import React, { useRef, useState } from "react"

interface ImagePreviewProps {
  url: string
  delay?: number
  children: React.ReactNode
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ url, delay = 500, children }) => {
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
          className={
            showAbove
              ?
              "absolute left-1/2 bottom-full z-20 mb-2 -translate-x-1/2 rounded border border-gray-300 bg-white p-1 shadow-lg dark:border-neutral-600 dark:bg-neutral-800"
              :
              "absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 rounded border border-gray-300 bg-white p-1 shadow-lg dark:border-neutral-600 dark:bg-neutral-800"
          }
          style={{ display: imageLoaded ? 'block' : 'none' }}
        >
          <img
            src={url}
            alt="preview"
            className="max-h-64 max-w-[16rem] object-contain"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        </div>
      )}
    </span>
  )
}

export default ImagePreview
