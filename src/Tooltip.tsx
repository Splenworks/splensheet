import React, { PropsWithChildren } from "react"
import { twJoin, twMerge } from "tailwind-merge"

interface TooltipProps {
  text: string
  place?: "bottom" | "top"
  align?: "left" | "right" | "center"
  className?: string
}

const Tooltip: React.FC<PropsWithChildren<TooltipProps>> = ({
  children,
  text,
  place = "top",
  align = "center",
  className,
}) => {
  if (!text) {
    return <>{children}</>
  }

  return (
    <div className="relative cursor-pointer z-10">
      <div className={twMerge("peer", className)}>{children}</div>
      <div
        className={twJoin(
          "absolute transform opacity-0 transition-opacity duration-300 ease-in-out peer-hover:opacity-100 pointer-events-none",
          place === "top"
            ? "bottom-full -translate-y-2"
            : "top-full translate-y-2",
          align === "left"
            ? "left-0"
            : align === "right"
              ? "right-0"
              : "left-1/2 -translate-x-1/2",
        )}
        style={{ width: "max-content" }}
      >
        <div className="rounded-sm px-2 py-1 bg-zinc-400 dark:bg-zinc-600">
          <p className="text-xs font-normal text-white">{text}</p>
        </div>
      </div>
      <div
        className={twJoin(
          "absolute left-1/2 -translate-x-1/2 transform border-x-[6px] border-solid border-x-transparent opacity-0 transition-opacity duration-300 ease-in-out peer-hover:opacity-100 pointer-events-none",
          place === "bottom"
            ? "top-full translate-y-[2px] border-t-0 border-b-[6px] border-b-zinc-400 dark:border-b-zinc-600"
            : "bottom-full -translate-y-[2px] border-t-[6px] border-b-0 border-t-zinc-400 dark:border-t-zinc-600",
        )}
      ></div>
    </div>
  )
}

export default Tooltip
