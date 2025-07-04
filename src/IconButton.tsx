import React from "react"
import { twMerge } from "tailwind-merge"

interface IconButtonProps {
  svgIcon: React.FunctionComponent<{ className?: string }>
  id?: string
  className?: string
  onClick?: () => void
}

const IconButton: React.FC<IconButtonProps> = ({
  svgIcon,
  id,
  className,
  onClick,
}) => {
  return (
    <button
      id={id}
      className={twMerge(
        "group hover:bg-opacity-50 flex size-7 cursor-pointer items-center justify-center rounded-full transition-colors duration-300 ease-in-out hover:bg-zinc-400 dark:hover:bg-zinc-600",
        className,
      )}
      onClick={onClick}
    >
      {React.createElement(svgIcon, { className: "size-4 text-black dark:text-white group-hover:text-white" })}
    </button>
  )
}

export default IconButton
