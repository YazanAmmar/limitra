import { AnalyticsRepository } from '../interfaces/analytics-repository';
import { AnalyticsAggregator } from './aggregator';

export class AnalyticsService {
  constructor(private repo: AnalyticsRepository) {}

  /**
   * Retrieves the total usage time for the current day
   * (from midnight until now).
   *
   * A specific domain can be provided, or left undefined
   * to retrieve usage across all domains.
   */
  public async getTodayUsage(platformId?: string): Promise<number> {
    const now = new Date();

    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const records = await this.repo.queryRecords({
      fromTime: startOfDay,
      platformId: platformId,
    });
    return AnalyticsAggregator.calculateTotalDuration(records);
  }

  /**
   * Builds a summarized analytics report for the Limitra Agent
   * (Context Injection).
   *
   * Retrieves records from the last X days and groups them by PlatformId.
   * This object can later be injected directly into the Agent prompt.
   */
  public async getAgentContextData(days: number = 7): Promise<Record<string, number>> {
    const fromTime = Date.now() - days * 24 * 60 * 60 * 1000;
    const records = await this.repo.queryRecords({
      fromTime: fromTime,
    });
    return AnalyticsAggregator.groupDurationByPlatform(records);
  }

  /**
   * Compares usage between two periods.
   *
   * Example:
   * "Did I spend more time on YouTube this week compared to last week?"
   */
  public async compareUsage(
    platformId: string,
    period1: { start: number; end: number },
    period2: { start: number; end: number },
  ): Promise<{
    period1Ms: number;
    period2Ms: number;
    differenceMs: number;
  }> {
    const records1 = await this.repo.queryRecords({
      platformId,
      fromTime: period1.start,
      toTime: period1.end,
    });

    const records2 = await this.repo.queryRecords({
      platformId,
      fromTime: period2.start,
      toTime: period2.end,
    });

    const period1Ms = AnalyticsAggregator.calculateTotalDuration(records1);
    const period2Ms = AnalyticsAggregator.calculateTotalDuration(records2);

    return {
      period1Ms,
      period2Ms,

      // Positive value means usage increased
      differenceMs: period1Ms - period2Ms,
    };
  }

  /**
   * Removes old analytics data to save storage space (Garbage Collection).
   * By default, records older than 7 days will be deleted.
   */
  public async performGarbageCollection(retentionDays: number = 7): Promise<void> {
    const cutoffTime = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

    await this.repo.clearRecordsOlderThan(cutoffTime);

    console.info(
      `[Limitra Analytics] Garbage collection completed. Cleared records older than ${retentionDays} days.`,
    );
  }
}
