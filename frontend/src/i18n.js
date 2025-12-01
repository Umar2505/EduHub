import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './i18n/en.json';
import uzTranslations from './i18n/uz.json';
import ruTranslations from './i18n/ru.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      uz: { translation: uzTranslations },
      ru: { translation: ruTranslations },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
