import React from "react"
import DarkModeSwitch from "./DarkModeSwitch"

const Header: React.FC = () => {
  return (
    <header className="absolute left-0 right-0 top-0 bg-white dark:bg-neutral-900">
      <div className="mx-8 flex h-16 items-center justify-center md:mx-16">
        <div className="flex flex-1">
        </div>
        <p className="text-lg font-semibold text-black dark:text-white">
          Splen<span className="text-pink-900 dark:text-pink-700">Sheet</span>
        </p>
        <div className="flex flex-1 items-center justify-end">
          <DarkModeSwitch />
        </div>
      </div>
    </header>
  )
}

export default Header
