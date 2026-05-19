import { LocaleCode, LocaleStrings } from './types';
import en from './locales/en';
import ar from './locales/ar';

const LOCALES: Record<LocaleCode, LocaleStrings> = {
  en,
  ar,
};

let currentLocale: LocaleCode = 'en';

export const i18n = {
  init(initialLang: string) {
    if (initialLang === 'en' || initialLang === 'ar') {
      currentLocale = initialLang as LocaleCode;
    } else {
      const browserLang = typeof navigator !== 'undefined' ? navigator.language : 'en';
      currentLocale = browserLang.startsWith('ar') ? 'ar' : 'en';
    }
  },

  setLocale(lang: LocaleCode) {
    currentLocale = lang;
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
