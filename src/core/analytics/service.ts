import { AnalyticsAggregator } from './aggregator';
import { AnalyticsRepository } from '../interfaces/analytics-repository';
import { DashboardReportGenerator } from './reports/dashboard-report';
import { TimeTranslations } from './formatter';

export class AnalyticsService {
  private dashboardReport: DashboardReportGenerator;

  constructor(private repo: AnalyticsRepository) {
    this.dashboardReport = new DashboardReportGenerator(this.repo);
  }

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
   * Garbage collection hook reserved for future storage maintenance strategies.
   *
   * Analytics retention is currently set to lifetime because session-based
   * records are lightweight and valuable for long-term behavioral analysis.
   *
   * In future releases, this routine may be reused for:
   * - tier-based retention policies
   * - archive/compression strategies
   * - temporary cache cleanup
   * - cloud synchronization maintenance
   * - AI memory optimization
   */
  public async performGarbageCollection(): Promise<void> {
    console.info(
      '[Limitra Analytics] Garbage collection skipped. Lifetime retention mode is active.',
    );
  }

  /**
   * Delegate dashboard report generation to the reporting layer
   */
  public async getDashboardReport(platformId: string, translations: TimeTranslations) {
    return this.dashboardReport.generate(platformId, translations);
  }

  public async saveRecord(record: import('./types').AnalyticsRecord): Promise<void> {
    return this.repo.saveRecord(record);
  }
}
