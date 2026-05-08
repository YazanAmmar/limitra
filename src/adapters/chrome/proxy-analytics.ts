import { AnalyticsRepository } from '../../core/interfaces/analytics-repository';
import { AnalyticsRecord, AnalyticsQueryFilter } from '../../core/analytics/types';
import { AppAction } from '../../types';

export class ChromeProxyAnalyticsRepository implements AnalyticsRepository {
  public async saveRecord(record: AnalyticsRecord): Promise<void> {
    chrome.runtime.sendMessage({ action: AppAction.SAVE_ANALYTICS, record }).catch(() => {});
  }
  public async queryRecords(_filter: AnalyticsQueryFilter): Promise<AnalyticsRecord[]> {
    return [];
  }
  public async clearRecordsOlderThan(_timestamp: number): Promise<void> {}
}
