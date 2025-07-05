import React, { PropsWithChildren, useState } from "react"
import { DarkmodeContext } from "../contexts/DarkmodeContext"

export const DarkmodeProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [darkMode, setDarkMode] = useState(
    document.documentElement.classList.contains("dark"),
  )

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle("dark")
    const isDark = document.documentElement.classList.contains("dark")
    localStorage.setItem("theme", isDark ? "dark" : "light")
    setDarkMode(isDark)
  }

  return (
    <DarkmodeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </DarkmodeContext.Provider>
  )
}
