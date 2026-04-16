import { ChromeStorageDriver } from './driver';
import { SettingsStorage } from './settings';
import { StatsStorage } from './stats';
import { SessionStorage } from './session';
import { SecurityStorage } from './security';

class StorageFacade {
  public driver = new ChromeStorageDriver();
  public settings = new SettingsStorage(this.driver);
  public stats = new StatsStorage(this.driver);
  public session = new SessionStorage(this.driver, this.stats);
  public security = new SecurityStorage(this.driver, this.stats);

  // Settings
  async getLimit() {
    return this.settings.getLimit();
  }
  async setLimit(limit: number) {
    return this.settings.setLimit(limit);
  }
  async getTimeLimit() {
    return this.settings.getTimeLimit();
  }
  async setTimeLimit(minutes: number) {
    return this.settings.setTimeLimit(minutes);
  }
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
  async getEnableLimit() {
    return this.settings.getEnableLimit();
  }
  async setEnableLimit(enabled: boolean) {
    return this.settings.setEnableLimit(enabled);
  }
  async getEnableTime() {
    return this.settings.getEnableTime();
  }
  async setEnableTime(enabled: boolean) {
    return this.settings.setEnableTime(enabled);
  }

  // Analytics
  async getCount() {
    return this.stats.getCount();
  }
  async setCount(count: number) {
    return this.stats.setCount(count);
  }
  async incrementCount() {
    return this.stats.incrementCount();
  }
  async resetCount() {
    return this.stats.resetCount();
  }
  async getTimeSpent() {
    return this.stats.getTimeSpent();
  }
  async setTimeSpent(ms: number) {
    return this.stats.setTimeSpent(ms);
  }
  async addTime(ms: number) {
    return this.stats.addTime(ms);
  }

  // Sessions
  async ensureSession() {
    const wasReset = await this.session.ensureSession();
    if (wasReset) {
      await this.security.syncCounters();
    }
  }
  async startSession() {
    return this.session.startSession();
  }
  async endSession() {
    return this.session.endSession();
  }

  async getNextResetTime() {
    return this.session.getNextResetTime();
  }

  // Security
  async detectBypass() {
    return this.security.detectBypass();
  }
}

export const storage = new StorageFacade();
