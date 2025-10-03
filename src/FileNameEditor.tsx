import React, { useEffect, useRef, useState } from "react"

interface FileNameEditorProps {
  fileName: string
  onFileNameChange?: (value: string) => void
}

const FileNameEditor: React.FC<FileNameEditorProps> = ({ fileName, onFileNameChange }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const dot = fileName.lastIndexOf('.')
    const base = dot > 0 ? fileName.slice(0, dot) : fileName
    setInputValue(base)
  }, [fileName])

  useEffect(() => {
    if (!isEditing) return
    const handle = window.setTimeout(() => inputRef.current?.focus(), 0)
    return () => window.clearTimeout(handle)
  }, [isEditing])

  const finishEditing = () => {
    setIsEditing(false)
    const extDot = fileName.lastIndexOf('.')
    const ext = extDot >= 0 ? fileName.slice(extDot) : ''
    const trimmed = inputValue.trim()
    if (!trimmed) {
      const base = ext ? fileName.slice(0, extDot) : fileName
      setInputValue(base)
      return
    }
    const nextName = `${trimmed}${ext}`
    if (nextName !== fileName) onFileNameChange?.(nextName)
  }

  const cancelEditing = () => {
    setIsEditing(false)
    const dot = fileName.lastIndexOf('.')
    const base = dot > 0 ? fileName.slice(0, dot) : fileName
    setInputValue(base)
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        className="px-2 py-0.5 rounded bg-white text-black dark:bg-neutral-700 dark:text-white focus:outline-none border-0 focus:border-2 border-pink-900 dark:border-pink-700 text-center"
        value={inputValue}
        onChange={(event) => setInputValue(event.target.value)}
        onBlur={finishEditing}
        onKeyDown={(event) => {
          if (event.key === "Enter") finishEditing()
          if (event.key === "Escape") cancelEditing()
        }}
      />
    )
  }

  return (
    <button
      type="button"
      className="px-2 py-0.5 rounded hover:bg-gray-300/70 dark:hover:bg-neutral-700/70 cursor-text"
      onClick={() => setIsEditing(true)}
    >
      {fileName}
    </button>
  )
}

export default FileNameEditor
