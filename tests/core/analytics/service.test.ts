import { describe, it, expect, vi } from 'vitest';
import { AnalyticsService } from '../../../src/core/analytics/service';
import { AnalyticsRepository } from '../../../src/core/interfaces/analytics-repository';

describe('AnalyticsService', () => {
  const mockRepo: AnalyticsRepository = {
    saveRecord: vi.fn(),
    queryRecords: vi.fn().mockResolvedValue([
      {
        id: '1',
        platformId: 'youtube_watch',
        startTime: Date.now() - 10000,
        endTime: Date.now(),
        durationMs: 10000,
      },
      {
        id: '2',
        platformId: 'youtube_watch',
        startTime: Date.now() - 20000,
        endTime: Date.now() - 15000,
        durationMs: 5000,
      },
    ]),
    clearRecordsOlderThan: vi.fn(),
  };

  const service = new AnalyticsService(mockRepo);

  it('should calculate today usage correctly using the aggregator', async () => {
    const usage = await service.getTodayUsage('youtube_watch');
    expect(usage).toBe(15000);
    expect(mockRepo.queryRecords).toHaveBeenCalled();
  });

  it('should generate agent context data correctly', async () => {
    const context = await service.getAgentContextData(7);
    expect(context['youtube_watch']).toBe(15000);
  });
});
