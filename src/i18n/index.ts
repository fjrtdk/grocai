import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import da from './da.json'
import en from './en.json'

i18n.use(initReactI18next).init({
  resources: { 'da-DK': { translation: da }, 'en-US': { translation: en } },
  lng: 'da-DK',
  fallbackLng: 'da-DK',
  interpolation: { escapeValue: false },
})

export default i18n
