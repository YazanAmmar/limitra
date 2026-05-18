import { StorageFacade } from '../../core/storage/index';
import { PlatformId } from '../../types';
import { i18n } from '../../i18n/index';
import { AnalyticsFormatter, TimeTranslations } from '../../core/analytics/formatter';
import {
  DashboardReportResult,
  TrendDayResult,
  PlatformBreakdown,
} from '../../core/analytics/reports/dashboard-report';

export class AnalyticsLoader {
  private activeReport: DashboardReportResult | null = null;
  private selectedDateLabel: string | null = null;

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

    const report = await this.storage.analyticsService.getDashboardReport(
      platformId,
      translations,
      i18n.language,
    );

    this.activeReport = report;
    this.selectedDateLabel = null;

    this.updateStatCards(report);
    this.renderTrendChart(report.weeklyTrend || [], translations);
    this.renderBreakdown(translations);
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

      const sessionsText =
        day.sessionsCount === 1 ? i18n.t.dashboard.sessionSingle : i18n.t.dashboard.sessionPlural;
      bar.setAttribute(
        'data-tooltip',
        `${day.dayName}: ${readableTime} • ${day.sessionsCount} ${sessionsText}`,
      );

      bar.onclick = () => {
        if (this.selectedDateLabel === day.dateLabel) {
          this.selectedDateLabel = null;
          document.querySelectorAll('.bar').forEach((b) => b.classList.remove('selected'));
        } else {
          this.selectedDateLabel = day.dateLabel;
          document.querySelectorAll('.bar').forEach((b) => b.classList.remove('selected'));
          bar.classList.add('selected');
        }
        this.renderBreakdown(translations);
      };

      const label = document.createElement('span');
      label.className = 'day-label';
      label.textContent = day.dayName;

      barWrapper.appendChild(bar);
      barWrapper.appendChild(label);
      chartContainer.appendChild(barWrapper);
    });
  }

  private renderBreakdown(translations: TimeTranslations) {
    const container = document.getElementById('breakdown-list');
    if (!container || !this.activeReport) return;

    container.replaceChildren();

    let displayData: PlatformBreakdown[] = this.activeReport.platformsBreakdown;

    if (this.selectedDateLabel) {
      displayData = this.activeReport.platformsBreakdown
        .map((platform) => {
          const filteredSessions = platform.sessionsDetails.filter(
            (s) => s.dateLabel === this.selectedDateLabel,
          );
          const dayTotalMs = filteredSessions.reduce((acc, s) => acc + s.durationMs, 0);
          return {
            ...platform,
            totalMs: dayTotalMs,
            sessionsCount: filteredSessions.length,
            sessionsDetails: filteredSessions,
            readableTime: AnalyticsFormatter.msToReadable(dayTotalMs, translations),
          };
        })
        .filter((p) => p.totalMs > 0);
    }

    const totalMsContext = displayData.reduce((acc, curr) => acc + curr.totalMs, 0);

    if (displayData.length === 0) {
      const emptyMsg = document.createElement('p');
      emptyMsg.textContent = i18n.t.dashboard.emptyUsageData;
      emptyMsg.className = 'empty-state-msg';
      container.appendChild(emptyMsg);
      return;
    }

    displayData.forEach((platform) => {
      const percentage =
        totalMsContext > 0 ? Math.round((platform.totalMs / totalMsContext) * 100) : 0;

      const platformNamesMap: Record<string, string> = {
        youtube_shorts: i18n.t.popup.youtubeShorts,
        youtube_watch: i18n.t.popup.youtubeWatch,
        instagram_reels: i18n.t.popup.instagramReels,
        instagram_feed: i18n.t.popup.instagramFeed,
      };
      const formattedName = platformNamesMap[platform.platformId] || platform.platformId;

      const item = document.createElement('div');
      item.className = 'breakdown-item';

      const header = document.createElement('div');
      header.className = 'breakdown-header';
      header.onclick = () => item.classList.toggle('expanded');

      const titleDiv = document.createElement('div');
      titleDiv.className = 'breakdown-title';
      const nameStrong = document.createElement('strong');
      nameStrong.textContent = formattedName;
      const sessionsSpan = document.createElement('span');

      const sText =
        platform.sessionsCount === 1
          ? i18n.t.dashboard.sessionSingle
          : i18n.t.dashboard.sessionPlural;
      sessionsSpan.textContent = `${platform.sessionsCount} ${sText}`;
      titleDiv.appendChild(nameStrong);
      titleDiv.appendChild(sessionsSpan);

      const statsDiv = document.createElement('div');
      statsDiv.className = 'breakdown-stats';
      const timeSpan = document.createElement('span');
      timeSpan.textContent = platform.readableTime;
      const pctStrong = document.createElement('strong');
      pctStrong.textContent = `${percentage}%`;
      statsDiv.appendChild(timeSpan);
      statsDiv.appendChild(pctStrong);

      header.appendChild(titleDiv);
      header.appendChild(statsDiv);

      const progressTrack = document.createElement('div');
      progressTrack.className = 'breakdown-progress-track';
      const progressFill = document.createElement('div');
      progressFill.className = 'breakdown-progress-fill';

      progressFill.setAttribute('style', `--progress: ${percentage}%`);

      progressTrack.appendChild(progressFill);

      const details = document.createElement('div');
      details.className = 'breakdown-details';

      platform.sessionsDetails.forEach((session) => {
        const sessionRow = document.createElement('div');
        sessionRow.className = 'session-row';

        if (!this.selectedDateLabel) {
          const daySpan = document.createElement('span');
          daySpan.textContent = session.dayName;
          sessionRow.appendChild(daySpan);
        }

        const timeRangeSpan = document.createElement('span');
        timeRangeSpan.textContent = `${session.startTimeReadable} - ${session.endTimeReadable}`;

        const durationSpan = document.createElement('span');
        durationSpan.className = 'session-time';
        durationSpan.textContent = session.durationReadable;

        sessionRow.appendChild(timeRangeSpan);
        sessionRow.appendChild(durationSpan);

        details.appendChild(sessionRow);
      });

      item.appendChild(header);
      item.appendChild(progressTrack);
      item.appendChild(details);

      container.appendChild(item);
    });
  }
}
