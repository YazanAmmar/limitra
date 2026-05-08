import { StorageFacade } from '../../core/storage/index';
import { PlatformId } from '../../types';

export class AnalyticsLoader {
  constructor(private storage: StorageFacade) {}

  /**
   * Fetch the report and update
   * DOM elements directly
   */
  public async loadAndRender(platformId: PlatformId) {
    if (!this.storage.analyticsService) {
      console.warn('[Limitra] AnalyticsService is not initialized.');
      return;
    }

    const translations = { hours: 'h', minutes: 'm' };

    const report = await this.storage.analyticsService.getDashboardReport(platformId, translations);

    const todayEl = document.getElementById('stat-today-time');
    const sessionsEl = document.getElementById('stat-sessions');
    const trendEl = document.getElementById('stat-trend');

    if (todayEl) {
      todayEl.textContent = report.formatted.todayReadable;
    }

    if (sessionsEl) {
      sessionsEl.textContent = report.raw.todaySessions.toString();
    }

    if (trendEl) {
      trendEl.textContent = report.formatted.trendText;

      trendEl.classList.remove('text-success', 'text-danger');

      if (report.formatted.isImproving) {
        trendEl.classList.add('text-success');
      } else {
        trendEl.classList.add('text-danger');
      }
    }
  }
}
