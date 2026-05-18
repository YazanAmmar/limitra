import { StorageDriver, StorageChangeListener } from './driver';
import { SettingsStorage } from './settings';
import { StatsStorage } from './stats';
import { SessionStorage } from './session';
import { SecurityStorage } from './security';
import { PlatformId, PLATFORMS_CONFIG } from '../../types';
import { AnalyticsRepository } from '../interfaces/analytics-repository';
import { AnalyticsService } from '../analytics/service';
import { SubscriptionService } from '../subscription/service';

export class StorageFacade {
  public settings: SettingsStorage;
  public stats: StatsStorage;
  public session: SessionStorage;
  public security: SecurityStorage;
  public analyticsService?: AnalyticsService;
  public subscriptionService: SubscriptionService;

  constructor(public driver: StorageDriver) {
    this.settings = new SettingsStorage(this.driver);
    this.stats = new StatsStorage(this.driver);
    this.session = new SessionStorage(this.driver, this.stats);
    this.security = new SecurityStorage(this.driver, this.stats);
    this.subscriptionService = new SubscriptionService();
  }

  /**
   * Centralized Guard: Checks if the user has exceeded their video or time limits for a specific platform.
   * Also detects if the user has tampered with the storage.
   */
  public async isCurrentlyBlocked(platform: PlatformId): Promise<boolean> {
    const bypassed = await this.security.detectBypass(platform);
    if (bypassed) return true;

    const isLimitEnabled = await this.settings.getEnableLimit(platform);
    const isTimeEnabled = await this.settings.getEnableTime(platform);

    let limitReached = false;
    let hasLimitRule = false;
    if (isLimitEnabled) {
      const limit = await this.settings.getLimit(platform);
      if (limit > 0) {
        hasLimitRule = true;
        const count = await this.stats.getCount(platform);
        limitReached = count >= limit;
      }
    }

    let timeReached = false;
    let hasTimeRule = false;
    if (isTimeEnabled) {
      const timeLimitMins = await this.settings.getTimeLimit(platform);
      if (timeLimitMins > 0) {
        hasTimeRule = true;
        const timeSpentMs = await this.stats.getTimeSpent(platform);
        timeReached = timeSpentMs >= timeLimitMins * 60 * 1000;
      }
    }

    if (!hasLimitRule && !hasTimeRule) return false;
    if (hasLimitRule && !hasTimeRule) return limitReached;
    if (!hasLimitRule && hasTimeRule) return timeReached;

    // Both rules are active, check the user's preference
    const condition = await this.settings.getBlockCondition();
    if (condition === 'and') {
      return limitReached && timeReached;
    } else {
      return limitReached || timeReached;
    }
  }

  public async isAnyPlatformBlocked(): Promise<boolean> {
    const platforms = Object.keys(PLATFORMS_CONFIG) as PlatformId[];
    for (const p of platforms) {
      if (await this.isCurrentlyBlocked(p)) return true;
    }
    return false;
  }

  public onChange(listener: StorageChangeListener) {
    this.driver.onChange(listener);
  }

  public removeListener(listener: StorageChangeListener) {
    this.driver.removeListener(listener);
  }

  async resetGlobalSettings() {
    return this.settings.resetGlobalSettings();
  }

  // Custom settings
  async getLimit(platform: PlatformId) {
    return this.settings.getLimit(platform);
  }
  async setLimit(platform: PlatformId, limit: number, overrideGuard: boolean = false) {
    if (!overrideGuard && (await this.isCurrentlyBlocked(platform))) {
      throw new Error('OPERATION_DENIED_BLOCKED');
    }
    return this.settings.setLimit(platform, limit);
  }

  async getTimeLimit(platform: PlatformId) {
    return this.settings.getTimeLimit(platform);
  }
  async setTimeLimit(platform: PlatformId, minutes: number, overrideGuard: boolean = false) {
    if (!overrideGuard && (await this.isCurrentlyBlocked(platform))) {
      throw new Error('OPERATION_DENIED_BLOCKED');
    }
    return this.settings.setTimeLimit(platform, minutes);
  }

  async getEnableLimit(platform: PlatformId) {
    return this.settings.getEnableLimit(platform);
  }
  async setEnableLimit(platform: PlatformId, enabled: boolean, overrideGuard: boolean = false) {
    if (!overrideGuard && (await this.isCurrentlyBlocked(platform))) {
      throw new Error('OPERATION_DENIED_BLOCKED');
    }
    return this.settings.setEnableLimit(platform, enabled);
  }

  async getEnableTime(platform: PlatformId) {
    return this.settings.getEnableTime(platform);
  }
  async setEnableTime(platform: PlatformId, enabled: boolean, overrideGuard: boolean = false) {
    if (!overrideGuard && (await this.isCurrentlyBlocked(platform))) {
      throw new Error('OPERATION_DENIED_BLOCKED');
    }
    return this.settings.setEnableTime(platform, enabled);
  }

  // General Settings
  async getQuoteTone() {
    return this.settings.getQuoteTone();
  }
  async setQuoteTone(tone: string) {
    return this.settings.setQuoteTone(tone);
  }

  async getLanguage() {
    return this.settings.getLanguage();
  }
  async setLanguage(lang: string) {
    return this.settings.setLanguage(lang);
  }

  async getTheme() {
    return this.settings.getTheme();
  }
  async setTheme(theme: string) {
    return this.settings.setTheme(theme);
  }

  async getTrackingMode() {
    return this.settings.getTrackingMode();
  }
  async setTrackingMode(mode: string) {
    return this.settings.setTrackingMode(mode);
  }

  async getBlockDuration() {
    return this.settings.getBlockDuration();
  }

  async setBlockDuration(minutes: number) {
    await this.settings.setBlockDuration(minutes);

    const isAnyBlocked = await this.isAnyPlatformBlocked();
    if (!isAnyBlocked) {
      const lastReset = (await this.driver.get<number>('limitra_last_reset')) || Date.now();
      const newNextReset = lastReset + minutes * 60 * 1000;
      await this.driver.set('limitra_next_reset', newNextReset);
    }
  }

  async getBlockCondition() {
    return this.settings.getBlockCondition();
  }
  async setBlockCondition(condition: string) {
    return this.settings.setBlockCondition(condition);
  }

  // Analytics
  async getCount(platform: PlatformId) {
    return this.stats.getCount(platform);
  }
  async setCount(platform: PlatformId, count: number) {
    return this.stats.setCount(platform, count);
  }
  async incrementCount(platform: PlatformId) {
    return this.stats.incrementCount(platform);
  }
  async resetCount(platform: PlatformId) {
    return this.stats.resetCount(platform);
  }
  async getTimeSpent(platform: PlatformId) {
    return this.stats.getTimeSpent(platform);
  }
  async setTimeSpent(platform: PlatformId, ms: number) {
    return this.stats.setTimeSpent(platform, ms);
  }
  async addTime(platform: PlatformId, ms: number) {
    return this.stats.addTime(platform, ms);
  }

  // Analytics & Dependencies
  public setAnalyticsRepository(repo: AnalyticsRepository): void {
    this.session.setAnalyticsRepository(repo);
    this.analyticsService = new AnalyticsService(repo);
  }

  // Sessions
  async ensureSession(platforms: PlatformId[] = Object.keys(PLATFORMS_CONFIG) as PlatformId[]) {
    const wasReset = await this.session.ensureSession(platforms);
    if (wasReset) {
      for (const p of platforms) {
        await this.security.syncCounters(p);
      }
    }
  }
  async startSession(platform: PlatformId) {
    return this.session.startSession(platform);
  }
  async endSession(platform: PlatformId) {
    return this.session.endSession(platform);
  }
  async getNextResetTime() {
    return this.session.getNextResetTime();
  }
  async updateSessionTime(platform: PlatformId) {
    return this.session.updateSessionTime(platform);
  }

  // Security
  async detectBypass(platform: PlatformId) {
    return this.security.detectBypass(platform);
  }
}
