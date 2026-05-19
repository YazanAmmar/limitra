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
import { UIRenderer } from './ui-renderer';

const storageDriver = new ChromeStorageDriver();
const storage = new StorageFacade(storageDriver);

storage.setAnalyticsRepository(new IndexedDbAnalyticsRepository());
const ui = new UIRenderer();

async function init() {
  const savedTheme = await storage.getTheme();
  ui.applyTheme(savedTheme);

  const savedLang = await storage.getLanguage();
  i18n.init(savedLang);
  ui.updateUITexts();
  ui.setupNavigation();

  const dashTrackingInput = document.getElementById('dash-tracking') as HTMLSelectElement;
  const dashLangInput = document.getElementById('dash-language') as HTMLSelectElement;
  dashLangInput.value = i18n.language;
  dashLangInput.addEventListener('change', async (event) => {
    const target = event.target as HTMLSelectElement;
    const newLang = target.value as LocaleCode;

    if (newLang !== i18n.language) {
      i18n.setLocale(newLang);
      await storage.setLanguage(newLang);

      ui.updateUITexts();
      const currentTracking = dashTrackingInput.value;
      ui.updateTrackingDescription(currentTracking);
    }
  });

  const savedTracking = await storage.getTrackingMode();
  dashTrackingInput.value = savedTracking;
  ui.updateTrackingDescription(savedTracking);
  dashTrackingInput.addEventListener('change', async (event) => {
    const target = event.target as HTMLSelectElement;

    await storage.setTrackingMode(target.value);
    ui.updateTrackingDescription(target.value);
  });

  const dashConditionInput = document.getElementById('dash-condition') as HTMLSelectElement;
  const savedCondition = await storage.getBlockCondition();
  dashConditionInput.value = savedCondition;
  ui.updateConditionDescription(savedCondition);

  dashConditionInput.addEventListener('change', async (event) => {
    const target = event.target as HTMLSelectElement;
    await storage.setBlockCondition(target.value);
    ui.updateConditionDescription(target.value);
  });

  const dashThemeInput = document.getElementById('dash-theme') as HTMLSelectElement;
  dashThemeInput.value = savedTheme;
  dashThemeInput.addEventListener('change', async (event) => {
    const target = event.target as HTMLSelectElement;
    await storage.setTheme(target.value);
    ui.applyTheme(target.value);
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

  storage.onChange((changes) => {
    if (changes['limitra_theme']) {
      const newTheme = String(changes['limitra_theme'].newValue);
      ui.applyTheme(newTheme);
      dashThemeInput.value = newTheme;
    }

    if (changes['limitra_language']) {
      const newLang = String(changes['limitra_language'].newValue) as LocaleCode;
      i18n.setLocale(newLang);

      ui.updateUITexts();

      document.querySelectorAll('.custom-brutal-select').forEach((el) => el.remove());
      document.querySelectorAll('select').forEach((el) => {
        el.classList.remove('brutal-select-hidden');
      });

      initCustomSelects();

      dashLangInput.value = i18n.language;

      const currentTracking = dashTrackingInput.value;
      ui.updateTrackingDescription(currentTracking);
      ui.updateConditionDescription(dashConditionInput.value);
    }

    if (changes['limitra_block_condition']) {
      const newCond = String(changes['limitra_block_condition'].newValue);
      dashConditionInput.value = newCond;
      ui.updateConditionDescription(newCond);
    }

    if (changes['limitra_block_duration']) {
      dashDurationInput.value = String(changes['limitra_block_duration'].newValue);
    }

    if (changes['limitra_quote_tone']) {
      dashToneInput.value = String(changes['limitra_quote_tone'].newValue);
    }
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (dashThemeInput.value === 'auto') {
      ui.applyTheme('auto');
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

  const trendRangeSelector = document.getElementById('trend-range-selector') as HTMLSelectElement;

  if (trendRangeSelector) {
    trendRangeSelector.addEventListener('change', async (e) => {
      const target = e.target as HTMLSelectElement;
      const selectedValue = target.value;

      if (selectedValue === '30' || selectedValue === '365') {
        await showModal({
          badgeText: i18n.t.dashboard.premiumBadge,
          title: i18n.t.dashboard.comingSoonTitle,
          message: i18n.t.dashboard.comingSoonDesc,
          confirmText: 'OK',
        });

        target.value = '7';

        document.querySelectorAll('.custom-brutal-select').forEach((el) => el.remove());
        document.querySelectorAll('select').forEach((el) => {
          el.classList.remove('brutal-select-hidden');
        });
        initCustomSelects();
      } else if (selectedValue === '7') {
        // TODO: fetch backend data once ready
      }
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
