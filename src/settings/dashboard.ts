import { storage } from '../core/storage';
import { i18n } from '../i18n/index';
import { LocaleCode } from '../i18n/types';

function applyTheme(theme: string) {
  const isPageDark =
    theme === 'dark' ||
    (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (isPageDark) document.documentElement.classList.add('dark');
  else document.documentElement.classList.remove('dark');
}

function updateUITexts() {
  const t = i18n.t;
  (document.getElementById('dash-title') as HTMLElement).textContent = t.dashboard.title;
  (document.getElementById('nav-general') as HTMLElement).textContent = t.dashboard.sidebarGeneral;
  (document.getElementById('nav-analytics') as HTMLElement).textContent =
    t.dashboard.sidebarAnalytics;
  (document.getElementById('nav-ai') as HTMLElement).textContent = t.dashboard.sidebarAI;
  (document.getElementById('nav-about') as HTMLElement).textContent = t.dashboard.sidebarAbout;

  (document.getElementById('title-about') as HTMLElement).textContent = t.dashboard.aboutTitle;
  (document.getElementById('desc-about') as HTMLElement).textContent = t.dashboard.aboutDesc;

  (document.getElementById('lbl-dash-language') as HTMLElement).textContent =
    t.dashboard.languageLabel;
  (document.getElementById('lbl-dash-tracking') as HTMLElement).textContent =
    t.dashboard.trackingMode;

  (document.getElementById('opt-strict') as HTMLOptionElement).textContent =
    t.dashboard.modeStrictLabel;

  (document.getElementById('opt-playing') as HTMLOptionElement).textContent =
    t.dashboard.modePlayingLabel;

  (document.getElementById('opt-smart') as HTMLOptionElement).textContent =
    t.dashboard.modeSmartLabel;

  (document.getElementById('badge-analytics-soon') as HTMLElement).textContent =
    t.dashboard.comingSoon;
  (document.getElementById('badge-ai-soon') as HTMLElement).textContent = t.dashboard.comingSoon;

  (document.getElementById('group-customization') as HTMLElement).textContent =
    t.dashboard.groupCustomization;
  (document.getElementById('desc-dash-language') as HTMLElement).textContent =
    t.dashboard.descLanguage;
  (document.getElementById('group-security') as HTMLElement).textContent =
    t.dashboard.groupSecurity;

  (document.getElementById('lbl-dash-theme') as HTMLElement).textContent = t.dashboard.themeLabel;
  (document.getElementById('desc-dash-theme') as HTMLElement).textContent = t.dashboard.descTheme;
  (document.getElementById('opt-theme-auto') as HTMLOptionElement).textContent =
    t.dashboard.themeAuto;
  (document.getElementById('opt-theme-light') as HTMLOptionElement).textContent =
    t.dashboard.themeLight;
  (document.getElementById('opt-theme-dark') as HTMLOptionElement).textContent =
    t.dashboard.themeDark;

  (document.getElementById('lbl-dash-tone') as HTMLElement).textContent = t.dashboard.toneLabel;
  (document.getElementById('desc-dash-tone') as HTMLElement).textContent = t.dashboard.descTone;
  (document.getElementById('opt-dash-random') as HTMLOptionElement).textContent = t.tones.random;
  (document.getElementById('opt-dash-gentle') as HTMLOptionElement).textContent = t.tones.gentle;
  (document.getElementById('opt-dash-harsh') as HTMLOptionElement).textContent = t.tones.harsh;
  (document.getElementById('opt-dash-phil') as HTMLOptionElement).textContent =
    t.tones.philosophical;

  document.body.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
}

function setupNavigation() {
  const tabs = ['general', 'analytics', 'ai', 'about'];
  tabs.forEach((tab) => {
    const btn = document.getElementById(`nav-${tab}`);
    if (btn) {
      btn.onclick = () => {
        tabs.forEach((t) => {
          document.getElementById(`nav-${t}`)?.classList.remove('active');
          const card = document.getElementById(`card-${t}`);
          if (card) card.style.display = 'none';
        });
        btn.classList.add('active');
        const activeCard = document.getElementById(`card-${tab}`);
        if (activeCard) activeCard.style.display = 'block';
      };
    }
  });
  document.getElementById('nav-general')?.click();
}

function updateTrackingDescription(mode: string) {
  const t = i18n.t;
  const el = document.getElementById('desc-dash-tracking') as HTMLElement;

  if (!el) return;

  const map: Record<string, string> = {
    strict: t.dashboard.modeStrict,
    playing_only: t.dashboard.modePlaying,
    smart: t.dashboard.modeSmart,
  };

  el.textContent = map[mode] || '';
}

async function init() {
  const savedTheme = await storage.getTheme();
  applyTheme(savedTheme);

  await i18n.init();
  updateUITexts();
  setupNavigation();

  const dashTrackingInput = document.getElementById('dash-tracking') as HTMLSelectElement;
  const dashLangInput = document.getElementById('dash-language') as HTMLSelectElement;
  dashLangInput.value = i18n.language;
  dashLangInput.addEventListener('change', (event) => {
    const target = event.target as HTMLSelectElement;
    const newLang = target.value as LocaleCode;
    if (newLang !== i18n.language) {
      void i18n.setLocale(newLang).then(() => {
        updateUITexts();

        const currentTracking = dashTrackingInput.value;
        updateTrackingDescription(currentTracking);
      });
    }
  });

  const savedTracking = await storage.getTrackingMode();
  dashTrackingInput.value = savedTracking;
  updateTrackingDescription(savedTracking);
  dashTrackingInput.addEventListener('change', async (event) => {
    const target = event.target as HTMLSelectElement;

    await storage.setTrackingMode(target.value);
    updateTrackingDescription(target.value);
  });

  const dashThemeInput = document.getElementById('dash-theme') as HTMLSelectElement;
  dashThemeInput.value = savedTheme;
  dashThemeInput.addEventListener('change', async (event) => {
    const target = event.target as HTMLSelectElement;
    await storage.setTheme(target.value);
    applyTheme(target.value);
  });

  const dashToneInput = document.getElementById('dash-tone') as HTMLSelectElement;
  dashToneInput.value = await storage.getQuoteTone();
  dashToneInput.addEventListener('change', async (event) => {
    const target = event.target as HTMLSelectElement;
    await storage.setQuoteTone(target.value);
  });

  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
      if (changes['limitra_theme']) {
        const newTheme = String(changes['limitra_theme'].newValue);
        applyTheme(newTheme);
        dashThemeInput.value = newTheme;
      }
      if (changes['limitra_language']) {
        const newLang = String(changes['limitra_language'].newValue) as LocaleCode;
        void i18n.setLocale(newLang).then(() => {
          updateUITexts();
          dashLangInput.value = i18n.language;

          const currentTracking = dashTrackingInput.value;
          updateTrackingDescription(currentTracking);
        });
      }
      if (changes['limitra_quote_tone']) {
        dashToneInput.value = String(changes['limitra_quote_tone'].newValue);
      }
    }
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (dashThemeInput.value === 'auto') {
      applyTheme('auto');
    }
  });
}

void init();
