import React from "react"
import ExcelJS from "exceljs"

interface ExcelEditorProps {
  workbook: ExcelJS.Workbook
  onClose: () => void
}

const ExcelEditor: React.FC<ExcelEditorProps> = ({ workbook, onClose }) => {

  return (
    <div className="fixed bottom-0 left-0 right-0 top-0 flex items-center justify-center">
      {/* TODO: Implement Excel Editor */}
    </div>
  )
}

export default ExcelEditor
