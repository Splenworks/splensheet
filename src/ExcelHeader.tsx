import React, { useEffect, useState, useRef, forwardRef, useImperativeHandle } from "react"
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
  worksheets: Array<{
    id: number
    name: string
  }>
  activeSheetIndex: number
  setActiveSheetIndex: (index: number) => void
  hasChanges?: boolean
  onDownload?: () => void
  // Find functionality props
  showFindBar?: boolean
  findQuery?: string
  onFindQueryChange?: (val: string) => void
  onFindNext?: () => void
  onFindPrev?: () => void
  onFindClose?: () => void
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
  worksheets,
  activeSheetIndex,
  setActiveSheetIndex,
  hasChanges,
  onDownload,
  showFindBar = false,
  findQuery = "",
  onFindQueryChange,
  onFindNext,
  onFindPrev,
  onFindClose,
  findMatchIndex = 0,
  findMatchCount = 0,
}, ref) => {
  const { t } = useTranslation()
  const { darkMode, toggleDarkMode } = useDarkmode()
  const isCsv = fileName.toLowerCase().endsWith('.csv')
  const findBarRef = useRef<FindBarRef>(null)

  const [showBounce, setShowBounce] = useState(false)

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
      <header className="flex h-11 items-center justify-between px-2 bg-gray-200 dark:bg-neutral-800">
        <div className="flex items-center space-x-2">
          {!isCsv && (
            <select
              className="h-7 rounded border max-w-55 border-gray-300 bg-white px-1 text-xs dark:border-neutral-600 dark:bg-neutral-700 dark:text-white focus:outline-pink-900 dark:focus:outline-pink-700"
              value={activeSheetIndex}
              onChange={(e) => setActiveSheetIndex(Number(e.target.value))}
            >
              {worksheets.map((ws, idx) => (
                <option key={ws.id} value={idx}>
                  {ws.name}
                </option>
              ))}
            </select>
          )}
          {showFindBar && (
            <FindBar
              ref={findBarRef}
              query={findQuery}
              onQueryChange={onFindQueryChange || (() => { })}
              onClose={onFindClose || (() => { })}
              onNext={onFindNext || (() => { })}
              onPrev={onFindPrev || (() => { })}
              matchIndex={findMatchIndex}
              matchCount={findMatchCount}
              showCloseButton={false}
            />
          )}
        </div>
        <div className="hidden md:block flex-1 overflow-hidden text-center text-base font-medium text-black dark:text-white">
          {fileName}
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
