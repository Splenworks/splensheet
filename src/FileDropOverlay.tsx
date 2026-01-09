import React, { useCallback, useRef, useState } from "react"

interface FileDropOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  onFileDrop: (file: File) => Promise<void> | void
  overlayMessage: React.ReactNode
}

const FileDropOverlay: React.FC<FileDropOverlayProps> = ({
  onFileDrop,
  overlayMessage,
  children,
  className,
  ...rest
}) => {
  const [isDragActive, setIsDragActive] = useState(false)
  const dragCounterRef = useRef(0)
  const {
    onDragEnter: externalDragEnter,
    onDragLeave: externalDragLeave,
    onDragOver: externalDragOver,
    onDrop: externalDrop,
    ...otherProps
  } = rest

  const containsFiles = useCallback((event: React.DragEvent<HTMLElement>) => {
    const dt = event.dataTransfer
    if (!dt) return false
    if (dt.files && dt.files.length > 0) {
      return true
    }
    if (dt.items && dt.items.length > 0) {
      return Array.from(dt.items).some((item) => item.kind === "file")
    }
    return Array.from(dt.types ?? []).includes("Files")
  }, [])

  const handleDragEnter = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      externalDragEnter?.(event)
      if (!containsFiles(event)) return

      event.preventDefault()
      event.stopPropagation()
      dragCounterRef.current += 1
      setIsDragActive(true)
    },
    [containsFiles, externalDragEnter],
  )

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      externalDragOver?.(event)
      if (!containsFiles(event)) return

      event.preventDefault()
      event.stopPropagation()
      event.dataTransfer.dropEffect = "copy"
      setIsDragActive(true)
    },
    [containsFiles, externalDragOver],
  )

  const handleDragLeave = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      externalDragLeave?.(event)
      const nextTarget = event.relatedTarget as Node | null
      const leavingDocument = !event.currentTarget.contains(nextTarget)

      if (!containsFiles(event)) {
        if (leavingDocument) {
          dragCounterRef.current = 0
          setIsDragActive(false)
        }
        return
      }

      event.preventDefault()
      event.stopPropagation()
      dragCounterRef.current = Math.max(dragCounterRef.current - 1, 0)
      if (dragCounterRef.current === 0 || leavingDocument) {
        setIsDragActive(false)
      }
    },
    [containsFiles, externalDragLeave],
  )

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      externalDrop?.(event)
      if (!containsFiles(event)) return

      event.preventDefault()
      event.stopPropagation()

      const file = event.dataTransfer.files?.[0]
      dragCounterRef.current = 0
      setIsDragActive(false)

      if (!file) return

      void Promise.resolve(onFileDrop(file)).catch((error) => {
        console.error("Failed to handle dropped file", error)
      })
    },
    [containsFiles, externalDrop, onFileDrop],
  )

  return (
    <div
      className={className}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      {...otherProps}
    >
      {children}
      {isDragActive && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-neutral-900/80">
          <div className="rounded-xl border-4 border-dashed border-gray-900 bg-white/90 px-8 py-6 text-center text-xl tracking-wide font-semibold text-black shadow-lg dark:border-neutral-600 dark:bg-neutral-900/90 dark:text-white">
            {overlayMessage}
          </div>
        </div>
      )}
    </div>
  )
}

export default FileDropOverlay
