import { PlatformId } from '../../types';
import { StorageDriver } from '../storage/driver';
import { AnalyticsService } from './service';

export class UsageRuntimeService {
  private historicalCache: Map<PlatformId, number> = new Map();
  private activeSessionIdCache: Map<PlatformId, string | undefined> = new Map();

  constructor(
    private driver: StorageDriver,
    private analytics: AnalyticsService,
  ) {}

  public async init(platform: PlatformId): Promise<void> {
    await this.refreshHistoricalCache(platform);
  }

  public async refreshHistoricalCache(platform: PlatformId): Promise<void> {
    const sharedKey = `limitra_${platform}_shared_session`;
    const liveSession = await this.driver.get<{ id: string }>(sharedKey);
    const activeId = liveSession ? liveSession.id : undefined;

    this.activeSessionIdCache.set(platform, activeId);
    const ms = await this.analytics.getTodayUsage(platform, activeId);
    this.historicalCache.set(platform, ms);
  }

  public async getExactTimeSpent(platform: PlatformId): Promise<number> {
    if (!this.historicalCache.has(platform)) {
      await this.refreshHistoricalCache(platform);
    }

    const historicalMs = this.historicalCache.get(platform) || 0;

    const sharedKey = `limitra_${platform}_shared_session`;
    const liveSession = await this.driver.get<{
      id: string;
      accumulatedMs: number;
      lastUpdated: number;
    }>(sharedKey);

    let liveMs = 0;
    if (liveSession) {
      if (liveSession.id !== this.activeSessionIdCache.get(platform)) {
        await this.refreshHistoricalCache(platform);
        return this.getExactTimeSpent(platform);
      }

      liveMs = liveSession.accumulatedMs;
      const lastActive = await this.driver.get<number>(`limitra_${platform}_last_active`);

      if (lastActive && lastActive > liveSession.lastUpdated) {
        liveMs += lastActive - liveSession.lastUpdated;
      }
    }

    return historicalMs + liveMs;
  }
}
