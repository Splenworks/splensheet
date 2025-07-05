import DarkModeSwitchIcon from "./DarkModeSwitchIcon"
import { useState } from "react"

interface ExcelDarkModeToggleIconProps {
  darkMode: boolean
  className?: string
}

const ExcelDarkModeToggleIcon: React.FC<ExcelDarkModeToggleIconProps> = ({ darkMode, className }) => {
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
        className={className}
      />
    </div>
  )
}

export default ExcelDarkModeToggleIcon
