import React, { useRef, useState } from "react"
import { Trans } from "react-i18next"
import { twJoin, twMerge } from "tailwind-merge"
import { useMediaQuery } from "usehooks-ts"
import Spinner from "./Spinner"
import { useDarkmode } from "./hooks/useDarkmode"
import { parseCsv } from "./utils/parseCsv"
import { read, type WorkBook } from "xlsx"
import SheetIcon from "./SheetIcon"

interface DragDropAreaProps {
  setWorkbook: (workbook: WorkBook) => void
  setFileName: (name: string) => void
  onOpenEditor: () => void
  setHasChanges: (changes: boolean) => void
}

const DragDropArea: React.FC<DragDropAreaProps> = ({
  setWorkbook,
  setFileName,
  onOpenEditor,
  setHasChanges,
}) => {
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const smallScreen = useMediaQuery("(max-width: 640px), (max-height: 640px)")
  const { darkMode } = useDarkmode()

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    if (loading) return
    setLoading(true)
    const items = e.dataTransfer.items
    try {
      if (items.length === 0) {
        throw new Error("No files dropped.")
      }
      const file = items[0].getAsFile()
      if (!file) {
        throw new Error("No valid file found in the drop.")
      }
      const fileName = file.name.toLowerCase()
      if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls") && !fileName.endsWith(".csv")) {
        throw new Error("Please upload a valid Excel (.xlsx, .xls) or CSV file.")
      }
      let workbook: WorkBook
      if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
        const arrayBuffer = await file.arrayBuffer()
        workbook = read(arrayBuffer, { type: "array", cellDates: true })
      } else {
        const csvData = await file.text()
        workbook = parseCsv(csvData)
      }
      setWorkbook(workbook)
      setFileName(file.name)
      setHasChanges(false)
      onOpenEditor()
    } catch (error) {
      alert(error instanceof Error ? error.message : error)
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleClick = () => {
    if (loading) return
    fileInputRef.current?.click()
  }

  const handleFileInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setLoading(true)
    try {
      const files = Array.from(e.target.files || [])
      const file = files[0]
      if (!file) return
      const fileName = file.name.toLowerCase()
      if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls") && !fileName.endsWith(".csv")) {
        throw new Error("Please upload a valid Excel (.xlsx, .xls) or CSV file.")
      }
      let workbook: WorkBook
      if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
        const arrayBuffer = await file.arrayBuffer()
        workbook = read(arrayBuffer, { type: "array", cellDates: true })
      } else {
        const csvData = await file.text()
        workbook = parseCsv(csvData)
      }
      setWorkbook(workbook)
      setFileName(file.name)
      setHasChanges(false)
      onOpenEditor()
    } catch (error) {
      alert(error instanceof Error ? error.message : error)
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed top-16 right-0 bottom-16 left-0 bg-white dark:bg-neutral-900">
      <div
        className={twJoin(
          "absolute inset-x-8 inset-y-0 flex cursor-pointer items-center justify-center rounded-xl border-4 border-dashed border-gray-300 transition-colors duration-300 ease-in-out md:inset-x-16",
          "hover:bg-gradient-to-r hover:from-transparent hover:to-transparent hover:bg-[length:200%_100%] hover:animate-shimmer",
          "hover:via-pink-200/50 dark:hover:via-pink-800/20",
          (dragging || loading) &&
          "border-pink-800 bg-gray-300 dark:border-pink-600 dark:bg-neutral-600",
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          type="file"
          multiple={false}
          accept=".xlsx,.xls,.csv"
          hidden
          ref={fileInputRef}
          onChange={handleFileInputChange}
        />
        {loading ? (
          <Spinner />
        ) : (
          <div
            className={twMerge(
              "pointer-events-none px-4 text-black dark:text-white",
              !smallScreen && "pb-12",
            )}
          >
            {dragging ? (
              <p className="text-center text-xl font-bold text-white shadow-gray-700 [text-shadow:_0_5px_5px_var(--tw-shadow-color,0.5)] dark:shadow-black">
                <Trans i18nKey="dragDropArea.dropHere" />
              </p>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <SheetIcon className="mb-8 size-32" />
                <p className="mb-4 text-center text-xl font-bold">
                  <Trans
                    i18nKey="dragDropArea.mainMessage"
                    components={{
                      u: <span className="text-pink-800 dark:text-pink-600" />,
                    }}
                  />
                </p>
                <p className="mb-4 text-center text-lg font-semibold">
                  <Trans
                    i18nKey="dragDropArea.subMessage"
                    components={{
                      u: <span className="text-pink-800 dark:text-pink-600" />,
                    }}
                  />
                </p>
                {!smallScreen && (
                  <p className="text-center text-gray-800 dark:text-gray-300">
                    <Trans i18nKey="dragDropArea.neverStoreYourData" />
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default DragDropArea
