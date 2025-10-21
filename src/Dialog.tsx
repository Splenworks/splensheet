import React, { useEffect } from "react"
import { createPortal } from "react-dom"
import { twMerge } from "tailwind-merge"
import { XMarkIcon } from "@heroicons/react/24/outline"
import { DialogAction } from "./contexts/DialogContext"
import IconButton from "./IconButton"

interface DialogProps {
  isOpen: boolean
  onClose: () => void
  title?: React.ReactNode
  description?: React.ReactNode
  content?: React.ReactNode
  actions?: DialogAction[]
  dismissible?: boolean
}

const actionVariantClasses: Record<NonNullable<DialogAction["variant"]>, string> = {
  primary: "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400",
  secondary: "border border-gray-300 text-gray-900 hover:bg-gray-100 dark:border-neutral-600 dark:text-white dark:hover:bg-neutral-700",
  ghost: "text-gray-700 hover:bg-gray-100 dark:text-white dark:hover:bg-neutral-700",
}

const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  content,
  actions,
  dismissible = true,
}) => {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && dismissible) {
        onClose()
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, dismissible, onClose])

  if (!isOpen) return null

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={dismissible ? onClose : undefined}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-neutral-800"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            {title && (
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h2>
            )}
          </div>
          {dismissible && (
            <IconButton
              svgIcon={XMarkIcon}
              onClick={onClose}
              className="text-black hover:text-white dark:text-white"
              ariaLabel="Close dialog"
            />
          )}
        </div>
        {description && (
          <p className="mt-2 text-sm text-gray-600 dark:text-neutral-300">
            {description}
          </p>
        )}
        {content && (
          <div className="mt-4 text-sm text-gray-700 dark:text-neutral-200">
            {content}
          </div>
        )}
        <div className="mt-6 flex justify-end gap-2">
          {(actions && actions.length > 0 ? actions : [{
            label: "Close",
            onClick: onClose,
            variant: "secondary" as const,
          }]).map((action, idx) => (
            <button
              key={`dialog-action-${idx}`}
              type="button"
              className={twMerge(
                "rounded-md px-4 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600",
                action.variant ? actionVariantClasses[action.variant] : actionVariantClasses.secondary,
              )}
              onClick={action.onClick}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default Dialog
