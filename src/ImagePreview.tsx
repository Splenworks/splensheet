import React, { useRef, useState } from "react"

interface ImagePreviewProps {
  url: string
  delay?: number
  children: React.ReactNode
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ url, delay = 500, children }) => {
  const [show, setShow] = useState(false)
  const timerRef = useRef<number | null>(null)

  const handleMouseEnter = () => {
    timerRef.current = window.setTimeout(() => setShow(true), delay)
  }

  const handleMouseLeave = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setShow(false)
  }

  return (
    <span className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {children}
      {show && (
        <div className="absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 rounded border border-gray-300 bg-white p-1 shadow-lg dark:border-neutral-600 dark:bg-neutral-800">
          <img src={url} alt="preview" className="max-h-64 max-w-[16rem] object-contain" />
        </div>
      )}
    </span>
  )
}

export default ImagePreview
