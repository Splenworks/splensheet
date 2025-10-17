import { useMemo, type CSSProperties } from "react"
import { DarkModeSwitch as Icon } from "react-toggle-dark-mode"

interface DarkModeSwitchIconProps {
  darkMode: boolean
  sunColor?: string
  moonColor?: string
  size?: number | string
  className?: string
  style?: CSSProperties
}

const DarkModeSwitchIcon: React.FC<DarkModeSwitchIconProps> = ({
  darkMode,
  sunColor = "white",
  moonColor = "white",
  size = 16,
  className,
  style,
}) => {
  const mergedStyle = useMemo<CSSProperties>(() => ({
    margin: "4px",
    ...style,
  }), [style])

  return (
    <Icon
      size={size}
      checked={darkMode}
      sunColor={sunColor}
      moonColor={moonColor}
      style={mergedStyle}
      onChange={() => { }}
      className={className}
    />
  )
}

export default DarkModeSwitchIcon
