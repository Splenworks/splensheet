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

interface MoreMenuProps {
  isFullScreen: boolean
  toggleFullScreen: () => void
}

const MoreMenu: React.FC<MoreMenuProps> = ({ isFullScreen, toggleFullScreen }) => {
  const { t, i18n } = useTranslation()
  const { darkMode, toggleDarkMode } = useDarkmode()
  const { openDialog, closeDialog } = useDialog()
  const languageOptions = useMemo(() => ([
    { code: "en", label: t("languages.english", { defaultValue: "English" }) },
    { code: "ko", label: t("languages.korean", { defaultValue: "Korean" }) },
    { code: "ja", label: t("languages.japanese", { defaultValue: "Japanese" }) },
    { code: "cn", label: t("languages.chinese", { defaultValue: "Chinese (Simplified)" }) },
    { code: "es", label: t("languages.spanish", { defaultValue: "Spanish" }) },
  ]), [t])
  const activeLanguage = (i18n.resolvedLanguage ?? i18n.language) || "en"

  const TriggerIcon: React.FC<{ className?: string }> = ({ className }) => (
    <EllipsisVerticalIcon className={className} />
  )

  const handleChangeLanguage = useCallback(() => {
    openDialog({
      title: t("dialog.changeLanguage.title", { defaultValue: "Change Language" }),
      description: t("dialog.changeLanguage.description", { defaultValue: "Choose the default language you would like to use in SplenSheet." }),
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            {languageOptions.map((language) => {
              const isActive = activeLanguage.startsWith(language.code)
              return (
                <label
                  key={language.code}
                  className="flex cursor-not-allowed items-center gap-2 rounded-md border border-transparent px-2 py-1 text-sm text-gray-700 dark:text-neutral-200"
                >
                  <input
                    type="radio"
                    name="default-language"
                    value={language.code}
                    defaultChecked={Boolean(isActive)}
                    disabled
                    className="h-4 w-4"
                  />
                  <span>{language.label}</span>
                </label>
              )
            })}
          </div>
          <p className="text-xs text-gray-500 dark:text-neutral-400">
            {t("dialog.changeLanguage.comingSoon", { defaultValue: "Language switching is coming soon." })}
          </p>
        </div>
      ),
      actions: [
        {
          label: t("others.close", { defaultValue: "Close" }),
          onClick: closeDialog,
          variant: "secondary",
        },
      ],
    })
  }, [activeLanguage, openDialog, t, languageOptions, closeDialog])

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
