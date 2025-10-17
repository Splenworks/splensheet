import React, { useMemo } from "react"
import { useTranslation } from "react-i18next"
import {
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  EllipsisVerticalIcon,
  MoonIcon,
  SunIcon,
} from "@heroicons/react/24/outline"
import IconButton from "./IconButton"
import Menu from "./Menu"
import { useDarkmode } from "./hooks/useDarkmode"

interface MoreMenuProps {
  isFullScreen: boolean
  toggleFullScreen: () => void
}

const MoreMenu: React.FC<MoreMenuProps> = ({ isFullScreen, toggleFullScreen }) => {
  const { t } = useTranslation()
  const { darkMode, toggleDarkMode } = useDarkmode()

  const TriggerIcon: React.FC<{ className?: string }> = ({ className }) => (
    <EllipsisVerticalIcon className={className} />
  )

  const menuItems = useMemo(() => ([
    {
      id: "toggle-fullscreen",
      label: t("others.toggleFullscreen", { defaultValue: "Toggle Fullscreen" }),
      icon: isFullScreen ? ArrowsPointingInIcon : ArrowsPointingOutIcon,
      onSelect: toggleFullScreen,
    },
    {
      id: "toggle-darkmode",
      label: t("others.toggleDarkMode", { defaultValue: "Toggle Darkmode" }),
      icon: darkMode ? SunIcon : MoonIcon,
      onSelect: toggleDarkMode,
    },
  ]), [t, isFullScreen, darkMode, toggleFullScreen, toggleDarkMode])

  return (
    <Menu
      items={menuItems}
      align="right"
      renderTrigger={({ toggle, isOpen }) => (
        <IconButton
          svgIcon={TriggerIcon}
          onClick={toggle}
          isHover={isOpen}
        />
      )}
    />
  )
}

export default MoreMenu
