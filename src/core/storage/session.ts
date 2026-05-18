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
    {
      id: string;
      absoluteStartTime: number;
      segmentStartTime: number;
      accumulatedMs: number;
      interval?: ReturnType<typeof setInterval>;
    }
  > = new Map();

  private readonly GRACE_PERIOD_MS = 15 * 60 * 1000;

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
    if (this.activeSessions.has(platform)) {
      return;
    }

    const now = Date.now();
    await this.driver.set<number>(`limitra_${platform}_last_active`, now);

    if (this.analyticsRepo) {
      const pausedKey = `limitra_${platform}_paused_session`;
      const paused = await this.driver.get<{
        id: string;
        startTime: number;
        endTime: number;
        durationMs: number;
      }>(pausedKey);

      let sessionId: string;
      let absoluteStartTime: number;
      let accumulatedMs: number;

      if (paused && now - paused.endTime <= this.GRACE_PERIOD_MS) {
        sessionId = paused.id;
        absoluteStartTime = paused.startTime;
        accumulatedMs = paused.durationMs;
        console.info(`[Limitra Analytics] Resuming session for ${platform} across tabs`);
        await this.driver.set(pausedKey, null);
      } else {
        sessionId = generateUUID();
        absoluteStartTime = now;
        accumulatedMs = 0;
        await this.driver.set(pausedKey, null);
      }

      this.activeSessions.set(platform, {
        id: sessionId,
        absoluteStartTime,
        segmentStartTime: now,
        accumulatedMs,
      });

      const record: AnalyticsRecord = {
        id: sessionId,
        platformId: platform,
        startTime: absoluteStartTime,
        endTime: now,
        durationMs: accumulatedMs,
        type: 'SESSION',
      };
      await this.analyticsRepo.saveRecord(record).catch(() => {});

      const interval = setInterval(async () => {
        const session = this.activeSessions.get(platform);
        if (session && this.analyticsRepo) {
          const currentTime = Date.now();
          const currentSegment = currentTime - session.segmentStartTime;
          const totalDuration = session.accumulatedMs + currentSegment;

          await this.analyticsRepo
            .saveRecord({
              id: session.id,
              platformId: platform,
              startTime: session.absoluteStartTime,
              endTime: currentTime,
              durationMs: totalDuration,
              type: 'SESSION',
            })
            .catch(() => {});
        }
      }, 30000);

      this.activeSessions.get(platform)!.interval = interval;
    }
  }

  async endSession(platform: PlatformId): Promise<number> {
    const key = `limitra_${platform}_last_active`;
    const last = await this.driver.get<number>(key);
    const activeSession = this.activeSessions.get(platform);

    if (activeSession) {
      if (activeSession.interval) clearInterval(activeSession.interval);

      if (this.analyticsRepo) {
        const currentTime = Date.now();
        const currentSegment = currentTime - activeSession.segmentStartTime;
        const totalDuration = activeSession.accumulatedMs + currentSegment;

        await this.analyticsRepo
          .saveRecord({
            id: activeSession.id,
            platformId: platform,
            startTime: activeSession.absoluteStartTime,
            endTime: currentTime,
            durationMs: totalDuration,
            type: 'SESSION',
          })
          .catch(() => {});

        await this.driver.set(`limitra_${platform}_paused_session`, {
          id: activeSession.id,
          startTime: activeSession.absoluteStartTime,
          endTime: currentTime,
          durationMs: totalDuration,
        });
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

  async updateSessionTime(platform: PlatformId): Promise<void> {
    const key = `limitra_${platform}_last_active`;
    const last = await this.driver.get<number>(key);
    if (!last || last === 0) return;

    const now = Date.now();
    const delta = now - last;

    await this.stats.addTime(platform, delta);
    await this.driver.set<number>(key, now);
  }
}
