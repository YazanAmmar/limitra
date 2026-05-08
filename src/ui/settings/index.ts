import { StorageFacade } from '../../core/storage/index';
import { ChromeStorageDriver } from '../../adapters/chrome/storage-driver';
import { i18n } from '../../i18n/index';
import { PlatformId } from '../../types';
import { LocaleCode } from '../../i18n/types';
import { initCustomSelects } from '../components/custom-select';
import { showModal } from '../components/modal';
import { initTooltips } from '../components/tooltip';
import { AnalyticsLoader } from './analytics-loader';
import { IndexedDbAnalyticsRepository } from '../../adapters/browser/indexeddb-analytics';

const storageDriver = new ChromeStorageDriver();
const storage = new StorageFacade(storageDriver);

storage.setAnalyticsRepository(new IndexedDbAnalyticsRepository());

function applyTheme(theme: string) {
  const isPageDark =
    theme === 'dark' ||
    (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (isPageDark) document.documentElement.classList.add('dark');
  else document.documentElement.classList.remove('dark');
}

function updateUITexts() {
  const t = i18n.t;

  const map: Record<string, string> = {
    // Navigation
    'dash-title': t.dashboard.title,
    'nav-general': t.dashboard.sidebarGeneral,
    'nav-analytics': t.dashboard.sidebarAnalytics,
    'nav-ai': t.dashboard.sidebarAI,
    'nav-about': t.dashboard.sidebarAbout,
    'badge-analytics-soon': t.dashboard.comingSoon,
    'badge-ai-soon': t.dashboard.comingSoon,

    // About
    'title-about': t.dashboard.aboutTitle,
    'desc-about': t.dashboard.aboutDesc,

    // Language
    'lbl-dash-language': t.dashboard.languageLabel,
    'desc-dash-language': t.dashboard.descLanguage,

    // Theme
    'lbl-dash-theme': t.dashboard.themeLabel,
    'desc-dash-theme': t.dashboard.descTheme,
    'opt-theme-auto': t.dashboard.themeAuto,
    'opt-theme-light': t.dashboard.themeLight,
    'opt-theme-dark': t.dashboard.themeDark,

    // Tone
    'lbl-dash-tone': t.dashboard.toneLabel,
    'desc-dash-tone': t.dashboard.descTone,
    'opt-dash-random': t.tones.random,
    'opt-dash-gentle': t.tones.gentle,
    'opt-dash-harsh': t.tones.harsh,
    'opt-dash-phil': t.tones.philosophical,
    'opt-dash-sarcastic': t.tones.sarcastic,
    'opt-dash-stoic': t.tones.stoic,

    // Tracking
    'lbl-dash-tracking': t.dashboard.trackingMode,
    'desc-dash-tracking': t.dashboard.descTracking,
    'opt-strict': t.dashboard.modeStrictLabel,
    'opt-playing': t.dashboard.modePlayingLabel,
    'opt-smart': t.dashboard.modeSmartLabel,

    // Block Condition
    'lbl-dash-condition': t.dashboard.blockConditionLabel,
    'desc-dash-condition': t.dashboard.descBlockCondition,
    'opt-cond-or': t.dashboard.condOr,
    'opt-cond-and': t.dashboard.condAnd,

    // Groups
    'group-customization': t.dashboard.groupCustomization,
    'group-security': t.dashboard.groupSecurity,

    // Block Duration
    'lbl-dash-duration': t.dashboard.blockDurationLabel,
    'desc-dash-duration': t.dashboard.descBlockDuration,
    'opt-dur-15m': t.dashboard.duration15m,
    'opt-dur-1h': t.dashboard.duration1h,
    'opt-dur-3h': t.dashboard.duration3h,
    'opt-dur-6h': t.dashboard.duration6h,
    'opt-dur-12h': t.dashboard.duration12h,
    'opt-dur-24h': t.dashboard.duration24h,

    // Data
    'group-data': t.dashboard.groupData,
    'lbl-dash-reset': t.dashboard.resetTitle,
    'desc-dash-reset': t.dashboard.resetDesc,
    'btn-reset-settings': t.dashboard.resetBtn,

    // CTA
    'btn-sponsor-text': t.dashboard.btnSponsor,

    // Footer
    'footer-copyright': t.dashboard.footerCopyright,
    'footer-privacy': t.dashboard.footerPrivacy,
  };

  Object.entries(map).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  });

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
          document.getElementById(`content-${t}`)?.classList.remove('active');
        });

        btn.classList.add('active');
        document.getElementById(`content-${tab}`)?.classList.add('active');
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

function updateConditionDescription(mode: string) {
  const t = i18n.t;
  const el = document.getElementById('desc-dash-condition') as HTMLElement;
  if (!el) return;

  const map: Record<string, string> = {
    or: t.dashboard.descCondOr,
    and: t.dashboard.descCondAnd,
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

  const dashConditionInput = document.getElementById('dash-condition') as HTMLSelectElement;
  const savedCondition = await storage.getBlockCondition();
  dashConditionInput.value = savedCondition;
  updateConditionDescription(savedCondition);

  dashConditionInput.addEventListener('change', async (event) => {
    const target = event.target as HTMLSelectElement;
    await storage.setBlockCondition(target.value);
    updateConditionDescription(target.value);
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

  const dashDurationInput = document.getElementById('dash-duration') as HTMLSelectElement;
  dashDurationInput.value = String(await storage.getBlockDuration());
  dashDurationInput.addEventListener('change', async (event) => {
    const target = event.target as HTMLSelectElement;
    await storage.setBlockDuration(Number(target.value));
  });

  const btnResetSettings = document.getElementById('btn-reset-settings') as HTMLButtonElement;
  if (btnResetSettings) {
    btnResetSettings.addEventListener('click', async () => {
      const isConfirmed = await showModal({
        badgeText: i18n.t.dashboard.modalBadgeWarning,
        title: i18n.t.dashboard.resetTitle,
        message: i18n.t.dashboard.confirmResetMsg,
        confirmText: i18n.t.dashboard.resetBtn,
        cancelText: i18n.t.dashboard.cancelBtn,
      });

      if (isConfirmed) {
        btnResetSettings.disabled = true;
        const originalText = btnResetSettings.textContent;
        btnResetSettings.textContent = i18n.t.dashboard.resettingBtn;

        await storage.resetGlobalSettings();

        btnResetSettings.textContent = originalText;
        btnResetSettings.disabled = false;

        window.location.reload();
      }
    });
  }

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

          document.querySelectorAll('.custom-brutal-select').forEach((el) => el.remove());
          document.querySelectorAll('select').forEach((el) => {
            el.classList.remove('brutal-select-hidden');
          });

          initCustomSelects();

          dashLangInput.value = i18n.language;

          const currentTracking = dashTrackingInput.value;
          updateTrackingDescription(currentTracking);
          updateConditionDescription(dashConditionInput.value);
        });
      }
      if (changes['limitra_block_condition']) {
        const newCond = String(changes['limitra_block_condition'].newValue);
        dashConditionInput.value = newCond;
        updateConditionDescription(newCond);
      }
      if (changes['limitra_block_duration']) {
        dashDurationInput.value = String(changes['limitra_block_duration'].newValue);
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

  // Analytics
  const analyticsLoader = new AnalyticsLoader(storage);
  const analyticsPlatformSelector = document.getElementById(
    'analytics-platform-selector',
  ) as HTMLSelectElement;

  if (analyticsPlatformSelector) {
    analyticsPlatformSelector.addEventListener('change', (e) => {
      const selectedPlatform = (e.target as HTMLSelectElement).value as PlatformId;
      void analyticsLoader.loadAndRender(selectedPlatform);
    });
  }

  const navAnalyticsBtn = document.getElementById('nav-analytics');
  if (navAnalyticsBtn) {
    navAnalyticsBtn.addEventListener('click', () => {
      if (analyticsPlatformSelector) {
        const currentPlatform = analyticsPlatformSelector.value as PlatformId;
        void analyticsLoader.loadAndRender(currentPlatform);
      }
    });
  }

  initCustomSelects();
  initTooltips();
}

void init();
