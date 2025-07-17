import { FC } from "react"
import { useDarkmode } from "./hooks/useDarkmode"

const pink500 = "#ec4899"
const pink700 = "#be185d"
const pink900 = "#831843"

const SheetIcon: FC<{ className?: string }> = ({ className }) => {
  const { darkMode } = useDarkmode()
  return (
    <svg width="800" height="800" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={pink700} />
          <stop offset="100%" stopColor={darkMode ? pink500 : pink900} />
        </linearGradient>
      </defs>
      <path
        fill="url(#gradient)"
        d="m4 7c0-1.6568 1.3432-3 3-3h10c1.6569 0 3 1.3432 3 3v10c0 1.6569-1.3431 3-3 3h-10c-1.6568 0-3-1.3431-3-3v-10zm3-1c-0.55228 0-1 0.44772-1 1v4h5v-5h-4zm6 0v5h5v-4c0-0.55228-0.4477-1-1-1h-4zm5 7h-5v5h4c0.5523 0 1-0.4477 1-1v-4zm-7 5v-5h-5v4c0 0.5523 0.44772 1 1 1h4z"
        clip-rule="evenodd"
        fill-rule="evenodd" />
    </svg>
  )
}

export default SheetIcon
