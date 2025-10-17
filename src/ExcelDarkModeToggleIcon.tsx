import DarkModeSwitchIcon from "./DarkModeSwitchIcon"
import { useState, type CSSProperties } from "react"

interface ExcelDarkModeToggleIconProps {
  darkMode: boolean
  className?: string
  style?: CSSProperties
}

const ExcelDarkModeToggleIcon: React.FC<ExcelDarkModeToggleIconProps> = ({
  darkMode,
  className,
  style,
}) => {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <DarkModeSwitchIcon
        darkMode={darkMode}
        sunColor={hovered ? "white" : "#E5E7EB"} // white on hover, gray-200 otherwise
        moonColor="white"
        size={16}
        style={style}
        className={className}
      />
    </div>
  )
}

export default ExcelDarkModeToggleIcon
