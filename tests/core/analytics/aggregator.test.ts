import { describe, it, expect } from 'vitest';
import { AnalyticsAggregator } from '../../../src/core/analytics/aggregator';
import { AnalyticsRecord } from '../../../src/core/analytics/types';

describe('AnalyticsAggregator', () => {
  const mockRecords: AnalyticsRecord[] = [
    { id: '1', platformId: 'youtube_shorts', startTime: 1000, endTime: 2000, durationMs: 1000 },
    { id: '2', platformId: 'instagram_reels', startTime: 2000, endTime: 2500, durationMs: 500 },
    { id: '3', platformId: 'youtube_shorts', startTime: 3000, endTime: 5000, durationMs: 2000 },
  ];

  it('should calculate total duration correctly', () => {
    const total = AnalyticsAggregator.calculateTotalDuration(mockRecords);
    expect(total).toBe(3500);
  });

  it('should filter records by platform', () => {
    const youtubeRecords = AnalyticsAggregator.filterByPlatform(mockRecords, 'youtube_shorts');
    expect(youtubeRecords.length).toBe(2);
    expect(youtubeRecords[0].platformId).toBe('youtube_shorts');
    expect(youtubeRecords[1].platformId).toBe('youtube_shorts');
  });

  it('should group duration by platform accurately', () => {
    const grouped = AnalyticsAggregator.groupDurationByPlatform(mockRecords);
    expect(grouped['youtube_shorts']).toBe(3000);
    expect(grouped['instagram_reels']).toBe(500);
    expect(grouped['facebook']).toBeUndefined();
  });
});
