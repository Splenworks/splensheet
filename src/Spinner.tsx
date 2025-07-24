import React from "react"
import { twMerge } from "tailwind-merge"

interface SpinnerProps {
  size?: "small" | "medium" | "large"
  className?: string
}

const Spinner: React.FC<SpinnerProps> = ({ size = "large", className }) => {
  return (
    <div className="flex items-center justify-center">
      <div
        className={twMerge(
          "inline-block animate-spin rounded-full border-solid border-gray-300 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]",
          size === "small" && "size-4 border-2",
          size === "medium" && "size-6 border-3",
          size === "large" && "size-8 border-4",
          className
        )}
        role="status"
      >
        <span className="absolute! -m-px! h-px! w-px! overflow-hidden! border-0! p-0! whitespace-nowrap! [clip:rect(0,0,0,0)]!">
          Loading...
        </span>
      </div>
    </div>
  )
}

export default Spinner
