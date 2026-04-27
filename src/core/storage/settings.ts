import { StorageDriver } from './driver';
import { PlatformId } from '../../types';

export const DEFAULT_GLOBAL_SETTINGS = {
  language: 'en',
  theme: 'auto',
  quoteTone: 'random',
  trackingMode: 'strict',
};

export class SettingsStorage {
  constructor(private driver: StorageDriver) {}

  async resetGlobalSettings(): Promise<void> {
    await this.setLanguage(DEFAULT_GLOBAL_SETTINGS.language);
    await this.setTheme(DEFAULT_GLOBAL_SETTINGS.theme);
    await this.setQuoteTone(DEFAULT_GLOBAL_SETTINGS.quoteTone);
    await this.setTrackingMode(DEFAULT_GLOBAL_SETTINGS.trackingMode);
  }

  // General settings
  async getQuoteTone(): Promise<string> {
    return (await this.driver.get<string>('limitra_quote_tone')) ?? 'random';
  }
  async setQuoteTone(tone: string): Promise<void> {
    await this.driver.set('limitra_quote_tone', tone);
  }

  async getLanguage(): Promise<string> {
    return (await this.driver.get<string>('limitra_language')) ?? 'en';
  }
  async setLanguage(lang: string): Promise<void> {
    await this.driver.set('limitra_language', lang);
  }

  async getTheme(): Promise<string> {
    return (await this.driver.get<string>('limitra_theme')) ?? 'auto';
  }
  async setTheme(theme: string): Promise<void> {
    await this.driver.set('limitra_theme', theme);
  }

  async getTrackingMode(): Promise<string> {
    return (await this.driver.get<string>('limitra_tracking_mode')) ?? 'strict';
  }
  async setTrackingMode(mode: string): Promise<void> {
    await this.driver.set('limitra_tracking_mode', mode);
  }

  // Platform-specific settings
  async getLimit(platform: PlatformId): Promise<number> {
    return (await this.driver.get<number>(`limitra_${platform}_limit`)) ?? 0;
  }
  async setLimit(platform: PlatformId, limit: number): Promise<void> {
    await this.driver.set(`limitra_${platform}_limit`, limit);
  }

  async getTimeLimit(platform: PlatformId): Promise<number> {
    return (await this.driver.get<number>(`limitra_${platform}_time_limit`)) ?? 0;
  }
  async setTimeLimit(platform: PlatformId, minutes: number): Promise<void> {
    await this.driver.set(`limitra_${platform}_time_limit`, minutes);
  }

  async getEnableLimit(platform: PlatformId): Promise<boolean> {
    const val = await this.driver.get<boolean>(`limitra_${platform}_enable_limit`);
    return val ?? true;
  }
  async setEnableLimit(platform: PlatformId, enabled: boolean): Promise<void> {
    await this.driver.set(`limitra_${platform}_enable_limit`, enabled);
  }

  async getEnableTime(platform: PlatformId): Promise<boolean> {
    const val = await this.driver.get<boolean>(`limitra_${platform}_enable_time`);
    return val ?? true;
  }
  async setEnableTime(platform: PlatformId, enabled: boolean): Promise<void> {
    await this.driver.set(`limitra_${platform}_enable_time`, enabled);
  }
}
