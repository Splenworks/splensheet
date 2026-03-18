import React, { useCallback, useRef, useState } from "react"
import { type WorkBook, writeFile } from "xlsx"
import FileDropOverlay from "./FileDropOverlay"
import { SheetData } from "./types"
import SpinnerOverlay from "./ui/SpinnerOverlay"
import { loadWorkbook } from "./utils/workbook"
import { dataToSheet, sheetToData } from "./utils/xlsx"

export interface FileLoadResult {
  workbook: WorkBook
  sheets: SheetData[]
  fileName: string
}

interface FileManagerProps {
  workbook: WorkBook
  fileName: string
  sheets: SheetData[]
  overlayMessage: string
  onFileLoad: (result: FileLoadResult) => void
  onDownloadComplete: () => void
  children: (actions: { onOpen: () => void; onDownload: () => void }) => React.ReactNode
}

const FileManager: React.FC<FileManagerProps> = ({
  workbook,
  fileName,
  sheets,
  overlayMessage,
  onFileLoad,
  onDownloadComplete,
  children,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(async (file: File) => {
    setIsLoading(true)
    try {
      const nextWorkbook = await loadWorkbook(file)
      if (!nextWorkbook) return

      const nextSheets = nextWorkbook.SheetNames.map((name, idx) => ({
        id: idx + 1,
        name,
        data: sheetToData(nextWorkbook.Sheets[name]),
      }))

      onFileLoad({ workbook: nextWorkbook, sheets: nextSheets, fileName: file.name })
    } finally {
      setIsLoading(false)
    }
  }, [onFileLoad])

  const handleFileInputChange = useCallback(async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const input = event.target
    const file = input.files?.[0]
    if (!file) {
      input.value = ""
      return
    }
    try {
      await processFile(file)
    } finally {
      input.value = ""
    }
  }, [processFile])

  const handleOpen = useCallback(() => {
    const input = fileInputRef.current
    if (!input) return
    input.value = ""
    input.click()
  }, [])

  const handleDownload = useCallback(() => {
    sheets.forEach((sd, idx) => {
      const sheetName = workbook.SheetNames[idx]
      const ws = workbook.Sheets[sheetName]
      dataToSheet(sd.data, ws)
    })
    writeFile(workbook, fileName)
    onDownloadComplete()
  }, [workbook, fileName, sheets, onDownloadComplete])

  return (
    <FileDropOverlay
      className="fixed inset-0 flex flex-col bg-white dark:bg-neutral-900"
      onFileDrop={processFile}
      overlayMessage={overlayMessage}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleFileInputChange}
      />
      <SpinnerOverlay visible={isLoading} />
      {children({ onOpen: handleOpen, onDownload: handleDownload })}
    </FileDropOverlay>
  )
}

export default FileManager
