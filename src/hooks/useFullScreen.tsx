import { useContext } from "react"
import { FullScreenContext } from "../contexts/FullScreenContext"

export const useFullScreen = () => {
  const { isFullScreen, toggleFullScreen } = useContext(FullScreenContext)
  return { isFullScreen, toggleFullScreen }
}
