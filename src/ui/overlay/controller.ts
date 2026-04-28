import { StorageFacade } from '../../core/storage/index';
import { ChromeStorageDriver } from '../../adapters/chrome/storage-driver';
import { i18n } from '../../i18n/index';
import { renderOverlay, updateOverlayTheme } from './renderer';
import { watchOverlayPersistence } from './persistence';

const storageDriver = new ChromeStorageDriver();
const storage = new StorageFacade(storageDriver);

/**
 * Main entry to show overlay
 */
export async function showOverlay(reasonKey: string = 'time'): Promise<void> {
  if (document.getElementById('limitra-overlay')) return;

  await i18n.init();

  const toneKey = await storage.getQuoteTone();
  const quoteText = i18n.getRandomQuote(toneKey);

  const reasonMap: Record<string, string> = {
    count: i18n.t.popup.reason_count,
    time: i18n.t.popup.reason_time,
    bypass: i18n.t.popup.reason_bypass,
    both: i18n.t.popup.reason_both,
  };

  const reasonText = reasonMap[reasonKey] || i18n.t.popup.reason_time;

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

  watchOverlayPersistence(() => {
    void showOverlay('bypass');
  });
}

/**
 * Setup listeners (call once)
 */
export function initOverlayListeners(): void {
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
}
