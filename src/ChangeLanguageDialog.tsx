import React, { useMemo } from "react"
import { useTranslation } from "react-i18next"

interface ChangeLanguageDialogProps {
  activeLanguage: string
}

const ChangeLanguageDialog: React.FC<ChangeLanguageDialogProps> = ({ activeLanguage }) => {
  const { t } = useTranslation()
  const languageOptions = useMemo(() => ([
    { code: "en", label: t("languages.english", { defaultValue: "English" }) },
    { code: "ko", label: t("languages.korean", { defaultValue: "Korean" }) },
    { code: "ja", label: t("languages.japanese", { defaultValue: "Japanese" }) },
    { code: "cn", label: t("languages.chinese", { defaultValue: "Chinese (Simplified)" }) },
    { code: "es", label: t("languages.spanish", { defaultValue: "Spanish" }) },
  ]), [t])

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {languageOptions.map((language) => {
          const isActive = activeLanguage.startsWith(language.code)
          return (
            <label
              key={language.code}
              className="flex cursor-not-allowed items-center gap-2 rounded-md border border-transparent px-2 py-1 text-sm text-gray-700 dark:text-neutral-200"
            >
              <input
                type="radio"
                name="default-language"
                value={language.code}
                defaultChecked={Boolean(isActive)}
                disabled
                className="h-4 w-4"
              />
              <span>{language.label}</span>
            </label>
          )
        })}
      </div>
      <p className="text-xs text-gray-500 dark:text-neutral-400">
        {t("dialog.changeLanguage.comingSoon", { defaultValue: "Language switching is coming soon." })}
      </p>
    </div>
  )
}

export default ChangeLanguageDialog
