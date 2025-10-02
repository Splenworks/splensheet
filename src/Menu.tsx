import React, { useEffect, useRef, useState } from "react"
import { twMerge } from "tailwind-merge"

type MenuActionItem = {
  id: string
  label: React.ReactNode
  onSelect?: () => void
  icon?: React.ComponentType<{ className?: string }>
  type?: "item"
}

type MenuDividerItem = {
  id: string
  type: "divider"
  className?: string
}

type MenuInfoItem = {
  id: string
  label: React.ReactNode
  type: "info"
}

type MenuItem = MenuActionItem | MenuDividerItem | MenuInfoItem

interface MenuProps {
  items: MenuItem[]
  renderTrigger: (helpers: { isOpen: boolean; toggle: () => void; close: () => void }) => React.ReactNode
  align?: "left" | "right"
  className?: string
  menuClassName?: string
}

const Menu: React.FC<MenuProps> = ({
  items,
  renderTrigger,
  align = "left",
  className,
  menuClassName,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const handleClickAway = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false)
    }

    document.addEventListener("mousedown", handleClickAway)
    document.addEventListener("keydown", handleEscape)

    return () => {
      document.removeEventListener("mousedown", handleClickAway)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen])

  const closeMenu = () => setIsOpen(false)

  return (
    <div ref={containerRef} className={twMerge("relative", className)}>
      {renderTrigger({
        isOpen,
        toggle: () => setIsOpen(prev => !prev),
        close: closeMenu,
      })}
      {isOpen && (
        <div
          className={twMerge(
            "absolute z-50 mt-2 w-50 rounded-md border border-gray-200 bg-white py-2 text-sm text-black shadow-lg dark:border-neutral-700 dark:bg-neutral-800 dark:text-white",
            align === "right" ? "right-0" : "left-0",
            menuClassName,
          )}
          role="menu"
          aria-label="menu"
        >
          {items.map(item => {
            if (item.type === "divider") {
              return (
                <div
                  key={item.id}
                  role="separator"
                  className={twMerge("mx-2 my-2 border-t border-gray-200 dark:border-neutral-700", item.className)}
                />
              )
            }

            if (item.type === "info") {
              return (
                <div
                  key={item.id}
                  className="px-4 py-2"
                >
                  {item.label}
                </div>
              )
            }

            const Icon = item.icon

            return (
              <button
                key={item.id}
                type="button"
                className="cursor-pointer flex w-full items-center gap-2.5 px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-zinc-600"
                role="menuitem"
                onClick={() => {
                  item.onSelect?.()
                  closeMenu()
                }}
              >
                {Icon && (
                  <Icon
                    aria-hidden="true"
                    className="h-4 w-4 text-black dark:text-white -ml-0.5"
                  />
                )}
                <span className="flex-1">{item.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Menu
