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
        "hover:bg-opacity-50 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition-colors duration-300 ease-in-out hover:bg-zinc-500",
        className,
      )}
      onClick={onClick}
    >
      {React.createElement(svgIcon, { className: "w-6 h-6 text-white" })}
      {}
    </button>
  )
}

export default IconButton
