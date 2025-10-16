import React, { useMemo, useCallback } from "react"
import { useTranslation } from "react-i18next"
import ExpandIcon from "./assets/icons/expand.svg?react"
import CompressIcon from "./assets/icons/compress.svg?react"
import EllipsisVerticalIcon from "./assets/icons/ellipsis-vertical.svg?react"
import IconButton from "./IconButton"
import Menu from "./Menu"
import ExcelDarkModeToggleIcon from "./ExcelDarkModeToggleIcon"
import { useDarkmode } from "./hooks/useDarkmode"

interface MoreMenuProps {
  isFullScreen: boolean
}

const MoreMenu: React.FC<MoreMenuProps> = ({ isFullScreen }) => {
  const { t } = useTranslation()
  const { darkMode } = useDarkmode()
  const zeroMarginStyle = useMemo(() => ({ margin: 0 }), [])

  const DarkModeToggleIcon = useCallback(({ className }: { className?: string }) => (
    <ExcelDarkModeToggleIcon
      darkMode={darkMode}
      className={`text-black dark:text-white ${className ?? ""}`}
      style={zeroMarginStyle}
    />
  ), [darkMode, zeroMarginStyle])

  const menuItems = useMemo(() => ([
    {
      id: "toggle-fullscreen",
      label: t("others.toggleFullscreen", { defaultValue: "Toggle Fullscreen" }),
      icon: isFullScreen ? CompressIcon : ExpandIcon,
    },
    {
      id: "toggle-darkmode",
      label: t("others.toggleDarkMode", { defaultValue: "Toggle Darkmode" }),
      icon: DarkModeToggleIcon,
    },
  ]), [t, isFullScreen, DarkModeToggleIcon])

  return (
    <Menu
      items={menuItems}
      align="right"
      renderTrigger={({ toggle, isOpen }) => (
        <IconButton
          svgIcon={EllipsisVerticalIcon}
          onClick={toggle}
          isHover={isOpen}
        />
      )}
    />
  )
}

export default MoreMenu
