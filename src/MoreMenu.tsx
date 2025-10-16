import React, { useMemo } from "react"
import { useTranslation } from "react-i18next"
import EllipsisVerticalIcon from "./assets/icons/ellipsis-vertical.svg?react"
import IconButton from "./IconButton"
import Menu from "./Menu"

const MoreMenu: React.FC = () => {
  const { t } = useTranslation()

  const menuItems = useMemo(() => ([
    {
      id: "toggle-fullscreen",
      label: t("others.toggleFullscreen", { defaultValue: "Toggle Fullscreen" }),
    },
    {
      id: "toggle-darkmode",
      label: t("others.toggleDarkMode", { defaultValue: "Toggle Darkmode" }),
    },
  ]), [t])

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
