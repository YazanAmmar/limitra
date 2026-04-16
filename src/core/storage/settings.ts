import { StorageDriver } from './driver';

const LIMIT_KEY = 'limitra_limit';
const TIME_LIMIT_KEY = 'limitra_time_limit';
const TONE_KEY = 'limitra_quote_tone';
const LANG_KEY = 'limitra_language';
const THEME_KEY = 'limitra_theme';
const TRACKING_MODE_KEY = 'limitra_tracking_mode';
const ENABLE_LIMIT_KEY = 'limitra_enable_limit';
const ENABLE_TIME_KEY = 'limitra_enable_time';

export class SettingsStorage {
  constructor(private driver: StorageDriver) {}

  async getLimit(): Promise<number> {
    return (await this.driver.get<number>(LIMIT_KEY)) ?? 0;
  }
  async setLimit(limit: number): Promise<void> {
    await this.driver.set<number>(LIMIT_KEY, limit);
  }

  async getTimeLimit(): Promise<number> {
    return (await this.driver.get<number>(TIME_LIMIT_KEY)) ?? 0;
  }
  async setTimeLimit(minutes: number): Promise<void> {
    await this.driver.set<number>(TIME_LIMIT_KEY, minutes);
  }

  async getQuoteTone(): Promise<string> {
    return (await this.driver.get<string>(TONE_KEY)) ?? 'random';
  }
  async setQuoteTone(tone: string): Promise<void> {
    await this.driver.set<string>(TONE_KEY, tone);
  }

  async getLanguage(): Promise<string | null> {
    return await this.driver.get<string>(LANG_KEY);
  }
  async setLanguage(lang: string): Promise<void> {
    await this.driver.set<string>(LANG_KEY, lang);
  }

  async getTheme(): Promise<string> {
    return (await this.driver.get<string>(THEME_KEY)) ?? 'auto';
  }
  async setTheme(theme: string): Promise<void> {
    await this.driver.set<string>(THEME_KEY, theme);
  }

  async getTrackingMode(): Promise<string> {
    return (await this.driver.get<string>(TRACKING_MODE_KEY)) ?? 'strict';
  }
  async setTrackingMode(mode: string): Promise<void> {
    await this.driver.set<string>(TRACKING_MODE_KEY, mode);
  }

  async getEnableLimit(): Promise<boolean> {
    return (await this.driver.get<boolean>(ENABLE_LIMIT_KEY)) ?? true;
  }
  async setEnableLimit(enabled: boolean): Promise<void> {
    await this.driver.set<boolean>(ENABLE_LIMIT_KEY, enabled);
  }

  async getEnableTime(): Promise<boolean> {
    return (await this.driver.get<boolean>(ENABLE_TIME_KEY)) ?? true;
  }
  async setEnableTime(enabled: boolean): Promise<void> {
    await this.driver.set<boolean>(ENABLE_TIME_KEY, enabled);
  }
}
