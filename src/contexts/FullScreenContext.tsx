import { createContext } from "react"

export const FullScreenContext = createContext<{
  isFullScreen: boolean
  toggleFullScreen: () => void
}>({
  isFullScreen: false,
  toggleFullScreen: () => {},
})
