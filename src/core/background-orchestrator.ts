import { PlatformId, PLATFORMS_CONFIG, AppAction, ExtensionMessage } from '../types';
import { AlarmManager } from './interfaces/alarm-manager';
import { TabManager } from './interfaces/tab-manager';
import { MessageBus } from './interfaces/message-bus';
import { StorageFacade } from './storage/index';
import { StorageChange } from './storage/driver';

export class BackgroundOrchestrator {
  constructor(
    private alarmManager: AlarmManager,
    private tabManager: TabManager,
    private messageBus: MessageBus,
    private storage: StorageFacade,
  ) {}

  public init() {
    this.listenToMessages();
    this.listenToAlarms();
    this.listenToStorage();
  }

  public async checkTimeLimitForPlatform(platform: PlatformId) {
    const alarmName = `limitra_block_alarm_${platform}`;
    const config = PLATFORMS_CONFIG[platform];
    if (!config) return;

    const isTimeEnabled = await this.storage.getEnableTime(platform);
    if (!isTimeEnabled) {
      await this.alarmManager.clear(alarmName);
      return;
    }

    const timeLimitMins = await this.storage.getTimeLimit(platform);
    if (timeLimitMins <= 0) {
      await this.alarmManager.clear(alarmName);
      return;
    }

    const timeSpentMs = await this.storage.getTimeSpent(platform);
    const limitMs = timeLimitMins * 60 * 1000;

    if (timeSpentMs >= limitMs) {
      const reallyBlocked = await this.storage.isCurrentlyBlocked(platform);
      if (reallyBlocked) {
        const message: ExtensionMessage = { action: AppAction.BLOCK_NOW, platform };
        await this.tabManager.sendMessageToPattern(config.urlPatterns, message);
      }
    } else {
      const timeRemainingMs = limitMs - timeSpentMs;
      let delayInMinutes = timeRemainingMs / 60000;
      delayInMinutes = Number(Math.max(0.1, delayInMinutes).toFixed(2));
      this.alarmManager.create(alarmName, delayInMinutes);
    }
  }

  public async checkAllTimeLimits() {
    const platforms = Object.keys(PLATFORMS_CONFIG) as PlatformId[];
    for (const platform of platforms) {
      await this.checkTimeLimitForPlatform(platform);
    }
  }

  private listenToMessages() {
    this.messageBus.onMessage((message, context) => {
      if (message.action === AppAction.TAB_ACTIVE && context.isTab) {
        void this.checkAllTimeLimits();
      } else if (message.action === AppAction.TAB_HIDDEN && context.isTab) {
        const platforms = Object.keys(PLATFORMS_CONFIG) as PlatformId[];
        platforms.forEach(async (platform) => {
          const hasTabs = await this.tabManager.hasActiveTabs(
            PLATFORMS_CONFIG[platform].urlPatterns,
          );
          if (!hasTabs) {
            await this.alarmManager.clear(`limitra_block_alarm_${platform}`);
          }
        });
      }
    });
  }

  private listenToAlarms() {
    this.alarmManager.onAlarm((name) => {
      if (name.startsWith('limitra_block_alarm_')) {
        const platform = name.replace('limitra_block_alarm_', '') as PlatformId;
        void this.checkTimeLimitForPlatform(platform);
      }
    });
  }

  private listenToStorage() {
    this.storage.onChange((changes: Record<string, StorageChange>) => {
      if (changes['limitra_last_reset']) {
        void this.checkAllTimeLimits();
        return;
      }

      const platforms = Object.keys(PLATFORMS_CONFIG) as PlatformId[];
      for (const platform of platforms) {
        if (
          changes[`limitra_${platform}_time_limit`] ||
          changes[`limitra_${platform}_enable_time`]
        ) {
          void this.checkTimeLimitForPlatform(platform);
        }
      }
    });
  }
}
