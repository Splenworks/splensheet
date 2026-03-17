import React, { useEffect, useRef, useState } from "react"
import { getBaseName } from "./utils/string"

interface FileNameEditorProps {
  fileName: string
  onFileNameChange?: (value: string) => void
}

const FileNameEditor: React.FC<FileNameEditorProps> = ({ fileName, onFileNameChange }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [inputValue, setInputValue] = useState(() => getBaseName(fileName))
  const inputRef = useRef<HTMLInputElement>(null)
  const baseFileName = getBaseName(fileName)

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
      setInputValue(baseFileName)
      return
    }
    const nextName = `${trimmed}${ext}`
    if (nextName !== fileName) onFileNameChange?.(nextName)
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setInputValue(baseFileName)
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        className="px-2 py-0.5 rounded bg-white text-black dark:bg-neutral-700 dark:text-white focus:outline-none border-0 focus:border-2 border-gray-900 dark:border-neutral-400 text-center"
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
      onClick={() => {
        setInputValue(baseFileName)
        setIsEditing(true)
      }}
    >
      {fileName}
    </button>
  )
}

export default FileNameEditor
