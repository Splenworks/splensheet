import React, { useMemo } from "react"
import { useTranslation } from "react-i18next"
import {
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  CheckIcon,
  EllipsisVerticalIcon,
  MoonIcon,
  SunIcon,
} from "@heroicons/react/24/outline"
import IconButton from "./ui/IconButton"
import Menu from "./ui/Menu"
import { useDarkmode } from "./hooks/useDarkmode"

interface MoreMenuProps {
  isFullScreen: boolean
  toggleFullScreen: () => void
}

const LANGUAGES: ReadonlyArray<{ code: string; nativeName: string }> = [
  { code: "en", nativeName: "English" },
  { code: "ko", nativeName: "한국어" },
  { code: "ja", nativeName: "日本語" },
  { code: "cn", nativeName: "中文" },
  { code: "es", nativeName: "Español" },
]

const InvisibleCheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <CheckIcon className={`${className ?? ""} invisible`} />
)

const MoreMenu: React.FC<MoreMenuProps> = ({ isFullScreen, toggleFullScreen }) => {
  const { t, i18n } = useTranslation()
  const { darkMode, toggleDarkMode } = useDarkmode()

  const TriggerIcon: React.FC<{ className?: string }> = ({ className }) => (
    <EllipsisVerticalIcon className={className} />
  )

  const currentLanguage = LANGUAGES.some(l => l.code === i18n.resolvedLanguage)
    ? i18n.resolvedLanguage
    : "en"

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
    { id: "language-divider", type: "divider" as const },
    {
      id: "language-label",
      type: "info" as const,
      label: (
        <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-neutral-400">
          {t("language.label", { defaultValue: "Language" })}
        </span>
      ),
    },
    ...LANGUAGES.map(({ code, nativeName }) => ({
      id: `language-${code}`,
      label: nativeName,
      icon: code === currentLanguage ? CheckIcon : InvisibleCheckIcon,
      onSelect: () => i18n.changeLanguage(code),
    })),
  ]), [t, i18n, isFullScreen, darkMode, toggleFullScreen, toggleDarkMode, currentLanguage])

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
