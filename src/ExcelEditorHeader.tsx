import React, { useState } from "react"
import { useTranslation } from "react-i18next"
import ExpandIcon from "./assets/icons/expand.svg?react"
import CompressIcon from "./assets/icons/compress.svg?react"
import XmarkIcon from "./assets/icons/xmark.svg?react"
import IconButton from "./IconButton"
import Tooltip from "./Tooltip"
import { getDarkmode, toggleDarkmode } from "./utils/darkmode"
import ExcelDarkModeToggleIcon from "./ExcelDarkModeToggleIcon"

interface ExcelEditorHeaderProps {
  isFullScreen: boolean
  toggleFullScreen: () => void
  onClose: () => void
  fileName: string
}

const ExcelEditorHeader: React.FC<ExcelEditorHeaderProps> = ({
  isFullScreen,
  toggleFullScreen,
  onClose,
  fileName,
}) => {
  const { t } = useTranslation()
  const [darkMode, setDarkMode] = useState(getDarkmode())

  const DarkModeToggleIcon: React.FC<{ className?: string }> = ({ className }) => {
    return (
      <ExcelDarkModeToggleIcon
        darkMode={darkMode}
        className={`text-black dark:text-white ${className}`}
      />
    )
  }

  return (
    <header className="flex h-9 items-center justify-between px-2 bg-gray-300 dark:bg-neutral-800">
      <div className="flex items-center space-x-2">
      </div>
      <div className="flex-1 overflow-hidden text-center text-sm font-medium text-black dark:text-white">
        {fileName}
      </div>
      <div className="flex items-center space-x-2">
        <Tooltip text={t("others.toggleDarkMode")} place="bottom">
          <IconButton
            svgIcon={DarkModeToggleIcon}
            onClick={() => {
              toggleDarkmode()
              setDarkMode((d) => !d)
            }}
            className="text-black"
          />
        </Tooltip>
        <Tooltip
          text={isFullScreen ? t("others.exitFullscreen") : t("others.fullscreen")}
          place="bottom"
        >
          <IconButton
            svgIcon={isFullScreen ? CompressIcon : ExpandIcon}
            onClick={toggleFullScreen}
          />
        </Tooltip>
        <Tooltip text={t("others.exit")} place="bottom" align="right">
          <IconButton
            svgIcon={XmarkIcon}
            onClick={onClose}
          />
        </Tooltip>
      </div>
    </header>
  )
}

export default ExcelEditorHeader
