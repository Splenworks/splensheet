import React from "react"
import Spinner from "./Spinner"
import { twMerge } from "tailwind-merge"

interface SpinnerOverlayProps {
  visible: boolean
  className?: string
}

const SpinnerOverlay: React.FC<SpinnerOverlayProps> = ({ visible, className }) => {
  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-neutral-900/80">
      <Spinner className={twMerge(
        "border-gray-900 dark:border-neutral-400 border-r-transparent dark:border-r-transparent",
        className,
      )} />
    </div>
  )
}

export default SpinnerOverlay
