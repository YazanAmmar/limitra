import { StorageDriver } from './driver';
import { StatsStorage } from './stats';

const LAST_COUNT_KEY = 'limitra_last_count';
const LAST_UPDATE_KEY = 'limitra_last_update';
const WIPE_FLAG_KEY = 'limitra_wipe_count';

/**
 * Platform adapter interface
 */
export interface SecurityPlatformAdapter {
  listenForWipes?(onWipe: () => void): void;
}

export class SecurityStorage {
  constructor(
    private driver: StorageDriver,
    private stats: StatsStorage,
    private platform?: SecurityPlatformAdapter,
  ) {
    this.platform?.listenForWipes?.(this.handleWipe.bind(this));
  }

  /**
   * Handle wipe event (platform-agnostic)
   */
  private async handleWipe(): Promise<void> {
    const current = (await this.driver.get<number>(WIPE_FLAG_KEY)) ?? 0;
    const next = current + 1;

    await this.driver.set(WIPE_FLAG_KEY, next);

    console.warn(`[Security] Storage wipe detected. Count: ${next}`);
  }

  /**
   * Core bypass detection (portable)
   */
  async detectBypass(): Promise<boolean> {
    const current = await this.stats.getCount();
    const last = await this.driver.get<number>(LAST_COUNT_KEY);
    const lastUpdate = await this.driver.get<number>(LAST_UPDATE_KEY);
    const now = Date.now();

    await this.driver.set(LAST_COUNT_KEY, current);
    await this.driver.set(LAST_UPDATE_KEY, now);

    if (last === null) return false;

    if (current < last) return true;
    if (lastUpdate && now - lastUpdate < 2000 && current === 0 && last > 0) return true;

    return false;
  }

  /**
   * Get wipe attempts
   */
  async getWipeCount(): Promise<number> {
    return (await this.driver.get<number>(WIPE_FLAG_KEY)) ?? 0;
  }

  async syncCounters(): Promise<void> {
    const current = await this.stats.getCount();
    await this.driver.set(LAST_COUNT_KEY, current);
    await this.driver.set(LAST_UPDATE_KEY, Date.now());
  }
}
