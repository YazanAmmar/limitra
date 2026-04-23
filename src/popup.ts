import { storage } from './core/storage';
import { i18n } from './i18n/index';
import { AppAction } from './types';

const limitInput = document.getElementById('limit') as HTMLInputElement;
const timeInput = document.getElementById('timeLimit') as HTMLInputElement;
const toggleLimit = document.getElementById('toggle-limit') as HTMLInputElement;
const toggleTime = document.getElementById('toggle-time') as HTMLInputElement;
const btnSave = document.getElementById('save') as HTMLButtonElement;
const btnSettings = document.getElementById('settings-btn') as HTMLButtonElement;
const themeToggleBtn = document.getElementById('theme-toggle') as HTMLButtonElement;
const sunIcon = document.getElementById('sun-icon') as HTMLElement;
const moonIcon = document.getElementById('moon-icon') as HTMLElement;

let currentConsumedCount = 0;
let currentConsumedTimeMs = 0;
let clickCount = 0;
let spamResetTimer: number | null = null;

function updateUITexts() {
  const t = i18n.t;
  (document.getElementById('app-title') as HTMLElement).textContent = t.popup.title;
  (document.getElementById('lbl-max-videos') as HTMLElement).textContent = t.popup.maxVideos;
  (document.getElementById('lbl-time-limit') as HTMLElement).textContent = t.popup.timeLimit;

  const lblUsageVideos = document.getElementById('lbl-usage-videos');
  if (lblUsageVideos) lblUsageVideos.textContent = t.popup.videosUnit;
  const lblUsageTime = document.getElementById('lbl-usage-time');
  if (lblUsageTime) lblUsageTime.textContent = t.popup.timeTitle;

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
    usageSection.style.display = 'none';
    return;
  } else {
    usageSection.style.display = 'block';
  }

  if (isLimitEnabled) {
    containerVideos.style.display = 'block';

    let pCount = limit > 0 ? (currentConsumedCount / limit) * 100 : 0;
    if (pCount > 100) pCount = 100;

    (document.getElementById('stats-videos') as HTMLElement).textContent =
      `${currentConsumedCount} / ${limit} ${t.popup.videosUnit}`;

    const fillV = document.getElementById('fill-videos') as HTMLElement;
    fillV.style.width = `${pCount}%`;
    fillV.style.backgroundColor = pCount >= 100 && limit > 0 ? '#7c3aed' : 'var(--accent)';
  } else {
    containerVideos.style.display = 'none';
  }

  if (isTimeEnabled) {
    containerTime.style.display = 'block';

    let pTime = timeLimit > 0 ? (timeSpentMins / timeLimit) * 100 : 0;
    if (pTime > 100) pTime = 100;

    (document.getElementById('stats-time') as HTMLElement).textContent =
      `${timeSpentMins} / ${timeLimit} ${t.popup.minsUnit}`;

    const fillT = document.getElementById('fill-time') as HTMLElement;
    fillT.style.width = `${pTime}%`;
    fillT.style.backgroundColor = pTime >= 100 && timeLimit > 0 ? '#7c3aed' : 'var(--accent)';
  } else {
    containerTime.style.display = 'none';
  }
}

async function init() {
  const savedTheme = await storage.getTheme();
  applyTheme(savedTheme);
  currentConsumedCount = await storage.getCount();
  currentConsumedTimeMs = await storage.getTimeSpent();

  await i18n.init();

  const [limit, timeLimit, isLimitEnabled, isTimeEnabled] = await Promise.all([
    storage.getLimit(),
    storage.getTimeLimit(),
    storage.getEnableLimit(),
    storage.getEnableTime(),
  ]);

  limitInput.value = String(limit);
  timeInput.value = String(timeLimit);
  toggleLimit.checked = isLimitEnabled;
  toggleTime.checked = isTimeEnabled;

  limitInput.disabled = !isLimitEnabled;
  timeInput.disabled = !isTimeEnabled;

  updateUITexts();

  const siteBadge = document.getElementById('site-badge') as HTMLElement;
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];
    const currentUrl = currentTab?.url || '';

    if (currentUrl.includes('youtube.com') && currentUrl.includes('/shorts/')) {
      chrome.tabs.sendMessage(currentTab.id!, { action: AppAction.PING }, (response) => {
        if (chrome.runtime.lastError || !response || response.status !== 'ALIVE') {
          siteBadge.textContent = '○ Refresh Page';
          siteBadge.style.color = 'var(--status-warning)';
          siteBadge.style.borderColor = 'var(--status-warning)';
        } else {
          siteBadge.textContent = '● YouTube Shorts';
          siteBadge.style.color = 'var(--status-success)';
          siteBadge.style.borderColor = 'var(--status-success)';
        }
      });
    } else {
      siteBadge.textContent = '○ Unsupported Site';
      siteBadge.style.color = 'var(--text-muted)';
      siteBadge.style.borderColor = 'var(--text-muted)';
    }
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
    ? 'assets/manifest/32x32-dark.png'
    : 'assets/manifest/32x32-light.png';

  if (chrome.action) {
    void chrome.action
      .setIcon({ path: iconPath })
      .catch((err) => console.error('[Limitra] Background Icon Error:', err));
  }
}

const systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
updateActionIcon(systemThemeQuery.matches);

systemThemeQuery.addEventListener('change', (event) => {
  updateActionIcon(event.matches);
});

btnSave.onclick = async () => {
  clickCount++;
  if (spamResetTimer) clearTimeout(spamResetTimer);
  spamResetTimer = window.setTimeout(() => {
    clickCount = 0;
  }, 2000);

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

  await storage.setLimit(limit);
  await storage.setTimeLimit(timeLimit);
  await storage.setEnableLimit(toggleLimit.checked);
  await storage.setEnableTime(toggleTime.checked);

  updateProgressBar();

  btnSave.textContent = i18n.t.popup.savedMsg;
  setTimeout(() => {
    if (!btnSave.disabled) btnSave.textContent = i18n.t.popup.saveBtn;
  }, 1500);
};

btnSettings.onclick = () => {
  void chrome.runtime.openOptionsPage();
};

themeToggleBtn.onclick = async () => {
  const current = await storage.getTheme();
  const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const next =
    current === 'auto' ? (isSystemDark ? 'light' : 'dark') : current === 'dark' ? 'light' : 'dark';
  await storage.setTheme(next);
  applyTheme(next);
};

chrome.storage.onChanged.addListener((changes) => {
  let needsUpdate = false;
  if (changes['limitra_count']) {
    currentConsumedCount = Number(changes['limitra_count'].newValue) || 0;
    needsUpdate = true;
  }
  if (changes['limitra_time_spent']) {
    currentConsumedTimeMs = Number(changes['limitra_time_spent'].newValue) || 0;
    needsUpdate = true;
  }
  if (changes['limitra_theme']) {
    applyTheme(changes['limitra_theme'].newValue as string);
  }
  if (needsUpdate) updateProgressBar();
});

[toggleLimit, toggleTime].forEach((toggle) => {
  toggle.addEventListener('change', () => {
    limitInput.disabled = !toggleLimit.checked;
    timeInput.disabled = !toggleTime.checked;
    updateProgressBar();
  });
});

void init();
