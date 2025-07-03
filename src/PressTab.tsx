import React, { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { twJoin } from "tailwind-merge"

interface PressTabProps {
  isTouchDevice: boolean
}

const PressTab: React.FC<PressTabProps> = ({ isTouchDevice }) => {
  const [showMessage, setShowMessage] = useState(false)
  const { t } = useTranslation()

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowMessage(true)
    }, 300)

    return () => {
      clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    const hideTimer = setTimeout(() => {
      setShowMessage(false)
    }, 5000)

    return () => {
      clearTimeout(hideTimer)
    }
  }, [])

  return (
    <div className="fixed left-0 right-0 top-10 flex justify-center">
      <p
        className={twJoin(
          "bg-neutral-900 px-8 py-3 font-semibold text-white transition-opacity duration-500 ease-in-out",
          showMessage ? "opacity-75" : "opacity-0",
        )}
      >
        {isTouchDevice ? t("messages.longTouch") : t("messages.pressTab")}
      </p>
    </div>
  )
}

export default PressTab
