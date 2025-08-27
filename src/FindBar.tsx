import { forwardRef, useImperativeHandle, useRef } from "react"
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline"
import Tooltip from "./Tooltip"
import { twJoin } from "tailwind-merge"
import IconButton from "./IconButton"

interface FindBarProps {
  query: string
  onQueryChange: (val: string) => void
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
    <div className="flex items-center space-x-2 text-black dark:text-white">
      <div className="relative">
        <div className="absolute left-1 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <MagnifyingGlassIcon className="w-3 h-3 text-gray-400 dark:text-gray-500" />
        </div>
        <input
          ref={inputRef}
          className={twJoin(
            "h-7 w-32 rounded border border-gray-300 pl-4.5 pr-1 py-0.5 text-xs text-black dark:border-neutral-600 dark:text-white",
            "focus:outline-2 focus:outline-pink-900 dark:focus:outline-pink-700",
            query ? "bg-white dark:bg-neutral-700" : "bg-transparent",
            "focus:bg-white dark:focus:bg-neutral-700",
            "placeholder:text-gray-500 dark:placeholder:text-gray-400"
          )}
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
              onQueryChange("")
              inputRef.current?.blur()
            }
          }}
        />
      </div>
      {query && (
        <div className="flex items-center">
          <span className="text-xs text-gray-600 dark:text-gray-300 min-w-max">
            {matchCount > 0 ? `${matchIndex + 1}/${matchCount}` : "0/0"}
          </span>
          {matchCount > 0 && (<>
            <Tooltip text="Previous" place="bottom" className="rounded-full">
              <button
                className="text-sm text-gray-700 hover:text-white dark:text-gray-300 dark:hover:text-white size-5 rounded-full transition-colors duration-300 ease-in-out hover:bg-zinc-400 dark:hover:bg-zinc-600 cursor-pointer focus:outline-pink-900 dark:focus:outline-pink-700"
                onClick={onPrev}
              >
                ↑
              </button>
            </Tooltip>
            <Tooltip text="Next" place="bottom" className="rounded-full -m-1">
              <button
                className="text-sm text-gray-700 hover:text-white dark:text-gray-300 dark:hover:text-white size-5 rounded-full transition-colors duration-300 ease-in-out hover:bg-zinc-400 dark:hover:bg-zinc-600 cursor-pointer focus:outline-pink-900 dark:focus:outline-pink-700"
                onClick={onNext}
              >
                ↓
              </button>
            </Tooltip>
          </>
          )}
        </div>
      )}
    </div>
  )
})

FindBar.displayName = 'FindBar'

export default FindBar

