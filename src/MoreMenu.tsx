import React, { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import {
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  EllipsisVerticalIcon,
  LanguageIcon,
  MoonIcon,
  SunIcon,
} from "@heroicons/react/24/outline"
import IconButton from "./IconButton"
import Menu from "./Menu"
import { useDarkmode } from "./hooks/useDarkmode"
import { useDialog } from "./hooks/useDialog"
import ChangeLanguageDialog from "./ChangeLanguageDialog"

interface MoreMenuProps {
  isFullScreen: boolean
  toggleFullScreen: () => void
}

const MoreMenu: React.FC<MoreMenuProps> = ({ isFullScreen, toggleFullScreen }) => {
  const { t, i18n } = useTranslation()
  const { darkMode, toggleDarkMode } = useDarkmode()
  const { openDialog, closeDialog } = useDialog()
  const activeLanguage = (i18n.resolvedLanguage ?? i18n.language) || "en"

  const TriggerIcon: React.FC<{ className?: string }> = ({ className }) => (
    <EllipsisVerticalIcon className={className} />
  )

  const handleChangeLanguage = useCallback(() => {
    openDialog({
      title: t("dialog.changeLanguage.title", { defaultValue: "Change Language" }),
      description: t("dialog.changeLanguage.description", { defaultValue: "Choose the default language you would like to use in SplenSheet." }),
      content: (
        <ChangeLanguageDialog activeLanguage={activeLanguage} />
      ),
      actions: [
        {
          label: t("others.close", { defaultValue: "Close" }),
          onClick: closeDialog,
          variant: "secondary",
        },
      ],
    })
  }, [activeLanguage, openDialog, t, closeDialog])

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
    {
      id: "change-language",
      label: t("others.changeLanguage", { defaultValue: "Change Language" }),
      icon: LanguageIcon,
      onSelect: handleChangeLanguage,
    },
  ]), [t, isFullScreen, darkMode, toggleFullScreen, toggleDarkMode, handleChangeLanguage])

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
