import React, { useMemo } from "react"
import { useTranslation } from "react-i18next"
import RadioInput from "./RadioInput"

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
            <RadioInput
              key={language.code}
              name="default-language"
              value={language.code}
              defaultChecked={Boolean(isActive)}
              disabled
              label={language.label}
              containerClassName="cursor-not-allowed"
            />
          )
        })}
      </div>
    </div>
  )
}

export default ChangeLanguageDialog
