import i18n from "i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import { StrictMode } from "react"
import ReactDOM from "react-dom/client"
import { initReactI18next } from "react-i18next"
import App from "./App.tsx"
import { DarkmodeProvider } from "./providers/DarkmodeProvider"
import { DialogProvider } from "./providers/DialogProvider"
import enTranslation from "./assets/translations/en.json"
import jaTranslation from "./assets/translations/ja.json"
import koTranslation from "./assets/translations/ko.json"
import cnTranslation from "./assets/translations/cn.json"
import esTranslation from "./assets/translations/es.json"
import "./index.css"

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslation,
      },
      ko: {
        translation: koTranslation,
      },
      ja: {
        translation: jaTranslation,
      },
      cn: {
        translation: cnTranslation,
      },
      es: {
        translation: esTranslation,
      },
    },
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  })

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DarkmodeProvider>
      <DialogProvider>
        <App />
      </DialogProvider>
    </DarkmodeProvider>
  </StrictMode>,
)
