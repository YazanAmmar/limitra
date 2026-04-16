import { storage } from '../../core/storage';
import { i18n } from '../../i18n/index';
import { renderOverlay, updateOverlayTheme } from './renderer';

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes['limitra_theme']) {
    const theme = changes['limitra_theme'].newValue as string;
    const isDark =
      theme === 'dark' ||
      (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    updateOverlayTheme(isDark);
  }
});

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', async () => {
  const currentTheme = await storage.getTheme();
  if (currentTheme === 'auto') {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    updateOverlayTheme(isDark);
  }
});

let isOverlayObserverRunning = false;

function watchOverlayPersistence(): void {
  if (isOverlayObserverRunning) return;
  isOverlayObserverRunning = true;

  const observer = new MutationObserver((_mutations) => {
    if (!document.getElementById('limitra-overlay')) {
      observer.disconnect();

      isOverlayObserverRunning = false;

      void showOverlay('bypass');
    }
  });

  observer.observe(document.body, { childList: true });
}

/**
 * Renders a full-screen blocking overlay.
 *
 * This function is UI-focused and does not handle any limit or tracking logic.
 * It only depends on external services (i18n and storage) for presentation data.
 *
 * This separation allows the UI layer to be updated or replaced
 * without affecting the core business logic.
 */
export async function showOverlay(reasonKey: string = 'time'): Promise<void> {
  if (document.getElementById('limitra-overlay')) return;
  await i18n.init();

  const toneKey = await storage.getQuoteTone();
  const quoteText = i18n.getRandomQuote(toneKey);

  const reasonText =
    reasonKey === 'count'
      ? i18n.t.popup.reason_count
      : reasonKey === 'bypass'
        ? i18n.t.popup.reason_bypass
        : i18n.t.popup.reason_time;

  const badgeText = i18n.t.overlay.badgeBlocked;
  const unlocksInText = i18n.t.overlay.unlocksIn;
  const unlockingText = i18n.t.overlay.unlocking;
  const clickToCopyText = i18n.t.overlay.clickToCopy;
  const copiedText = i18n.t.overlay.copiedText;
  const direction = i18n.language === 'ar' ? 'rtl' : 'ltr';

  const savedTheme = await storage.getTheme();
  const isDark =
    savedTheme === 'dark' ||
    (savedTheme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const nextResetTime = await storage.getNextResetTime();

  renderOverlay({
    badgeText,
    quoteText,
    reasonText,
    isDark,
    direction,
    nextResetTime,
    unlocksInText,
    unlockingText,
    clickToCopyText,
    copiedText,
  });

  watchOverlayPersistence();
}
