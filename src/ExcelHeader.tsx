import React, { useEffect, useState, useRef, forwardRef, useImperativeHandle } from "react"
import { useTranslation } from "react-i18next"
import ExpandIcon from "./assets/icons/expand.svg?react"
import CompressIcon from "./assets/icons/compress.svg?react"
import DownloadIcon from "./assets/icons/download.svg?react"
import IconButton from "./IconButton"
import Tooltip from "./Tooltip"
import { useDarkmode } from "./hooks/useDarkmode"
import ExcelDarkModeToggleIcon from "./ExcelDarkModeToggleIcon"
import FindBar, { FindBarRef } from "./FindBar"
import { twJoin } from "tailwind-merge"
import HeaderMenu from "./HeaderMenu"
import WorksheetSelector from "./WorksheetSelector"

interface ExcelHeaderProps {
  isFullScreen: boolean
  toggleFullScreen: () => void
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
  onOpen?: () => void
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
  fileName,
  onFileNameChange,
  worksheets,
  activeSheetIndex,
  setActiveSheetIndex,
  onAddSheet,
  onRenameSheet,
  onDeleteSheet,
  hasChanges,
  onOpen,
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
  const [showBounce, setShowBounce] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [nameInput, setNameInput] = useState("")
  const nameInputRef = useRef<HTMLInputElement>(null)

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

  return (
    <>
      <header className="flex h-11 items-center justify-between px-2 bg-gray-200 dark:bg-neutral-800 relative">
        <div className="flex items-center space-x-2">
          <HeaderMenu onOpen={onOpen} onDownload={onDownload} />
          {!isCsv && (
            <WorksheetSelector
              worksheets={worksheets}
              activeSheetIndex={activeSheetIndex}
              setActiveSheetIndex={setActiveSheetIndex}
              onAddSheet={onAddSheet}
              onRenameSheet={onRenameSheet}
              onDeleteSheet={onDeleteSheet}
            />
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
            align="right"
            className="rounded-full"
          >
            <IconButton
              svgIcon={isFullScreen ? CompressIcon : ExpandIcon}
              onClick={toggleFullScreen}
            />
          </Tooltip>
        </div>
      </header>
    </>
  )
})

ExcelHeader.displayName = 'ExcelHeader'

export default ExcelHeader
