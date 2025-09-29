import React, { useEffect, useState, useRef, forwardRef, useImperativeHandle, useMemo } from "react"
import { Bars3Icon } from "@heroicons/react/24/outline"
import { useTranslation } from "react-i18next"
import ExpandIcon from "./assets/icons/expand.svg?react"
import CompressIcon from "./assets/icons/compress.svg?react"
import XmarkIcon from "./assets/icons/xmark.svg?react"
import DownloadIcon from "./assets/icons/download.svg?react"
import IconButton from "./IconButton"
import Tooltip from "./Tooltip"
import { useDarkmode } from "./hooks/useDarkmode"
import ExcelDarkModeToggleIcon from "./ExcelDarkModeToggleIcon"
import FindBar, { FindBarRef } from "./FindBar"
import { twJoin } from "tailwind-merge"

interface ExcelHeaderProps {
  isFullScreen: boolean
  toggleFullScreen: () => void
  onClose: () => void
  fileName: string
  onFileNameChange?: (val: string) => void
  worksheets: Array<{
    id: number
    name: string
  }>
  activeSheetIndex: number
  setActiveSheetIndex: (index: number) => void
  onAddSheet?: () => void
  onRenameSheet?: () => void
  onDeleteSheet?: () => void
  hasChanges?: boolean
  onDownload?: () => void
  findQuery?: string
  onFindQueryChange?: (val: string) => void
  onFindNext?: () => void
  onFindPrev?: () => void
  findMatchIndex?: number
  findMatchCount?: number
}

export interface ExcelHeaderRef {
  focusFind: () => void
}

const ExcelHeader = forwardRef<ExcelHeaderRef, ExcelHeaderProps>(({
  isFullScreen,
  toggleFullScreen,
  onClose,
  fileName,
  onFileNameChange,
  worksheets,
  activeSheetIndex,
  setActiveSheetIndex,
  onAddSheet,
  onRenameSheet,
  onDeleteSheet,
  hasChanges,
  onDownload,
  findQuery = "",
  onFindQueryChange,
  onFindNext,
  onFindPrev,
  findMatchIndex = 0,
  findMatchCount = 0,
}, ref) => {
  const { t } = useTranslation()
  const { darkMode, toggleDarkMode } = useDarkmode()
  const isCsv = fileName.toLowerCase().endsWith('.csv')
  const findBarRef = useRef<FindBarRef>(null)
  const activeSheetName = worksheets[activeSheetIndex]?.name ?? ""

  const [showBounce, setShowBounce] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [nameInput, setNameInput] = useState("")
  const nameInputRef = useRef<HTMLInputElement>(null)

  const handleSheetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    if (value === "__add__") {
      onAddSheet?.()
      e.target.value = String(activeSheetIndex)
      return
    }
    if (value === "__rename__") {
      onRenameSheet?.()
      e.target.value = String(activeSheetIndex)
      return;
    }
    if (value === "__delete__") {
      onDeleteSheet?.()
      e.target.value = String(activeSheetIndex)
      return
    }
    const newIndex = Number(value)
    if (!Number.isNaN(newIndex)) {
      setActiveSheetIndex(newIndex)
    }
  }

  useImperativeHandle(ref, () => ({
    focusFind: () => {
      findBarRef.current?.focus()
    }
  }), [])

  useEffect(() => {
    if (hasChanges) {
      setShowBounce(true)
      const timer = setTimeout(() => setShowBounce(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [hasChanges])

  // Keep local input in sync with incoming fileName
  useEffect(() => {
    const dot = fileName.lastIndexOf('.')
    const base = dot > 0 ? fileName.slice(0, dot) : fileName
    setNameInput(base)
  }, [fileName])

  // Autofocus the input when starting to edit
  useEffect(() => {
    if (isEditingName) {
      setTimeout(() => nameInputRef.current?.focus(), 0)
    }
  }, [isEditingName])

  const finishEditing = () => {
    setIsEditingName(false)
    const extDot = fileName.lastIndexOf('.')
    const ext = extDot >= 0 ? fileName.slice(extDot) : ''
    const baseRaw = nameInput.trim()
    if (!baseRaw) {
      setNameInput(fileName.replace(ext, ''))
      return
    }
    const nextName = `${baseRaw}${ext}`
    if (nextName !== fileName) onFileNameChange?.(nextName)
  }

  const DarkModeToggleIcon: React.FC<{ className?: string }> = ({ className }) => {
    return (
      <ExcelDarkModeToggleIcon
        darkMode={darkMode}
        className={`text-black dark:text-white ${className}`}
      />
    )
  }

  const MenuIcon: React.FC<{ className?: string }> = ({ className }) => {
    return <Bars3Icon className={className} />
  }

  const dividerLabel = useMemo(() => {
    const labels = [
      ...worksheets.map(({ name }) => name),
      t("excelHeader.addSheet"),
      t("excelHeader.renameSheet", { sheetName: activeSheetName }),
    ]

    if (worksheets.length > 1) {
      labels.push(t("excelHeader.deleteSheet", { sheetName: activeSheetName }))
    }

    // extra few chars so it doesn’t look short next to longest label
    return "─".repeat(Math.max(...labels.map(label => label.length), 0) / 2 + 2)
  }, [worksheets, activeSheetName, t])

  return (
    <>
      <header className="flex h-11 items-center justify-between px-2 bg-gray-200 dark:bg-neutral-800 relative">
        <div className="flex items-center space-x-2">
          <Tooltip text={t("others.menu")} place="bottom" align="left" className="rounded-full">
            <IconButton
              svgIcon={MenuIcon}
            />
          </Tooltip>
          {!isCsv && (
            <select
              className="h-7 rounded border max-w-55 border-gray-300 bg-white px-1 text-xs dark:border-neutral-600 dark:bg-neutral-700 dark:text-white focus:outline-pink-900 dark:focus:outline-pink-700"
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
          )}
          <FindBar
            ref={findBarRef}
            query={findQuery}
            onQueryChange={onFindQueryChange || (() => { })}
            onNext={onFindNext || (() => { })}
            onPrev={onFindPrev || (() => { })}
            matchIndex={findMatchIndex}
            matchCount={findMatchCount}
          />
        </div>
        <div className="hidden md:block absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 overflow-hidden text-center text-base font-medium text-black dark:text-white">
          {isEditingName ? (
            <input
              ref={nameInputRef}
              className="px-2 py-0.5 rounded bg-white text-black dark:bg-neutral-700 dark:text-white focus:outline-none border-0 focus:border-2 border-pink-900 dark:border-pink-700 text-center"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={() => finishEditing()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') finishEditing()
                else if (e.key === 'Escape') {
                  setIsEditingName(false)
                  const dot = fileName.lastIndexOf('.')
                  const base = dot > 0 ? fileName.slice(0, dot) : fileName
                  setNameInput(base)
                }
              }}
            />
          ) : (
            <button
              type="button"
              className="px-2 py-0.5 rounded hover:bg-gray-300/70 dark:hover:bg-neutral-700/70 cursor-text"
              onClick={() => setIsEditingName(true)}
            >
              {fileName}
            </button>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {hasChanges && (
            <Tooltip text={t("others.download")} place="bottom" className="rounded-full">
              <IconButton
                svgIcon={DownloadIcon}
                onClick={onDownload}
                className={twJoin(showBounce && "animate-bounce hover:animate-none")}
              />
            </Tooltip>
          )}
          <Tooltip text={t("others.toggleDarkMode")} place="bottom" className="rounded-full">
            <IconButton
              svgIcon={DarkModeToggleIcon}
              onClick={toggleDarkMode}
              className="text-black"
            />
          </Tooltip>
          <Tooltip
            text={isFullScreen ? t("others.exitFullscreen") : t("others.fullscreen")}
            place="bottom"
            className="rounded-full"
          >
            <IconButton
              svgIcon={isFullScreen ? CompressIcon : ExpandIcon}
              onClick={toggleFullScreen}
            />
          </Tooltip>
          <Tooltip text={t("others.exit")} place="bottom" align="right" className="rounded-full">
            <IconButton
              svgIcon={XmarkIcon}
              onClick={onClose}
            />
          </Tooltip>
        </div>
      </header>
    </>
  )
})

ExcelHeader.displayName = 'ExcelHeader'

export default ExcelHeader
