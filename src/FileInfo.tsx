import React, { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import ExitFullscreenIcon from "./assets/icons/compress.svg?react"
import ExitIcon from "./assets/icons/exit.svg?react"
import FullscreenIcon from "./assets/icons/expand.svg?react"
import DarkModeSwitchIcon from "./DarkModeSwitchIcon"
import { useFullScreen } from "./hooks/useFullScreen"
import IconButton from "./IconButton"
import Tooltip from "./Tooltip"
import { getDarkmode, toggleDarkmode } from "./utils/darkmode"

interface FileInfoProps {
  fileName: string
  file: File
  pageIndex: number
  totalPages: number
  exit: () => void
  toggleInfoMode: () => void
}

const FileInfo: React.FC<FileInfoProps> = ({
  fileName,
  file,
  pageIndex,
  totalPages,
  exit,
  toggleInfoMode,
}) => {
  const { t } = useTranslation()
  const [darkMode, setDarkMode] = useState(getDarkmode())
  const { isFullScreen, toggleFullScreen } = useFullScreen()

  const fileSizeString = useCallback((size: number) => {
    if (size < 1024) return `${size} bytes`
    const units = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
    let unitIndex = 0
    while (size >= 1024) {
      size /= 1024
      unitIndex++
    }
    return `${parseFloat(size.toFixed(2))} ${units[unitIndex]}`
  }, [])

  return (
    <div
      className="fixed bottom-0 left-0 right-0 top-0 text-white transition-opacity duration-300 ease-in-out"
      style={{
        background:
          "linear-gradient(to bottom, rgba(0,0,0,0.75), rgba(0,0,0,0%), rgba(0,0,0,0%), rgba(0,0,0,0.75)",
      }}
      onMouseUp={toggleInfoMode}
    >
      <div className="absolute left-0 right-1 top-0 flex justify-between md:right-4">
        <div
          className="flex flex-col gap-1 pl-4 pt-2 md:pl-6 md:pt-4"
          onMouseUp={(e) => e.stopPropagation()}
        >
          <span className="text-xl font-semibold">{fileName}</span>
          <span className="font-semibold">
            {new Date(file.lastModified).toLocaleString()}
          </span>
          <span className="font-semibold">{fileSizeString(file.size)}</span>
        </div>
        <div
          className="flex gap-2 pt-2 md:pt-4"
          onMouseUp={(e) => e.stopPropagation()}
        >
          <div>
            <Tooltip text={t("others.toggleDarkMode")} place="bottom">
              <IconButton
                svgIcon={() => (
                  <DarkModeSwitchIcon darkMode={darkMode} size={20} />
                )}
                onClick={() => {
                  setDarkMode((darkMode) => !darkMode)
                  toggleDarkmode()
                }}
              />
            </Tooltip>
          </div>
          <div>
            <Tooltip text={t("others.exit")} place="bottom">
              <IconButton
                svgIcon={ExitIcon}
                onClick={exit}
                className="rotate-180 transform"
              />
            </Tooltip>
          </div>
        </div>
      </div>
      <div
        className="absolute bottom-2 left-4 right-1 flex items-center justify-between md:bottom-4 md:left-6 md:right-4"
        onMouseUp={(e) => e.stopPropagation()}
      >
        <span className="select-none text-lg font-semibold md:text-xl">
          {totalPages > 1 ? `${pageIndex + 1} / ${totalPages}` : ""}
        </span>
        <div>
          <Tooltip
            text={
              isFullScreen ? t("others.exitFullscreen") : t("others.fullscreen")
            }
            place="top"
            align="right"
          >
            <IconButton
              svgIcon={isFullScreen ? ExitFullscreenIcon : FullscreenIcon}
              onClick={() => {
                toggleFullScreen()
                toggleInfoMode()
              }}
            />
          </Tooltip>
        </div>
      </div>
    </div>
  )
}

export default FileInfo
