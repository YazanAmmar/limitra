import { AnalyticsRepository } from '../../interfaces/analytics-repository';
import { AnalyticsAggregator } from '../aggregator';
import { AnalyticsFormatter, TimeTranslations } from '../formatter';

export interface TrendDayResult {
  dayName: string;
  totalMs: number;
  dateLabel: string;
}

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
  weeklyTrend?: TrendDayResult[];
}

export class DashboardReportGenerator {
  constructor(private repo: AnalyticsRepository) {}

  private async getUsageForDay(platformId: string | undefined, startOfDayMs: number) {
    const endOfDayMs = startOfDayMs + 24 * 60 * 60 * 1000 - 1;

    const queryId = platformId === 'all' ? undefined : platformId;

    const records = await this.repo.queryRecords({
      platformId: queryId,
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
    daysCount: number = 7,
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

    const weeklyTrend: TrendDayResult[] = [];
    for (let i = daysCount - 1; i >= 0; i--) {
      const dayStart = todayStart - i * 24 * 60 * 60 * 1000;
      const dayData = await this.getUsageForDay(platformId, dayStart);
      const dateObj = new Date(dayStart);

      weeklyTrend.push({
        dayName: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
        totalMs: dayData.duration,
        dateLabel: dateObj.toLocaleDateString(),
      });
    }

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
      weeklyTrend,
    };
  }
}
