import React, { PropsWithChildren, useEffect } from "react"
import { FullScreenContext } from "../contexts/FullScreenContext"

const FULLSCREEN_ELEMENT_ID = "fullscreenSection"

export const FullScreenProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [isFullScreen, setIsFullScreen] = React.useState(
    !!document.fullscreenElement,
  )
  const toggleFullScreen = () => {
    const fullscreenSection = document.querySelector(
      "#" + FULLSCREEN_ELEMENT_ID,
    )
    if (!fullscreenSection) return

    if (!document.fullscreenElement) {
      fullscreenSection.requestFullscreen().catch((err) => {
        alert(
          `Error attempting to enable fullscreen mode: ${err.message} (${err.name})`,
        )
      })
    } else {
      document.exitFullscreen()
    }
  }

  useEffect(() => {
    const onFullScreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullScreen(false)
      } else {
        setIsFullScreen(true)
      }
    }
    addEventListener("fullscreenchange", onFullScreenChange)
    return () => {
      removeEventListener("fullscreenchange", onFullScreenChange)
    }
  }, [])

  return (
    <FullScreenContext.Provider value={{ isFullScreen, toggleFullScreen }}>
      <div id={FULLSCREEN_ELEMENT_ID}>{children}</div>
    </FullScreenContext.Provider>
  )
}
