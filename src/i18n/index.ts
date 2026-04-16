import { LocaleCode, LocaleStrings } from './types';
import en from './locales/en';
import ar from './locales/ar';
import { storage } from '../core/storage';

const LOCALES: Record<LocaleCode, LocaleStrings> = {
  en,
  ar,
};

let currentLocale: LocaleCode = 'en';
let isInitialized = false;

export const i18n = {
  async init() {
    if (isInitialized) return;

    const savedLang = await storage.getLanguage();
    if (savedLang === 'en' || savedLang === 'ar') {
      currentLocale = savedLang;
    } else {
      const browserLang = chrome.i18n.getUILanguage();
      currentLocale = browserLang.startsWith('ar') ? 'ar' : 'en';
    }

    isInitialized = true;
  },

  async setLocale(lang: LocaleCode) {
    currentLocale = lang;
    await storage.setLanguage(lang);
  },

  get language(): LocaleCode {
    return currentLocale;
  },

  get t(): LocaleStrings {
    return LOCALES[currentLocale] || LOCALES['en'];
  },

  getRandomQuote(tone: string | null): string {
    let selectedTone = tone;

    if (!selectedTone || selectedTone === 'random' || !(selectedTone in this.t.quotes)) {
      const availableTones = Object.keys(this.t.quotes);
      selectedTone = availableTones[Math.floor(Math.random() * availableTones.length)];
    }

    const quotesArray = this.t.quotes[selectedTone as keyof LocaleStrings['quotes']];
    return quotesArray[Math.floor(Math.random() * quotesArray.length)];
  },
};
