import { StorageFacade } from '../../core/storage/index';
import { PlatformId } from '../../types';
import { i18n } from '../../i18n/index';
import { AnalyticsFormatter, TimeTranslations } from '../../core/analytics/formatter';
import {
  DashboardReportResult,
  TrendDayResult,
} from '../../core/analytics/reports/dashboard-report';

export class AnalyticsLoader {
  constructor(private storage: StorageFacade) {}

  /**
   * Fetch the report and update
   * DOM elements directly
   */
  public async loadAndRender(platformId: PlatformId | 'all') {
    if (!this.storage.analyticsService) return;

    const translations: TimeTranslations = {
      hours: i18n.t.dashboard.hoursShort,
      minutes: i18n.t.dashboard.minutesShort,
    };

    const report = await this.storage.analyticsService.getDashboardReport(platformId, translations);

    this.updateStatCards(report);
    this.renderTrendChart(report.weeklyTrend || [], translations);
  }

  private updateStatCards(report: DashboardReportResult) {
    const todayEl = document.getElementById('stat-today-time');
    const sessionsEl = document.getElementById('stat-sessions');
    const trendEl = document.getElementById('stat-trend');

    if (todayEl) todayEl.textContent = report.formatted.todayReadable;
    if (sessionsEl) sessionsEl.textContent = report.raw.todaySessions.toString();
    if (trendEl) {
      trendEl.textContent = report.formatted.trendText;
      trendEl.className =
        'stat-value ' + (report.formatted.isImproving ? 'text-success' : 'text-danger');
    }
  }

  private renderTrendChart(trendData: TrendDayResult[], translations: TimeTranslations) {
    const chartContainer = document.getElementById('trend-chart');
    if (!chartContainer) return;

    chartContainer.replaceChildren();

    const maxMs = Math.max(...trendData.map((d) => d.totalMs), 1);

    trendData.forEach((day) => {
      const heightPercent = (day.totalMs / maxMs) * 100;
      const readableTime = AnalyticsFormatter.msToReadable(day.totalMs, translations);

      const barWrapper = document.createElement('div');
      barWrapper.className = 'bar-wrapper';

      const bar = document.createElement('div');
      bar.className = 'bar brutal-tooltip';

      bar.setAttribute('style', `--dynamic-height: ${heightPercent}%`);

      bar.setAttribute('data-tooltip', `${day.dayName}: ${readableTime}`);

      const label = document.createElement('span');
      label.className = 'day-label';
      label.textContent = day.dayName;

      barWrapper.appendChild(bar);
      barWrapper.appendChild(label);
      chartContainer.appendChild(barWrapper);
    });
  }
}
