import { Tracker } from '../core/tracker';
import { Limiter } from '../core/limiter';
import { Messenger } from '../core/messenger';
import { SessionManager } from '../core/session';
import { showOverlay, initOverlayListeners } from '../ui/overlay/controller';
import { ConnectionManager } from '../core/interfaces/connection-manager';
import { StorageFacade } from '../core/storage/index';
import { PlatformAdapter } from '../core/interfaces/platform-adapter';
import { StorageChange } from '../core/storage/driver';
import { MessageBus } from '../core/interfaces/message-bus';

export class AppOrchestrator {
  private isBlocked: boolean = false;
  private activeAdapter: PlatformAdapter;
  private messageBus: MessageBus;
  private connectionManager: ConnectionManager;
  private storage: StorageFacade;

  private sessionManager!: SessionManager;
  private messenger!: Messenger;
  private tracker!: Tracker;
  private limiter!: Limiter;
  private storageListener: ((changes: Record<string, StorageChange>) => void) | null = null;

  private currentLimit: number = 0;
  private isLimitEnabled: boolean = false;
  private timeLimitMins: number = 0;
  private isTimeEnabled: boolean = false;
  private timeSpentMs: number = 0;

  constructor(
    adapter: PlatformAdapter,
    messageBus: MessageBus,
    connectionManager: ConnectionManager,
    storage: StorageFacade,
  ) {
    this.activeAdapter = adapter;
    this.messageBus = messageBus;
    this.connectionManager = connectionManager;
    this.storage = storage;
  }

  public async start() {
    initOverlayListeners(this.storage);
    await this.initializeState();

    this.setupMessenger();
    await this.setupSessionManager();
    await this.setupLimiter();
    this.setupStorageListener();

    await this.runInitialChecks();
    this.setupTracker();
  }

  private async initializeState() {
    const pId = this.activeAdapter.id;
    this.currentLimit = await this.storage.getLimit(pId);
    this.isLimitEnabled = await this.storage.getEnableLimit(pId);
    this.timeLimitMins = await this.storage.getTimeLimit(pId);
    this.isTimeEnabled = await this.storage.getEnableTime(pId);
    this.timeSpentMs = await this.storage.getTimeSpent(pId);
  }

  private setupMessenger() {
    this.messenger = new Messenger(
      () => void this.evaluateAndEnforceBlock('time'),
      this.messageBus,
      this.activeAdapter.id,
    );
    this.messenger.init();
  }

  private async setupSessionManager() {
    this.sessionManager = new SessionManager(
      this.messenger,
      this.activeAdapter,
      this.connectionManager,
      this.storage,
    );
    await this.sessionManager.init();
  }

  private async setupLimiter() {
    const pId = this.activeAdapter.id;
    this.limiter = new Limiter(
      { limit: this.isLimitEnabled ? this.currentLimit : 0 },
      {
        onWarning: (count) => console.warn('Warning at', count),
        onBlock: () => {
          if (this.limiter.getLimit() > 0) void this.evaluateAndEnforceBlock('count');
        },
      },
    );
    const initialCount = await this.storage.getCount(pId);
    this.limiter.setInitialCount(initialCount);
  }

  private async evaluateAndEnforceBlock(reason: string = 'time') {
    if (this.isBlocked) return;
    const pId = this.activeAdapter.id;

    const reallyBlocked = await this.storage.isCurrentlyBlocked(pId);
    if (!reallyBlocked) return;

    this.isBlocked = true;
    let finalReason = reason;

    if (reason !== 'bypass') {
      const count = await this.storage.getCount(pId);
      const limitReached =
        this.isLimitEnabled && this.currentLimit > 0 && count >= this.currentLimit;
      const timeReached =
        this.isTimeEnabled &&
        this.timeLimitMins > 0 &&
        this.timeSpentMs >= this.timeLimitMins * 60 * 1000;

      if (limitReached && timeReached) {
        finalReason = 'both';
      } else if (limitReached) {
        finalReason = 'count';
      } else if (timeReached) {
        finalReason = 'time';
      }
    }

    console.warn(`[Limitra] Initiating block logic. Reason: ${finalReason}`);
    if (this.sessionManager) {
      await this.sessionManager.blockSession();
    }
    this.activeAdapter.executePunishment();
    await showOverlay(this.storage, finalReason);
  }

  private setupStorageListener() {
    const pId = this.activeAdapter.id;
    this.storageListener = (changes: Record<string, StorageChange>) => {
      if (changes[`limitra_${pId}_limit`] || changes[`limitra_${pId}_enable_limit`]) {
        if (changes[`limitra_${pId}_limit`])
          this.currentLimit = Number(changes[`limitra_${pId}_limit`].newValue) || 0;
        if (changes[`limitra_${pId}_enable_limit`])
          this.isLimitEnabled = Boolean(changes[`limitra_${pId}_enable_limit`].newValue);
        this.limiter.setLimit(this.isLimitEnabled ? this.currentLimit : 0);
      }

      if (changes[`limitra_${pId}_count`]) {
        const newVal = Number(changes[`limitra_${pId}_count`].newValue) || 0;
        this.limiter.setInitialCount(newVal);
        if (this.isLimitEnabled && this.currentLimit > 0 && newVal >= this.currentLimit) {
          void this.evaluateAndEnforceBlock('count');
        }
      }

      if (
        changes[`limitra_${pId}_time_limit`] ||
        changes[`limitra_${pId}_enable_time`] ||
        changes[`limitra_${pId}_time_spent`]
      ) {
        if (changes[`limitra_${pId}_time_limit`])
          this.timeLimitMins = Number(changes[`limitra_${pId}_time_limit`].newValue) || 0;
        if (changes[`limitra_${pId}_enable_time`])
          this.isTimeEnabled = Boolean(changes[`limitra_${pId}_enable_time`].newValue);
        if (changes[`limitra_${pId}_time_spent`])
          this.timeSpentMs = Number(changes[`limitra_${pId}_time_spent`].newValue) || 0;

        if (
          this.isTimeEnabled &&
          this.timeLimitMins > 0 &&
          this.timeSpentMs >= this.timeLimitMins * 60 * 1000
        ) {
          void this.evaluateAndEnforceBlock('time');
        }
      }
    };
    this.storage.onChange(this.storageListener);
  }

  private async runInitialChecks() {
    const pId = this.activeAdapter.id;
    const bypassed = await this.storage.detectBypass(pId);
    const count = await this.storage.getCount(pId);

    if (bypassed) {
      await this.evaluateAndEnforceBlock('bypass');
    } else if (this.isLimitEnabled && count >= this.currentLimit && this.currentLimit > 0) {
      await this.evaluateAndEnforceBlock('count');
    } else if (
      this.isTimeEnabled &&
      this.timeLimitMins > 0 &&
      this.timeSpentMs >= this.timeLimitMins * 60 * 1000
    ) {
      await this.evaluateAndEnforceBlock('time');
    }
  }

  private setupTracker() {
    const pId = this.activeAdapter.id;
    this.tracker = new Tracker(async () => {
      if (this.isBlocked) {
        const overlay = document.getElementById('limitra-overlay');
        const isTampered =
          !overlay ||
          window.getComputedStyle(overlay).display === 'none' ||
          window.getComputedStyle(overlay).visibility === 'hidden' ||
          window.getComputedStyle(overlay).opacity === '0';
        if (isTampered) {
          console.warn(
            '[Limitra] Tampering or SPA page refresh detected. Reapplying enforcement...',
          );
          if (overlay) overlay.remove();
          this.activeAdapter.executePunishment();
          await showOverlay(this.storage, 'bypass');
        }
        return;
      }
      if (this.isLimitEnabled && this.currentLimit > 0) {
        await this.storage.incrementCount(pId);
      }
    });
    this.tracker.setAdapter(this.activeAdapter);
    this.tracker.init();
  }

  public destroy() {
    if (this.storageListener) {
      this.storage.removeListener(this.storageListener);
      this.storageListener = null;
    }
    if (this.messenger) this.messenger.destroy();
    if (this.activeAdapter) this.activeAdapter.disconnect();
    if (this.sessionManager) this.sessionManager.destroy();
    if (this.tracker) this.tracker.destroy();

    const overlay = document.getElementById('limitra-overlay');
    if (overlay) overlay.remove();
    document.body.classList.remove('limitra-global-punishment');
  }
}
