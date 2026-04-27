import { storage } from '../../core/storage';
import { i18n } from '../../i18n/index';
import { PlatformId } from '../../types';
import { initCustomSelects } from '../components/custom-select';

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

let activePlatform: PlatformId | null = null;

let currentConsumedCount = 0;
let currentConsumedTimeMs = 0;
let clickCount = 0;
let spamResetTimer: number | null = null;

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

  const ytOption = platformSelector.querySelector('option[value="youtube_shorts"]');
  if (ytOption) ytOption.textContent = t.popup.youtubeShorts;

  const placeholderOption = platformSelector.querySelector('option[value=""]');
  if (placeholderOption) placeholderOption.textContent = t.popup.selectPlatform;

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
  } else {
    usageSection.classList.remove('hidden');
  }

  if (isLimitEnabled) {
    containerVideos.classList.remove('hidden');

    let pCount = limit > 0 ? (currentConsumedCount / limit) * 100 : 0;
    if (pCount > 100) pCount = 100;

    setText('stats-videos', `${currentConsumedCount} / ${limit} ${t.popup.videosUnit}`);

    const fillV = document.getElementById('fill-videos') as HTMLElement;
    fillV.setAttribute('style', `--progress: ${pCount}%`);
    fillV.classList.toggle('is-complete', pCount >= 100 && limit > 0);
  } else {
    containerVideos.classList.add('hidden');
  }

  if (isTimeEnabled) {
    containerTime.classList.remove('hidden');

    let pTime = timeLimit > 0 ? (timeSpentMins / timeLimit) * 100 : 0;
    if (pTime > 100) pTime = 100;

    setText('stats-time', `${timeSpentMins} / ${timeLimit} ${t.popup.minsUnit}`);

    const fillT = document.getElementById('fill-time') as HTMLElement;
    fillT.setAttribute('style', `--progress: ${pTime}%`);
    fillT.classList.toggle('is-complete', pTime >= 100 && timeLimit > 0);
  } else {
    containerTime.classList.add('hidden');
  }
}

function lockUIForSelection() {
  limitInput.value = '';
  timeInput.value = '';
  limitInput.disabled = true;
  timeInput.disabled = true;
  toggleLimit.disabled = true;
  toggleTime.disabled = true;
  btnSave.disabled = false;
  btnSave.textContent = i18n.t.popup.selectPlatform;

  setText('stats-videos', `- / -`);
  setText('stats-time', `- / -`);

  const fillV = document.getElementById('fill-videos') as HTMLElement;
  if (fillV) fillV.setAttribute('style', `--progress: 0%`);

  const fillT = document.getElementById('fill-time') as HTMLElement;
  if (fillT) fillT.setAttribute('style', `--progress: 0%`);
}

async function loadPlatformData() {
  if (!activePlatform) return;
  const [limit, timeLimit, isLimitEnabled, isTimeEnabled, isBlocked, count, timeSpentMs] =
    await Promise.all([
      storage.getLimit(activePlatform),
      storage.getTimeLimit(activePlatform),
      storage.getEnableLimit(activePlatform),
      storage.getEnableTime(activePlatform),
      storage.isCurrentlyBlocked(activePlatform),
      storage.getCount(activePlatform),
      storage.getTimeSpent(activePlatform),
    ]);

  currentConsumedCount = count;
  currentConsumedTimeMs = timeSpentMs;

  limitInput.value = String(limit);
  timeInput.value = String(timeLimit);
  toggleLimit.checked = isLimitEnabled;
  toggleTime.checked = isTimeEnabled;

  if (isBlocked) {
    limitInput.disabled = true;
    timeInput.disabled = true;
    toggleLimit.disabled = true;
    toggleTime.disabled = true;
    btnSave.disabled = true;
    btnSave.textContent = i18n.t.popup.lockedBtn;
    btnSave.classList.add('warning');
  } else {
    limitInput.disabled = !isLimitEnabled;
    timeInput.disabled = !isTimeEnabled;
    toggleLimit.disabled = false;
    toggleTime.disabled = false;
    btnSave.disabled = false;
    btnSave.textContent = i18n.t.popup.saveBtn;
    btnSave.classList.remove('warning');
  }

  updateProgressBar();
}

async function init() {
  const savedTheme = await storage.getTheme();
  applyTheme(savedTheme);

  await i18n.init();
  updateUITexts();

  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const currentTab = tabs[0];
  const currentUrl = currentTab?.url || '';

  if (currentUrl.includes('youtube.com') && currentUrl.includes('/shorts/')) {
    activePlatform = 'youtube_shorts';
    platformSelector.value = activePlatform;
    await loadPlatformData();
  } else {
    activePlatform = null;
    platformSelector.value = '';
    lockUIForSelection();
  }

  initCustomSelects();

  platformSelector.addEventListener('change', (e) => {
    activePlatform = (e.target as HTMLSelectElement).value as PlatformId;
    void loadPlatformData();
  });

  limitInput.addEventListener('input', updateProgressBar);
  timeInput.addEventListener('input', updateProgressBar);
}

function applyTheme(theme: string) {
  const isPageDark =
    theme === 'dark' ||
    (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (isPageDark) {
    document.documentElement.classList.add('dark');
    sunIcon.classList.remove('hidden');
    moonIcon.classList.add('hidden');
  } else {
    document.documentElement.classList.remove('dark');
    sunIcon.classList.add('hidden');
    moonIcon.classList.remove('hidden');
  }
}

function updateActionIcon(isSystemDark: boolean) {
  const iconPath = isSystemDark
    ? '../../assets/manifest/32x32-dark.png'
    : '../../assets/manifest/32x32-light.png';

  if (chrome.action) {
    void chrome.action.setIcon({ path: iconPath }).catch(console.error);
  }
}

const systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
updateActionIcon(systemThemeQuery.matches);
systemThemeQuery.addEventListener('change', (event) => updateActionIcon(event.matches));

btnSave.onclick = async (e: MouseEvent) => {
  if (!activePlatform) {
    e.stopPropagation();

    const trigger = document.querySelector('.custom-brutal-trigger') as HTMLElement;
    if (trigger) {
      trigger.click();
    }
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

  const limit = Number(limitInput.value);
  const timeLimit = Number(timeInput.value);

  try {
    await storage.setLimit(activePlatform, limit);
    await storage.setTimeLimit(activePlatform, timeLimit);
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

btnSettings.onclick = () => void chrome.runtime.openOptionsPage();

themeToggleBtn.onclick = async () => {
  const current = await storage.getTheme();
  const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const next =
    current === 'auto' ? (isSystemDark ? 'light' : 'dark') : current === 'dark' ? 'light' : 'dark';
  await storage.setTheme(next);
  applyTheme(next);
};

chrome.storage.onChanged.addListener((changes) => {
  if (!activePlatform) return;

  let needsUpdate = false;
  let checkLock = false;

  if (changes[`limitra_${activePlatform}_count`]) {
    currentConsumedCount = Number(changes[`limitra_${activePlatform}_count`].newValue) || 0;
    needsUpdate = true;
    checkLock = true;
  }
  if (changes[`limitra_${activePlatform}_time_spent`]) {
    currentConsumedTimeMs = Number(changes[`limitra_${activePlatform}_time_spent`].newValue) || 0;
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
    void storage.isCurrentlyBlocked(activePlatform).then((isBlocked) => {
      if (isBlocked && !btnSave.disabled) {
        limitInput.disabled = true;
        timeInput.disabled = true;
        toggleLimit.disabled = true;
        toggleTime.disabled = true;
        btnSave.disabled = true;
        btnSave.textContent = i18n.t.popup.lockedBtn;
        btnSave.classList.add('warning');
      }
    });
  }
});

[toggleLimit, toggleTime].forEach((toggle) => {
  toggle.addEventListener('change', async () => {
    if (!activePlatform) return;

    const isBlocked = await storage.isCurrentlyBlocked(activePlatform);
    if (isBlocked) {
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

void init();
