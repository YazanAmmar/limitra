import { StorageFacade } from '../../core/storage/index';
import { ChromeStorageDriver } from '../../adapters/chrome/storage-driver';
import { i18n } from '../../i18n/index';
import { PlatformId } from '../../types';
import { initCustomSelects } from '../components/custom-select';
import {
  isYouTubeUrl,
  getPlatformType as getYoutubePlatform,
} from '../../platforms/youtube/parser';
import {
  isInstagramUrl,
  getPlatformType as getInstagramPlatform,
} from '../../platforms/instagram/parser';
import { IndexedDbAnalyticsRepository } from '../../adapters/browser/indexeddb-analytics';
import { ChromePopupContext } from '../../adapters/chrome/popup-context';

const storageDriver = new ChromeStorageDriver();
const storage = new StorageFacade(storageDriver);

storage.setAnalyticsRepository(new IndexedDbAnalyticsRepository());

const limitInput = document.getElementById('limit') as HTMLInputElement;
const timeInput = document.getElementById('timeLimit') as HTMLInputElement;
const toggleLimit = document.getElementById('toggle-limit') as HTMLInputElement;
const toggleTime = document.getElementById('toggle-time') as HTMLInputElement;
const btnSave = document.getElementById('save') as HTMLButtonElement;
const btnSettings = document.getElementById('settings-btn') as HTMLButtonElement;
const themeToggleBtn = document.getElementById('theme-toggle') as HTMLButtonElement;
const sunIcon = document.getElementById('sun-icon') as HTMLElement;
const moonIcon = document.getElementById('moon-icon') as HTMLElement;
const platformSelector = document.getElementById('platform-selector') as HTMLSelectElement;
const popupContext = new ChromePopupContext();

let activePlatform: PlatformId | null = null;

let currentConsumedCount = 0;
let currentConsumedTimeMs = 0;
let clickCount = 0;
let spamResetTimer: number | null = null;
let pollingInterval: ReturnType<typeof setInterval> | null = null;

function setText(id: string, value: string) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function updateUITexts() {
  const t = i18n.t;

  const map: Record<string, string> = {
    'app-title': t.popup.title,
    'lbl-max-videos': t.popup.maxVideos,
    'lbl-time-limit': t.popup.timeLimit,
    'lbl-usage-videos': t.popup.videosUnit,
    'lbl-usage-time': t.popup.timeTitle,
  };
  Object.entries(map).forEach(([id, value]) => setText(id, value));

  const platformMap: Record<string, string> = {
    youtube_shorts: t.popup.youtubeShorts,
    youtube_watch: t.popup.youtubeWatch,
    instagram_reels: t.popup.instagramReels,
    instagram_feed: t.popup.instagramFeed,
    '': t.popup.selectPlatform,
  };

  Array.from(platformSelector.options).forEach((option) => {
    if (option.value in platformMap) {
      option.textContent = platformMap[option.value as keyof typeof platformMap];
    }
  });

  btnSave.textContent = t.popup.saveBtn;
  document.body.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  updateProgressBar();
}

function updateProgressBar() {
  const isLimitEnabled = toggleLimit.checked;
  const isTimeEnabled = toggleTime.checked;
  const limit = Number(limitInput.value) || 0;
  const timeLimit = Number(timeInput.value) || 0;
  const timeSpentMins = Math.floor(currentConsumedTimeMs / (60 * 1000));
  const t = i18n.t;

  const containerVideos = document.getElementById('track-container-videos') as HTMLElement;
  const containerTime = document.getElementById('track-container-time') as HTMLElement;
  const usageSection = document.getElementById('usage-section') as HTMLElement;

  if (!isLimitEnabled && !isTimeEnabled) {
    usageSection.classList.add('hidden');
    return;
  }
  usageSection.classList.remove('hidden');

  if (isLimitEnabled) {
    containerVideos.classList.remove('hidden');
    const pCount = limit > 0 ? Math.min((currentConsumedCount / limit) * 100, 100) : 0;
    setText('stats-videos', `${currentConsumedCount} / ${limit} ${t.popup.videosUnit}`);

    const fillV = document.getElementById('fill-videos') as HTMLElement;
    fillV.setAttribute('style', `--progress: ${pCount}%`);
    fillV.classList.toggle('is-complete', pCount >= 100 && limit > 0);
  } else {
    containerVideos.classList.add('hidden');
  }

  if (isTimeEnabled) {
    containerTime.classList.remove('hidden');
    const pTime = timeLimit > 0 ? Math.min((timeSpentMins / timeLimit) * 100, 100) : 0;
    setText('stats-time', `${timeSpentMins} / ${timeLimit} ${t.popup.minsUnit}`);

    const fillT = document.getElementById('fill-time') as HTMLElement;
    fillT.setAttribute('style', `--progress: ${pTime}%`);
    fillT.classList.toggle('is-complete', pTime >= 100 && timeLimit > 0);
  } else {
    containerTime.classList.add('hidden');
  }
}

function syncUIState(isBlocked: boolean, count: number, timeMs: number) {
  const timeSpentMins = Math.floor(timeMs / (60 * 1000));
  const hasConsumed = count > 0 || timeSpentMins > 0;

  const inputs = [limitInput, timeInput, toggleLimit, toggleTime];
  if (isBlocked) {
    inputs.forEach((i) => (i.disabled = true));
    btnSave.disabled = true;
    btnSave.textContent = i18n.t.popup.lockedBtn;
  } else if (hasConsumed) {
    inputs.forEach((i) => (i.disabled = true));
    btnSave.disabled = true;
    btnSave.textContent = i18n.t.popup.sessionActiveBtn;
  } else {
    toggleLimit.disabled = false;
    toggleTime.disabled = false;
    limitInput.disabled = !toggleLimit.checked;
    timeInput.disabled = !toggleTime.checked;
    btnSave.disabled = false;
    btnSave.textContent = i18n.t.popup.saveBtn;
  }
}

function lockUIForSelection() {
  limitInput.value = '';
  timeInput.value = '';
  [limitInput, timeInput, toggleLimit, toggleTime].forEach((i) => (i.disabled = true));
  btnSave.disabled = false;
  btnSave.textContent = i18n.t.popup.selectPlatform;

  setText('stats-videos', `-- / --`);
  setText('stats-time', `-- / --`);
  document.getElementById('fill-videos')?.setAttribute('style', `--progress: 0%`);
  document.getElementById('fill-time')?.setAttribute('style', `--progress: 0%`);
}

async function loadPlatformData() {
  if (!activePlatform) return;
  const [limit, timeLimit, isLimitEnabled, isTimeEnabled, isBlocked, count] = await Promise.all([
    storage.getLimit(activePlatform),
    storage.getTimeLimit(activePlatform),
    storage.getEnableLimit(activePlatform),
    storage.getEnableTime(activePlatform),
    storage.isCurrentlyBlocked(activePlatform),
    storage.getCount(activePlatform),
  ]);

  const timeSpentMs = storage.analyticsService
    ? await storage.analyticsService.getTodayUsage(activePlatform)
    : await storage.getTimeSpent(activePlatform);

  currentConsumedCount = count;
  currentConsumedTimeMs = timeSpentMs;

  limitInput.value = String(limit);
  timeInput.value = String(timeLimit);
  toggleLimit.checked = isLimitEnabled;
  toggleTime.checked = isTimeEnabled;

  syncUIState(isBlocked, count, timeSpentMs);
  updateProgressBar();
}

async function init() {
  const savedTheme = await storage.getTheme();
  applyTheme(savedTheme);

  const lang = await storage.getLanguage();
  i18n.init(lang);
  updateUITexts();

  const currentUrl = await popupContext.getActiveTabUrl();

  if (isYouTubeUrl(currentUrl)) {
    activePlatform = getYoutubePlatform(currentUrl);
  } else if (isInstagramUrl(currentUrl)) {
    activePlatform = getInstagramPlatform(currentUrl);
  } else {
    activePlatform = null;
  }

  if (activePlatform) {
    platformSelector.value = activePlatform;
    await loadPlatformData();
  } else {
    platformSelector.value = '';
    lockUIForSelection();
  }

  initCustomSelects();

  platformSelector.addEventListener('change', (e) => {
    activePlatform = (e.target as HTMLSelectElement).value as PlatformId;
    if (activePlatform) void loadPlatformData();
    else lockUIForSelection();
  });

  limitInput.addEventListener('input', updateProgressBar);
  timeInput.addEventListener('input', updateProgressBar);

  if (pollingInterval) clearInterval(pollingInterval);
  pollingInterval = setInterval(async () => {
    if (activePlatform && storage.analyticsService) {
      const freshTimeMs = await storage.analyticsService.getTodayUsage(activePlatform);
      if (freshTimeMs !== currentConsumedTimeMs) {
        currentConsumedTimeMs = freshTimeMs;
        updateProgressBar();
      }
    }
  }, 2000);
}

function applyTheme(theme: string) {
  const isPageDark =
    theme === 'dark' ||
    (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  document.documentElement.classList.toggle('dark', isPageDark);
  sunIcon.classList.toggle('hidden', !isPageDark);
  moonIcon.classList.toggle('hidden', isPageDark);
}

btnSave.onclick = async (e: MouseEvent) => {
  if (!activePlatform) {
    e.stopPropagation();
    (document.querySelector('.custom-brutal-trigger') as HTMLElement)?.click();
    return;
  }

  clickCount++;
  if (spamResetTimer) clearTimeout(spamResetTimer);
  spamResetTimer = window.setTimeout(() => (clickCount = 0), 2000);

  if (clickCount >= 10) {
    btnSave.textContent = i18n.t.popup.stopSpamming;
    btnSave.disabled = true;

    setTimeout(() => {
      btnSave.textContent = i18n.t.popup.saveBtn;
      btnSave.disabled = false;
      clickCount = 0;
    }, 3000);
    return;
  }

  try {
    await storage.setLimit(activePlatform, Number(limitInput.value));
    await storage.setTimeLimit(activePlatform, Number(timeInput.value));
    await storage.setEnableLimit(activePlatform, toggleLimit.checked);
    await storage.setEnableTime(activePlatform, toggleTime.checked);

    updateProgressBar();

    btnSave.textContent = i18n.t.popup.savedMsg;
    setTimeout(() => {
      if (!btnSave.disabled) btnSave.textContent = i18n.t.popup.saveBtn;
    }, 1500);
  } catch (error) {
    if (error instanceof Error && error.message === 'OPERATION_DENIED_BLOCKED') {
      btnSave.textContent = i18n.t.popup.lockedBtn;
      btnSave.classList.add('warning');

      await loadPlatformData();

      setTimeout(() => {
        if (!btnSave.disabled) {
          btnSave.textContent = i18n.t.popup.saveBtn;
          btnSave.classList.remove('warning');
        }
      }, 2000);
    } else {
      console.error('[Limitra] Error saving settings:', error);
    }
  }
};

btnSettings.onclick = () => {
  popupContext.openOptionsPage().catch(console.error);
};

themeToggleBtn.onclick = async () => {
  const current = await storage.getTheme();
  const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const next =
    current === 'auto' ? (isSystemDark ? 'light' : 'dark') : current === 'dark' ? 'light' : 'dark';
  await storage.setTheme(next);
  applyTheme(next);
};

storage.onChange((changes) => {
  if (!activePlatform) return;

  let needsUpdate = false;
  let checkLock = false;

  if (changes[`limitra_${activePlatform}_count`]) {
    currentConsumedCount = Number(changes[`limitra_${activePlatform}_count`].newValue) || 0;
    needsUpdate = true;
    checkLock = true;
  }
  if (changes['limitra_theme']) {
    applyTheme(changes['limitra_theme'].newValue as string);
  }
  if (changes['limitra_language']) {
    updateUITexts();
  }

  if (needsUpdate) updateProgressBar();

  if (checkLock) {
    storage
      .isCurrentlyBlocked(activePlatform)
      .then((isBlocked) => syncUIState(isBlocked, currentConsumedCount, currentConsumedTimeMs))
      .catch(console.error);
  }
});

[toggleLimit, toggleTime].forEach((toggle) => {
  toggle.addEventListener('change', async () => {
    if (!activePlatform) return;

    const isBlocked = await storage.isCurrentlyBlocked(activePlatform);
    const count = await storage.getCount(activePlatform);

    const timeSpentMs = storage.analyticsService
      ? await storage.analyticsService.getTodayUsage(activePlatform)
      : await storage.getTimeSpent(activePlatform);

    const hasConsumed = count > 0 || Math.floor(timeSpentMs / (60 * 1000)) > 0;

    if (isBlocked || hasConsumed) {
      toggleLimit.disabled = true;
      toggleTime.disabled = true;
      limitInput.disabled = true;
      timeInput.disabled = true;

      toggleLimit.checked = await storage.getEnableLimit(activePlatform);
      toggleTime.checked = await storage.getEnableTime(activePlatform);
      return;
    }

    limitInput.disabled = !toggleLimit.checked;
    timeInput.disabled = !toggleTime.checked;
    updateProgressBar();
  });
});

const systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
void popupContext.setActionIcon(systemThemeQuery.matches);
systemThemeQuery.addEventListener('change', (event) => {
  void popupContext.setActionIcon(event.matches);
});

void init();
