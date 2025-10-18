import React, { PropsWithChildren, useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import Dialog from "../Dialog"
import { DialogAction, DialogContext, DialogOptions } from "../contexts/DialogContext"

export const DialogProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { t } = useTranslation()
  const [options, setOptions] = useState<DialogOptions | null>(null)

  const closeDialog = useCallback(() => {
    setOptions(null)
  }, [])

  const openDialog = useCallback((nextOptions: DialogOptions) => {
    setOptions({
      dismissible: true,
      ...nextOptions,
    })
  }, [])

  const contextValue = useMemo(() => ({
    openDialog,
    closeDialog,
  }), [openDialog, closeDialog])

  const resolvedActions = useMemo<DialogAction[] | undefined>(() => {
    if (!options) return undefined
    if (!options.actions || options.actions.length === 0) {
      return [{
        label: t("others.close", { defaultValue: "Close" }),
        onClick: closeDialog,
        variant: "secondary",
      }]
    }

    return options.actions.map((action) => ({
      ...action,
      onClick: () => {
        action.onClick()
      },
    }))
  }, [options, closeDialog, t])

  return (
    <DialogContext.Provider value={contextValue}>
      {children}
      <Dialog
        isOpen={Boolean(options)}
        onClose={closeDialog}
        title={options?.title}
        description={options?.description}
        content={options?.content}
        actions={resolvedActions}
        dismissible={options?.dismissible}
      />
    </DialogContext.Provider>
  )
}
