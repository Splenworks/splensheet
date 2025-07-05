import { createContext } from "react"

export const DarkmodeContext = createContext<{
  darkMode: boolean
  toggleDarkMode: () => void
}>({
  darkMode: false,
  toggleDarkMode: () => {},
})
