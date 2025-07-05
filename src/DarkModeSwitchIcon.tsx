import { DarkModeSwitch as Icon } from "react-toggle-dark-mode"

interface DarkModeSwitchIconProps {
  darkMode: boolean
  sunColor?: string
  moonColor?: string
  size?: number | string
  className?: string
}

const DarkModeSwitchIcon: React.FC<DarkModeSwitchIconProps> = ({
  darkMode,
  sunColor = "white",
  moonColor = "white",
  size = 16,
  className,
}) => {
  return (
    <Icon
      size={size}
      checked={darkMode}
      sunColor={sunColor}
      moonColor={moonColor}
      style={{ margin: "4px" }}
      onChange={() => { }}
      className={className}
    />
  )
}

export default DarkModeSwitchIcon
