import React, { useRef, forwardRef, useImperativeHandle } from "react"
import FindBar, { FindBarRef } from "./FindBar"
import HeaderMenu from "./HeaderMenu"
import WorksheetSelector from "./WorksheetSelector"
import FileNameEditor from "./FileNameEditor"
import HeaderActions from "./HeaderActions"
import MoreMenu from "./MoreMenu"

interface HeaderProps {
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

export interface HeaderRef {
  focusFind: () => void
}

const Header = forwardRef<HeaderRef, HeaderProps>(({
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
  const isCsv = fileName.toLowerCase().endsWith('.csv')
  const findBarRef = useRef<FindBarRef>(null)

  useImperativeHandle(ref, () => ({
    focusFind: () => {
      findBarRef.current?.focus()
    }
  }), [])

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
        </div>
        <div className="hidden md:block absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 overflow-hidden text-center text-base font-medium text-black dark:text-white">
          <FileNameEditor fileName={fileName} onFileNameChange={onFileNameChange} />
        </div>
        <div className="flex items-center space-x-2">
          <FindBar
            ref={findBarRef}
            query={findQuery}
            onQueryChange={onFindQueryChange || (() => { })}
            onNext={onFindNext || (() => { })}
            onPrev={onFindPrev || (() => { })}
            matchIndex={findMatchIndex}
            matchCount={findMatchCount}
          />
          <HeaderActions
            hasChanges={hasChanges}
            onDownload={onDownload}
            isFullScreen={isFullScreen}
            toggleFullScreen={toggleFullScreen}
          />
          <MoreMenu isFullScreen={isFullScreen} />
        </div>
      </header>
    </>
  )
})

Header.displayName = 'Header'

export default Header
