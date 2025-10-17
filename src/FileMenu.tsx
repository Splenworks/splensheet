import React, { useMemo } from "react"
import { ArrowDownTrayIcon, FolderOpenIcon, PlusIcon, Bars3Icon } from "@heroicons/react/24/outline"
import { useTranslation } from "react-i18next"
import Menu from "./Menu"
import IconButton from "./IconButton"
import CommitHash from "virtual:commit-hash"

interface FileMenuProps {
  onOpen?: () => void
  onDownload?: () => void
}

const MenuIcon: React.FC<{ className?: string }> = ({ className }) => (
  <Bars3Icon className={className} />
)

const FileMenu: React.FC<FileMenuProps> = ({ onOpen, onDownload }) => {
  const { t } = useTranslation()

  const menuItems = useMemo(() => ([
    {
      id: "new",
      label: t("menu.new"),
      icon: PlusIcon,
      onSelect: () => window.open(new URL(import.meta.env.BASE_URL, window.location.origin).toString(), "_blank", "noopener,noreferrer"),
    },
    {
      id: "open",
      label: t("menu.open"),
      icon: FolderOpenIcon,
      onSelect: onOpen,
    },
    {
      id: "download",
      label: t("menu.download"),
      icon: ArrowDownTrayIcon,
      onSelect: onDownload,
    },
    { id: "divider-1", type: "divider" as const },
    {
      id: "open-source",
      label: t("menu.openSource"),
      onSelect: () => window.open("https://github.com/Splenworks/splensheet", "_blank", "noopener,noreferrer"),
    },
    { id: "version", type: "info" as const, label: `${t("menu.version")} ${APP_VERSION}.${CommitHash.substring(0, 7)}` },
  ]), [t, onOpen, onDownload])

  return (
    <Menu
      items={menuItems}
      renderTrigger={({ toggle, isOpen }) => (
        <IconButton
          svgIcon={MenuIcon}
          onClick={toggle}
          isHover={isOpen}
        />
      )}
    />
  )
}

export default FileMenu
