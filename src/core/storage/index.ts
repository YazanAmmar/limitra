import { StorageDriver, StorageChangeListener } from './driver';
import { SettingsStorage } from './settings';
import { StatsStorage } from './stats';
import { SessionStorage } from './session';
import { SecurityStorage } from './security';
import { PlatformId } from '../../types';

export class StorageFacade {
  public settings: SettingsStorage;
  public stats: StatsStorage;
  public session: SessionStorage;
  public security: SecurityStorage;

  constructor(public driver: StorageDriver) {
    this.settings = new SettingsStorage(this.driver);
    this.stats = new StatsStorage(this.driver);
    this.session = new SessionStorage(this.driver, this.stats);
    this.security = new SecurityStorage(this.driver, this.stats);
  }

  /**
   * Centralized Guard: Checks if the user has exceeded their video or time limits for a specific platform.
   * Also detects if the user has tampered with the storage.
   */
  public async isCurrentlyBlocked(platform: PlatformId): Promise<boolean> {
    const bypassed = await this.security.detectBypass(platform);
    if (bypassed) return true;

    const isLimitEnabled = await this.settings.getEnableLimit(platform);
    if (isLimitEnabled) {
      const limit = await this.settings.getLimit(platform);
      const count = await this.stats.getCount(platform);
      if (limit > 0 && count >= limit) return true;
    }

    const isTimeEnabled = await this.settings.getEnableTime(platform);
    if (isTimeEnabled) {
      const timeLimitMins = await this.settings.getTimeLimit(platform);
      const timeSpentMs = await this.stats.getTimeSpent(platform);
      if (timeLimitMins > 0 && timeSpentMs >= timeLimitMins * 60 * 1000) return true;
    }

    return false;
  }

  public async isAnyPlatformBlocked(): Promise<boolean> {
    const platforms: PlatformId[] = ['youtube_shorts', 'youtube_watch', 'instagram', 'global'];
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

  // Sessions
  async ensureSession(
    platforms: PlatformId[] = ['youtube_shorts', 'youtube_watch', 'instagram', 'global'],
  ) {
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

  // Security
  async detectBypass(platform: PlatformId) {
    return this.security.detectBypass(platform);
  }
}
