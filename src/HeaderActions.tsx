import React, { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import ExpandIcon from "./assets/icons/expand.svg?react"
import CompressIcon from "./assets/icons/compress.svg?react"
import DownloadIcon from "./assets/icons/download.svg?react"
import EllipsisVerticalIcon from "./assets/icons/ellipsis-vertical.svg?react"
import IconButton from "./IconButton"
import Tooltip from "./Tooltip"
import { useDarkmode } from "./hooks/useDarkmode"
import ExcelDarkModeToggleIcon from "./ExcelDarkModeToggleIcon"
import { twJoin } from "tailwind-merge"

interface HeaderActionsProps {
  isFullScreen: boolean
  toggleFullScreen: () => void
  hasChanges?: boolean
  onDownload?: () => void
}

const HeaderActions: React.FC<HeaderActionsProps> = ({
  isFullScreen,
  toggleFullScreen,
  hasChanges,
  onDownload,
}) => {
  const { t } = useTranslation()
  const { darkMode, toggleDarkMode } = useDarkmode()
  const [showBounce, setShowBounce] = useState(false)

  useEffect(() => {
    if (!hasChanges) {
      setShowBounce(false)
      return
    }

    setShowBounce(true)
    const timer = setTimeout(() => setShowBounce(false), 5000)

    return () => clearTimeout(timer)
  }, [hasChanges])

  const DarkModeToggleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <ExcelDarkModeToggleIcon
      darkMode={darkMode}
      className={`text-black dark:text-white ${className}`}
    />
  )

  return (
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
      <Tooltip text={t("others.toggleDarkMode")} place="bottom" align="right" className="rounded-full">
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
      {/* <Tooltip text={t("others.more")} place="bottom" align="right" className="rounded-full">
        <IconButton svgIcon={EllipsisVerticalIcon} />
      </Tooltip> */}
    </div>
  )
}

export default HeaderActions
