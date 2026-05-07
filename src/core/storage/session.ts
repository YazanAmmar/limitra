import { StorageDriver } from './driver';
import { StatsStorage } from './stats';
import { PlatformId } from '../../types';
import { DEFAULT_GLOBAL_SETTINGS } from './settings';
import { AnalyticsRepository } from '../interfaces/analytics-repository';
import { AnalyticsRecord } from '../analytics/types';
import { generateUUID } from '../utils/uuid';

const LAST_RESET_KEY = 'limitra_last_reset';
const NEXT_RESET_KEY = 'limitra_next_reset';

export class SessionStorage {
  private activeSessions: Map<
    PlatformId,
    { id: string; startTime: number; interval?: ReturnType<typeof setInterval> }
  > = new Map();
  private analyticsRepo?: AnalyticsRepository;

  constructor(
    private driver: StorageDriver,
    private stats: StatsStorage,
  ) {}

  public setAnalyticsRepository(repo: AnalyticsRepository): void {
    this.analyticsRepo = repo;
  }

  private async getDurationMs(): Promise<number> {
    const mins =
      (await this.driver.get<number>('limitra_block_duration')) ??
      DEFAULT_GLOBAL_SETTINGS.blockDuration;
    return mins * 60 * 1000;
  }

  async ensureSession(platforms: PlatformId[]): Promise<boolean> {
    const lastReset = await this.driver.get<number>(LAST_RESET_KEY);
    let nextReset = await this.driver.get<number>(NEXT_RESET_KEY);
    const now = Date.now();

    if (!nextReset && lastReset) {
      const intervalMs = await this.getDurationMs();
      nextReset = lastReset + intervalMs;
      await this.driver.set(NEXT_RESET_KEY, nextReset);
    }

    if (!lastReset || !nextReset || now >= nextReset) {
      for (const platform of platforms) {
        await this.stats.resetCount(platform);
        await this.stats.setTimeSpent(platform, 0);
      }

      const intervalMs = await this.getDurationMs();
      await this.driver.set<number>(LAST_RESET_KEY, now);
      await this.driver.set<number>(NEXT_RESET_KEY, now + intervalMs);

      return true;
    }
    return false;
  }

  async startSession(platform: PlatformId): Promise<void> {
    const now = Date.now();
    await this.driver.set<number>(`limitra_${platform}_last_active`, now);

    if (this.analyticsRepo) {
      const sessionId = generateUUID();
      this.activeSessions.set(platform, { id: sessionId, startTime: now });

      const record: AnalyticsRecord = {
        id: sessionId,
        platformId: platform,
        startTime: now,
        endTime: now,
        durationMs: 0,
      };
      await this.analyticsRepo.saveRecord(record).catch(() => {});

      const interval = setInterval(async () => {
        const session = this.activeSessions.get(platform);
        if (session && this.analyticsRepo) {
          const currentTime = Date.now();
          await this.analyticsRepo
            .saveRecord({
              id: session.id,
              platformId: platform,
              startTime: session.startTime,
              endTime: currentTime,
              durationMs: currentTime - session.startTime,
            })
            .catch(() => {});
        }
      }, 60000);

      this.activeSessions.get(platform)!.interval = interval;
    }
  }

  async endSession(platform: PlatformId): Promise<number> {
    const key = `limitra_${platform}_last_active`;
    const last = await this.driver.get<number>(key);

    const activeSession = this.activeSessions.get(platform);
    if (activeSession) {
      if (activeSession.interval) clearInterval(activeSession.interval);

      if (this.analyticsRepo && last && last !== 0) {
        const currentTime = Date.now();
        await this.analyticsRepo
          .saveRecord({
            id: activeSession.id,
            platformId: platform,
            startTime: activeSession.startTime,
            endTime: currentTime,
            durationMs: currentTime - activeSession.startTime,
          })
          .catch(() => {});
      }
      this.activeSessions.delete(platform);
    }

    if (!last || last === 0) return 0;

    const delta = Date.now() - last;
    await this.stats.addTime(platform, delta);
    await this.driver.set<number>(key, 0);
    return delta;
  }

  async getNextResetTime(): Promise<number> {
    const nextReset = await this.driver.get<number>(NEXT_RESET_KEY);
    if (nextReset) return nextReset;

    const lastReset = (await this.driver.get<number>(LAST_RESET_KEY)) || Date.now();
    const intervalMs = await this.getDurationMs();
    return lastReset + intervalMs;
  }
}
