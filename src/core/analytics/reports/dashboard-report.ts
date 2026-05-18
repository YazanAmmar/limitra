import { AnalyticsRepository } from '../../interfaces/analytics-repository';
import { AnalyticsAggregator } from '../aggregator';
import { AnalyticsFormatter, TimeTranslations } from '../formatter';

export interface TrendDayResult {
  dayName: string;
  totalMs: number;
  dateLabel: string;
  sessionsCount: number;
}
export interface SessionDetail {
  dayName: string;
  dateLabel: string;
  startTimeReadable: string;
  endTimeReadable: string;
  durationReadable: string;
  durationMs: number;
}

export interface PlatformBreakdown {
  platformId: string;
  totalMs: number;
  percentage: number;
  readableTime: string;
  sessionsCount: number;
  sessionsDetails: SessionDetail[];
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
  platformsBreakdown: PlatformBreakdown[];
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
    locale: string,
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
        dayName: dateObj.toLocaleDateString(locale, { weekday: 'short' }),
        totalMs: dayData.duration,
        dateLabel: dateObj.toLocaleDateString(),
        sessionsCount: dayData.sessions,
      });
    }

    const periodStartMs = todayStart - (daysCount - 1) * 24 * 60 * 60 * 1000;
    const queryId = platformId === 'all' ? undefined : platformId;
    const allRecords = await this.repo.queryRecords({
      platformId: queryId,
      fromTime: periodStartMs,
      toTime: todayStart + 24 * 60 * 60 * 1000 - 1,
    });

    const totalPeriodMs = AnalyticsAggregator.calculateTotalDuration(allRecords);
    const groupedRecords = AnalyticsAggregator.groupRecordsByPlatform(allRecords);

    const platformsBreakdown: PlatformBreakdown[] = [];
    Object.entries(groupedRecords).forEach(([pId, records]) => {
      const platformTotalMs = AnalyticsAggregator.calculateTotalDuration(records);
      const percentage =
        totalPeriodMs > 0 ? Math.round((platformTotalMs / totalPeriodMs) * 100) : 0;

      records.sort((a, b) => b.startTime - a.startTime);

      const sessionsDetails: SessionDetail[] = records.map((r) => {
        const d = new Date(r.startTime);
        return {
          dayName: d.toLocaleDateString(locale, { weekday: 'short' }),
          dateLabel: d.toLocaleDateString(locale),
          startTimeReadable: AnalyticsFormatter.formatTime(r.startTime),
          endTimeReadable: AnalyticsFormatter.formatTime(r.endTime),
          durationReadable: AnalyticsFormatter.msToReadable(r.durationMs, translations),
          durationMs: r.durationMs,
        };
      });

      platformsBreakdown.push({
        platformId: pId,
        totalMs: platformTotalMs,
        percentage,
        readableTime: AnalyticsFormatter.msToReadable(platformTotalMs, translations),
        sessionsCount: records.length,
        sessionsDetails,
      });
    });

    platformsBreakdown.sort((a, b) => b.totalMs - a.totalMs);

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
      platformsBreakdown,
    };
  }
}
