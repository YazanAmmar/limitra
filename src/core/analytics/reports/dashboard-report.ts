import { AnalyticsRepository } from '../../interfaces/analytics-repository';
import { AnalyticsAggregator } from '../aggregator';
import { AnalyticsFormatter, TimeTranslations } from '../formatter';

export interface DashboardReportResult {
  raw: {
    todayMs: number;
    yesterdayMs: number;
    todaySessions: number;
  };
  formatted: {
    todayReadable: string;
    trendText: string;
    isImproving: boolean;
  };
}

export class DashboardReportGenerator {
  constructor(private repo: AnalyticsRepository) {}

  private async getUsageForDay(platformId: string, startOfDayMs: number) {
    const endOfDayMs = startOfDayMs + 24 * 60 * 60 * 1000 - 1;
    const records = await this.repo.queryRecords({
      platformId: platformId,
      fromTime: startOfDayMs,
      toTime: endOfDayMs,
    });

    return {
      duration: AnalyticsAggregator.calculateTotalDuration(records),
      sessions: AnalyticsAggregator.calculateSessionCount(records),
    };
  }

  public async generate(
    platformId: string,
    translations: TimeTranslations,
  ): Promise<DashboardReportResult> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;

    const todayData = await this.getUsageForDay(platformId, todayStart);
    const yesterdayData = await this.getUsageForDay(platformId, yesterdayStart);

    const trendPercent = AnalyticsFormatter.calculateTrendPercent(
      yesterdayData.duration,
      todayData.duration,
    );

    return {
      raw: {
        todayMs: todayData.duration,
        yesterdayMs: yesterdayData.duration,
        todaySessions: todayData.sessions,
      },
      formatted: {
        todayReadable: AnalyticsFormatter.msToReadable(todayData.duration, translations),
        trendText: AnalyticsFormatter.formatTrend(trendPercent),
        isImproving: trendPercent <= 0,
      },
    };
  }
}
