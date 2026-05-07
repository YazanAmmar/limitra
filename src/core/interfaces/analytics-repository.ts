import { AnalyticsRecord, AnalyticsQueryFilter } from '../analytics/types';

export interface AnalyticsRepository {
  /**
   * Saves a new record into the database.
   * Should support updating existing records if the id already exists
   * (used for heartbeat checkpointing).
   */
  saveRecord(record: AnalyticsRecord): Promise<void>;

  /**
   * Retrieves records based on the provided filters.
   */
  queryRecords(filter: AnalyticsQueryFilter): Promise<AnalyticsRecord[]>;

  /**
   * Removes old records to save storage space.
   * Mainly used for the free tier retention policy.
   */
  clearRecordsOlderThan(timestamp: number): Promise<void>;
}
