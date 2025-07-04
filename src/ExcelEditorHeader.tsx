import React from "react"
import { useTranslation } from "react-i18next"
import ExpandIcon from "./assets/icons/expand.svg?react"
import CompressIcon from "./assets/icons/compress.svg?react"
import ExitIcon from "./assets/icons/exit.svg?react"
import IconButton from "./IconButton"
import Tooltip from "./Tooltip"
import DarkModeSwitchIcon from "./DarkModeSwitchIcon"
import { toggleDarkmode } from "./utils/darkmode"

interface ExcelEditorHeaderProps {
  darkMode: boolean
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>
  isFullScreen: boolean
  toggleFullScreen: () => void
  onClose: () => void
}

const ExcelEditorHeader: React.FC<ExcelEditorHeaderProps> = ({
  darkMode,
  setDarkMode,
  isFullScreen,
  toggleFullScreen,
  onClose,
}) => {
  const { t } = useTranslation()

  const DarkModeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <span className={className}>
      <DarkModeSwitchIcon
        darkMode={darkMode}
        sunColor="white"
        moonColor="white"
        size={18}
      />
    </span>
  )

  return (
    <header className="flex h-12 items-center justify-between bg-neutral-100 px-2 dark:bg-neutral-800">
      <div className="flex items-center space-x-2">
        <Tooltip text={t("others.exit")} place="bottom">
          <IconButton svgIcon={ExitIcon} onClick={onClose} />
        </Tooltip>
      </div>
      <div className="flex items-center space-x-2">
        <Tooltip text={t("others.toggleDarkMode")} place="bottom">
          <IconButton
            svgIcon={DarkModeIcon}
            onClick={() => {
              toggleDarkmode()
              setDarkMode((d) => !d)
            }}
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
      </div>
    </header>
  )
}

export default ExcelEditorHeader
