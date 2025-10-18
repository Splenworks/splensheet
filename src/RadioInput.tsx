import React from "react"
import { twMerge } from "tailwind-merge"

export interface RadioInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: React.ReactNode
  description?: React.ReactNode
  containerClassName?: string
}

const RadioInput: React.FC<RadioInputProps> = ({
  label,
  description,
  className,
  containerClassName,
  disabled,
  ...props
}) => {
  return (
    <label
      className={twMerge(
        "flex items-start gap-2 rounded-md border border-transparent px-2 py-1 text-sm text-gray-700 transition hover:bg-gray-100 dark:text-neutral-200 dark:hover:bg-neutral-700",
        disabled ? "cursor-not-allowed opacity-80" : "cursor-pointer",
        containerClassName,
      )}
    >
      <input
        type="radio"
        className={twMerge("h-4 w-4 mt-0.5", className)}
        disabled={disabled}
        {...props}
      />
      <div className="flex flex-col">
        <span>{label}</span>
        {description && (
          <span className="text-xs text-gray-500 dark:text-neutral-400">
            {description}
          </span>
        )}
      </div>
    </label>
  )
}

export default RadioInput
