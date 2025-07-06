import ExcelJS from "exceljs"
import React, { useRef, useState } from "react"
import { Trans } from "react-i18next"
import { twJoin, twMerge } from "tailwind-merge"
import { useMediaQuery } from "usehooks-ts"
import SheetIcon from "./assets/icons/sheet.svg?react"
import Spinner from "./Spinner"
import { useDarkmode } from "./hooks/useDarkmode"
import { parseCsv } from "./utils/parseCsv"

interface DragDropAreaProps {
  setWorkbook: (workbook: ExcelJS.Workbook) => void
  setFileName: (name: string) => void
}

const DragDropArea: React.FC<DragDropAreaProps> = ({
  setWorkbook,
  setFileName,
}) => {
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const smallScreen = useMediaQuery("(max-width: 640px) or (max-height: 640px)")
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
      if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".csv")) {
        throw new Error("Please upload a valid Excel (.xlsx) or CSV file.")
      }
      const workbook = new ExcelJS.Workbook()
      if (fileName.endsWith(".xlsx")) {
        const arrayBuffer = await file.arrayBuffer()
        await workbook.xlsx.load(arrayBuffer)
      } else if (fileName.endsWith(".csv")) {
        const csvData = await file.text()
        const rows = parseCsv(csvData)
        const worksheet = workbook.addWorksheet("Sheet1")
        rows.forEach((r) => worksheet.addRow(r))
      }
      setWorkbook(workbook)
      setFileName(file.name)
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
      if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".csv")) {
        throw new Error("Please upload a valid Excel (.xlsx) or CSV file.")
      }
      const workbook = new ExcelJS.Workbook()
      if (fileName.endsWith(".xlsx")) {
        const arrayBuffer = await file.arrayBuffer()
        await workbook.xlsx.load(arrayBuffer)
      } else if (fileName.endsWith(".csv")) {
        const csvData = await file.text()
        const rows = parseCsv(csvData)
        const worksheet = workbook.addWorksheet("Sheet1")
        rows.forEach((r) => worksheet.addRow(r))
      }
      setWorkbook(workbook)
      setFileName(file.name)
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
          (dragging || loading) &&
          "border-pink-900 bg-neutral-200 dark:border-pink-700 dark:bg-neutral-600",
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
          accept=".xlsx, .csv"
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
              <p className="text-center text-xl font-bold text-gray-50 shadow-gray-600 [text-shadow:_0_5px_5px_var(--tw-shadow-color,0.5)] dark:text-white dark:shadow-black">
                <Trans i18nKey="dragDropArea.dropHere" />
              </p>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <SheetIcon className={twJoin("mb-8 h-32 w-32", darkMode ? "text-pink-800" : "text-pink-900")} />
                <p className="mb-4 text-center text-xl font-bold">
                  <Trans
                    i18nKey="dragDropArea.mainMessage"
                    components={{
                      u: <span className="text-pink-900 dark:text-pink-700" />,
                    }}
                  />
                </p>
                <p className="mb-4 text-center text-lg font-semibold">
                  <Trans
                    i18nKey="dragDropArea.subMessage"
                    components={{
                      u: <span className="text-pink-900 dark:text-pink-700" />,
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
