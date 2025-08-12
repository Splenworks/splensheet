import React from "react"

interface FindBarProps {
  query: string
  onQueryChange: (val: string) => void
  onClose: () => void
  onNext: () => void
  onPrev: () => void
  matchIndex: number
  matchCount: number
}

const FindBar: React.FC<FindBarProps> = ({
  query,
  onQueryChange,
  onClose,
  onNext,
  onPrev,
  matchIndex,
  matchCount,
}) => {
  return (
    <div className="absolute top-12 right-4 z-50 flex items-center space-x-2 rounded border border-gray-300 bg-white p-2 text-black shadow dark:border-neutral-600 dark:bg-neutral-800 dark:text-white">
      <input
        autoFocus
        className="w-48 rounded border border-gray-300 bg-transparent px-1 py-0.5 text-sm text-black outline-none dark:border-neutral-600 dark:text-white"
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
      <span className="text-xs text-gray-600 dark:text-gray-300">
        {matchCount > 0 ? `${matchIndex + 1}/${matchCount}` : "0/0"}
      </span>
      <button
        className="px-1 text-sm text-gray-700 hover:text-black dark:text-gray-300 dark:hover:text-white"
        onClick={onPrev}
      >
        ↑
      </button>
      <button
        className="px-1 text-sm text-gray-700 hover:text-black dark:text-gray-300 dark:hover:text-white"
        onClick={onNext}
      >
        ↓
      </button>
      <button
        className="px-1 text-sm text-gray-700 hover:text-black dark:text-gray-300 dark:hover:text-white"
        onClick={onClose}
      >
        ×
      </button>
    </div>
  )
}

export default FindBar

