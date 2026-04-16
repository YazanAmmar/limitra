import { StorageDriver } from './driver';
import { StatsStorage } from './stats';

const LAST_RESET_KEY = 'limitra_last_reset';
const LAST_ACTIVE_KEY = 'limitra_last_active';
const RESET_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

export class SessionStorage {
  constructor(
    private driver: StorageDriver,
    private stats: StatsStorage,
  ) {}

  async ensureSession(): Promise<boolean> {
    const lastReset = await this.driver.get<number>(LAST_RESET_KEY);
    const now = Date.now();
    if (!lastReset || now - lastReset >= RESET_INTERVAL_MS) {
      await this.stats.resetCount();
      await this.stats.setTimeSpent(0);
      await this.driver.set<number>(LAST_RESET_KEY, now);
      return true;
    }
    return false;
  }

  async startSession(): Promise<void> {
    await this.driver.set<number>(LAST_ACTIVE_KEY, Date.now());
  }

  async endSession(): Promise<number> {
    const last = await this.driver.get<number>(LAST_ACTIVE_KEY);

    if (!last || last === 0) return 0;

    const delta = Date.now() - last;
    await this.stats.addTime(delta);

    await this.driver.set<number>(LAST_ACTIVE_KEY, 0);

    return delta;
  }

  async getNextResetTime(): Promise<number> {
    const lastReset = (await this.driver.get<number>(LAST_RESET_KEY)) || Date.now();
    return lastReset + RESET_INTERVAL_MS;
  }
}
