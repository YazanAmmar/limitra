/**
 * Represents a single usage session for a specific website.
 * We use domain instead of platformId to support custom websites in the future.
 */
export interface AnalyticsRecord {
  id: string;
  platformId: string;
  startTime: number;
  endTime: number;
  durationMs: number;
  type?: 'SESSION';
}

/**
 * Filters used by the Limitra Agent or the user interface to query analytics data.
 */
export interface AnalyticsQueryFilter {
  platformId?: string;
  fromTime?: number;
  toTime?: number;
}
