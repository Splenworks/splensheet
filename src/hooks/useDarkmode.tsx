import { useContext } from "react"
import { DarkmodeContext } from "../contexts/DarkmodeContext"

export const useDarkmode = () => {
  const { darkMode, toggleDarkMode } = useContext(DarkmodeContext)
  return { darkMode, toggleDarkMode }
}
