import { createContext, ReactNode } from "react"

export interface DialogAction {
  label: ReactNode
  onClick: () => void
  variant?: "primary" | "secondary" | "ghost"
}

export interface DialogOptions {
  title?: ReactNode
  description?: ReactNode
  content?: ReactNode
  actions?: DialogAction[]
  dismissible?: boolean
}

export interface DialogContextValue {
  openDialog: (options: DialogOptions) => void
  closeDialog: () => void
}

export const DialogContext = createContext<DialogContextValue>({
  openDialog: () => {},
  closeDialog: () => {},
})
