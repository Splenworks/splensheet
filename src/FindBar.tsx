import React, { forwardRef, useImperativeHandle, useRef } from "react"

interface FindBarProps {
  query: string
  onQueryChange: (val: string) => void
  onClose: () => void
  onNext: () => void
  onPrev: () => void
  matchIndex: number
  matchCount: number
}

export interface FindBarRef {
  focus: () => void
}

const FindBar = forwardRef<FindBarRef, FindBarProps>(({
  query,
  onQueryChange,
  onClose,
  onNext,
  onPrev,
  matchIndex,
  matchCount,
}, ref) => {
  const inputRef = useRef<HTMLInputElement>(null)

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus()
    }
  }), [])

  return (
    <div className="flex items-center space-x-1 text-black dark:text-white">
      <input
        ref={inputRef}
        autoFocus
        className="h-7 w-32 rounded border border-gray-300 bg-transparent px-1 py-0.5 text-xs text-black outline-none dark:border-neutral-600 dark:text-white focus:outline-pink-900 dark:focus:outline-pink-700"
        placeholder="Find..."
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            if (e.shiftKey) {
              onPrev()
            } else {
              onNext()
            }
          } else if (e.key === "Escape") {
            onClose()
          }
        }}
      />
      <span className="text-xs text-gray-600 dark:text-gray-300 min-w-max">
        {matchCount > 0 ? `${matchIndex + 1}/${matchCount}` : "0/0"}
      </span>
      <button
        className="px-1 text-sm text-gray-700 hover:text-black dark:text-gray-300 dark:hover:text-white"
        onClick={onPrev}
        title="Previous match (Shift+Enter)"
      >
        ↑
      </button>
      <button
        className="px-1 text-sm text-gray-700 hover:text-black dark:text-gray-300 dark:hover:text-white"
        onClick={onNext}
        title="Next match (Enter)"
      >
        ↓
      </button>
    </div>
  )
})

FindBar.displayName = 'FindBar'

export default FindBar

