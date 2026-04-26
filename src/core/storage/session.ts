import { StorageDriver } from './driver';
import { StatsStorage } from './stats';
import { PlatformId } from '../../types';

const LAST_RESET_KEY = 'limitra_last_reset';
const RESET_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

export class SessionStorage {
  constructor(
    private driver: StorageDriver,
    private stats: StatsStorage,
  ) {}

  async ensureSession(platforms: PlatformId[]): Promise<boolean> {
    const lastReset = await this.driver.get<number>(LAST_RESET_KEY);
    const now = Date.now();
    if (!lastReset || now - lastReset >= RESET_INTERVAL_MS) {
      for (const platform of platforms) {
        await this.stats.resetCount(platform);
        await this.stats.setTimeSpent(platform, 0);
      }
      await this.driver.set<number>(LAST_RESET_KEY, now);
      return true;
    }
    return false;
  }

  async startSession(platform: PlatformId): Promise<void> {
    await this.driver.set<number>(`limitra_${platform}_last_active`, Date.now());
  }

  async endSession(platform: PlatformId): Promise<number> {
    const key = `limitra_${platform}_last_active`;
    const last = await this.driver.get<number>(key);
    if (!last || last === 0) return 0;

    const delta = Date.now() - last;
    await this.stats.addTime(platform, delta);
    await this.driver.set<number>(key, 0);
    return delta;
  }

  async getNextResetTime(): Promise<number> {
    const lastReset = (await this.driver.get<number>(LAST_RESET_KEY)) || Date.now();
    return lastReset + RESET_INTERVAL_MS;
  }
}
