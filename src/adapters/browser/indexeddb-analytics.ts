import { AnalyticsRepository } from '../../core/interfaces/analytics-repository';
import { AnalyticsRecord, AnalyticsQueryFilter } from '../../core/analytics/types';

export class IndexedDbAnalyticsRepository implements AnalyticsRepository {
  private dbName = 'LimitraAnalyticsDB';
  private storeName = 'sessions';
  private version = 1;

  private async getDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('platformId', 'platformId', { unique: false });
          store.createIndex('startTime', 'startTime', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  public async saveRecord(record: AnalyticsRecord): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const request = store.put(record);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async queryRecords(filter: AnalyticsQueryFilter): Promise<AnalyticsRecord[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('startTime');

      const results: AnalyticsRecord[] = [];
      let range: IDBKeyRange | null = null;
      if (filter.fromTime !== undefined && filter.toTime !== undefined) {
        range = IDBKeyRange.bound(filter.fromTime, filter.toTime);
      } else if (filter.fromTime !== undefined) {
        range = IDBKeyRange.lowerBound(filter.fromTime);
      } else if (filter.toTime !== undefined) {
        range = IDBKeyRange.upperBound(filter.toTime);
      }

      const cursorRequest = index.openCursor(range);

      cursorRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;
        if (cursor) {
          const record = cursor.value as AnalyticsRecord;
          if (!filter.platformId || record.platformId === filter.platformId) {
            results.push(record);
          }
          cursor.continue();
        } else {
          resolve(results);
        }
      };

      cursorRequest.onerror = () => reject(cursorRequest.error);
    });
  }

  public async clearRecordsOlderThan(timestamp: number): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('startTime');
      const range = IDBKeyRange.upperBound(timestamp);

      const cursorRequest = index.openCursor(range);
      cursorRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      cursorRequest.onerror = () => reject(cursorRequest.error);
    });
  }
}
