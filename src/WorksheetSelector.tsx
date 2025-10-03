import React, { useMemo } from "react"
import { useTranslation } from "react-i18next"

interface WorksheetSummary {
  id: number
  name: string
}

interface WorksheetSelectorProps {
  worksheets: WorksheetSummary[]
  activeSheetIndex: number
  setActiveSheetIndex: (index: number) => void
  onAddSheet?: () => void
  onRenameSheet?: () => void
  onDeleteSheet?: () => void
}

const WorksheetSelector: React.FC<WorksheetSelectorProps> = ({
  worksheets,
  activeSheetIndex,
  setActiveSheetIndex,
  onAddSheet,
  onRenameSheet,
  onDeleteSheet,
}) => {
  const { t } = useTranslation()
  const activeSheetName = worksheets[activeSheetIndex]?.name ?? ""

  const dividerLabel = useMemo(() => {
    const labels = [
      ...worksheets.map(({ name }) => name),
      t("excelHeader.addSheet"),
      t("excelHeader.renameSheet", { sheetName: activeSheetName }),
    ]

    if (worksheets.length > 1) {
      labels.push(t("excelHeader.deleteSheet", { sheetName: activeSheetName }))
    }

    const maxLen = labels.reduce((max, label) => Math.max(max, label.length), 0)
    return "─".repeat(Math.ceil(maxLen / 2) + 2)
  }, [worksheets, activeSheetName, t])

  const handleSheetChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value

    if (value === "__add__") {
      onAddSheet?.()
      event.target.value = String(activeSheetIndex)
      return
    }

    if (value === "__rename__") {
      onRenameSheet?.()
      event.target.value = String(activeSheetIndex)
      return
    }

    if (value === "__delete__") {
      onDeleteSheet?.()
      event.target.value = String(activeSheetIndex)
      return
    }

    const nextIndex = Number(value)
    if (!Number.isNaN(nextIndex)) {
      setActiveSheetIndex(nextIndex)
    }
  }

  return (
    <select
      className="h-7 rounded border max-w-50 border-gray-300 bg-white px-1 text-xs dark:border-neutral-600 dark:bg-neutral-700 dark:text-white focus:outline-pink-900 dark:focus:outline-pink-700"
      value={activeSheetIndex}
      onChange={handleSheetChange}
    >
      {worksheets.map((ws, idx) => (
        <option key={ws.id} value={idx}>
          {ws.name}
        </option>
      ))}
      <option disabled>{dividerLabel}</option>
      <option value="__add__">
        {t("excelHeader.addSheet")}
      </option>
      <option value="__rename__">
        {t("excelHeader.renameSheet", { sheetName: activeSheetName })}
      </option>
      {worksheets.length > 1 && (
        <option value="__delete__">
          {t("excelHeader.deleteSheet", { sheetName: activeSheetName })}
        </option>
      )}
    </select>
  )
}

export default WorksheetSelector
