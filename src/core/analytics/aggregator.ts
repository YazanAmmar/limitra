import { AnalyticsRecord } from './types';

export class AnalyticsAggregator {
  /**
   * Calculates the total time spent in milliseconds for a set of records.
   * Pure function: input -> output
   */
  public static calculateTotalDuration(records: AnalyticsRecord[]): number {
    return records.reduce((total, record) => total + record.durationMs, 0);
  }

  /**
   * Filters records for a specific domain only.
   */
  public static filterByPlatform(
    records: AnalyticsRecord[],
    platformId: string,
  ): AnalyticsRecord[] {
    return records.filter((record) => record.platformId === platformId);
  }

  /**
   * Advanced helper for the Agent:
   * Calculates total usage per domain and returns it as an object.
   * Example output: { "youtube.com": 3000, "x.com": 1500 }
   */
  public static groupDurationByPlatform(records: AnalyticsRecord[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    for (const record of records) {
      if (!grouped[record.platformId]) {
        grouped[record.platformId] = 0;
      }
      grouped[record.platformId] += record.durationMs;
    }
    return grouped;
  }

  /**
   * Abstracting the session calculation logic to protect us in case
   * the definition of a session changes in the future
   */
  public static calculateSessionCount(records: AnalyticsRecord[]): number {
    const uniqueSessionIds = new Set(records.map((record) => record.id));
    return uniqueSessionIds.size;
  }

  public static groupRecordsByPlatform(
    records: AnalyticsRecord[],
  ): Record<string, AnalyticsRecord[]> {
    const grouped: Record<string, AnalyticsRecord[]> = {};
    for (const record of records) {
      if (!grouped[record.platformId]) {
        grouped[record.platformId] = [];
      }
      grouped[record.platformId].push(record);
    }
    return grouped;
  }
}
