import { Tracker } from '../core/tracker';
import { Limiter } from '../core/limiter';
import { Messenger } from '../core/messenger';
import { SessionManager } from '../core/session';
import { showOverlay, initOverlayListeners } from '../ui/overlay/controller';
import { storage } from '../core/storage/index';
import { PlatformAdapter } from '../types';
// import { GenericAdapter } from './platforms/generic/index';

export class AppOrchestrator {
  private isBlocked = false;
  private activeAdapter: PlatformAdapter;
  private sessionManager!: SessionManager;

  constructor(adapter: PlatformAdapter) {
    this.activeAdapter = adapter;
  }

  public async start() {
    initOverlayListeners();

    const safeBlock = async (reason: string = 'time') => {
      if (!this.isBlocked) {
        this.isBlocked = true;
        if (this.sessionManager) {
          await this.sessionManager.blockSession();
        }
        this.activeAdapter.executePunishment();
        await showOverlay(reason);
      }
    };

    const messenger = new Messenger(() => {
      void safeBlock('time');
    });
    messenger.init();

    this.sessionManager = new SessionManager(messenger, this.activeAdapter);
    await this.sessionManager.init();

    let limit = await storage.getLimit();
    const initialCount = await storage.getCount();
    let isLimitEnabled = await storage.getEnableLimit();
    const timeLimitMins = await storage.getTimeLimit();
    const timeSpentMs = await storage.getTimeSpent();
    const isTimeEnabled = await storage.getEnableTime();

    const limiter = new Limiter(
      { limit: isLimitEnabled ? limit : 0 },
      {
        onWarning: (count) => console.warn('Warning at', count),
        onBlock: () => {
          if (limiter.getLimit() > 0) void safeBlock('count');
        },
      },
    );
    limiter.setInitialCount(initialCount);

    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local') {
        if (changes['limitra_limit'] || changes['limitra_enable_limit']) {
          if (changes['limitra_limit']) {
            limit = Number(changes['limitra_limit'].newValue) || 0;
          }
          if (changes['limitra_enable_limit']) {
            isLimitEnabled = Boolean(changes['limitra_enable_limit'].newValue);
          }

          limiter.setLimit(isLimitEnabled ? limit : 0);
        }

        if (changes['limitra_count']) {
          const newVal = Number(changes['limitra_count'].newValue) || 0;
          limiter.setInitialCount(newVal);
          if (isLimitEnabled && limit > 0 && newVal >= limit) {
            void safeBlock('count');
          }
        }
        if (changes['limitra_time_spent']) {
          const newTime = Number(changes['limitra_time_spent'].newValue) || 0;
          if (isTimeEnabled && timeLimitMins > 0 && newTime >= timeLimitMins * 60 * 1000) {
            void safeBlock('time');
          }
        }
      }
    });

    const bypassed = await storage.detectBypass();

    if (bypassed) {
      await safeBlock('bypass');
    } else if (isLimitEnabled && initialCount >= limit && limit > 0) {
      await safeBlock('count');
    } else if (isTimeEnabled && timeLimitMins > 0 && timeSpentMs >= timeLimitMins * 60 * 1000) {
      await safeBlock('time');
    }

    const tracker = new Tracker(async () => {
      if (this.isBlocked) {
        const overlay = document.getElementById('limitra-overlay');

        const isTampered =
          !overlay ||
          window.getComputedStyle(overlay).display === 'none' ||
          window.getComputedStyle(overlay).visibility === 'hidden' ||
          window.getComputedStyle(overlay).opacity === '0';

        if (isTampered) {
          console.warn(
            '[Limitra] Tampering with the blocking interface via DevTools has been detected. Reapplying enforcement...',
          );

          if (overlay) overlay.remove();

          this.activeAdapter.executePunishment();
          await showOverlay('bypass');
        }

        return;
      }

      if (isLimitEnabled && limit > 0) {
        await storage.incrementCount();
      }
    });

    tracker.setAdapter(this.activeAdapter);
    tracker.init();
  }
}
