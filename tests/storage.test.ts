import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StorageFacade } from '../src/core/storage/index';
import { ChromeStorageDriver } from '../src/adapters/chrome/storage-driver';
import { PlatformId } from '../src/types';
import { AnalyticsRepository } from '../src/core/interfaces/analytics-repository';

const mockStorage: Record<string, unknown> = {};

vi.stubGlobal('chrome', {
  storage: {
    local: {
      get: vi.fn((keys: string[], callback: (result: Record<string, unknown>) => void) => {
        const key = keys[0];
        callback({ [key]: mockStorage[key] });
      }),
      set: vi.fn((data: Record<string, unknown>, callback: () => void) => {
        Object.assign(mockStorage, data);
        callback();
      }),
    },
  },
});

describe('Scoped Storage Architecture (Multi-Platform Isolation)', () => {
  let storage: StorageFacade;

  beforeEach(() => {
    for (const key in mockStorage) delete mockStorage[key];
    vi.clearAllMocks();
    vi.useFakeTimers();

    const mockAnalyticsRepo = {
      saveRecord: vi.fn().mockResolvedValue(undefined),
      queryRecords: vi.fn().mockResolvedValue([]),
      clearRecordsOlderThan: vi.fn(),
    } as unknown as AnalyticsRepository;

    const driver = new ChromeStorageDriver();
    storage = new StorageFacade(driver);
    storage.setAnalyticsRepository(mockAnalyticsRepo);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const YT: PlatformId = 'youtube_shorts';
  const IG: PlatformId = 'instagram_reels';

  describe('Data Isolation (Data Leak Prevention)', () => {
    it('should set and get limits completely independently per platform', async () => {
      await storage.setLimit(YT, 5);
      await storage.setLimit(IG, 10);

      expect(await storage.getLimit(YT)).toBe(5);
      expect(await storage.getLimit(IG)).toBe(10);

      await storage.setLimit(YT, 8);
      expect(await storage.getLimit(IG)).toBe(10);
    });

    it('should increment counts independently', async () => {
      await storage.setCount(YT, 2);
      await storage.setCount(IG, 9);

      await storage.incrementCount(YT);
      await storage.incrementCount(IG);
      await storage.incrementCount(IG);

      expect(await storage.getCount(YT)).toBe(3);
      expect(await storage.getCount(IG)).toBe(11);
    });
  });

  describe('Global Settings', () => {
    it('should share global settings across the extension', async () => {
      await storage.setTheme('dark');
      await storage.setLanguage('ar');

      expect(await storage.getTheme()).toBe('dark');
      expect(await storage.getLanguage()).toBe('ar');
    });
  });

  describe('Scoped Blocking Logic (isCurrentlyBlocked)', () => {
    it('should block ONLY the platform that exceeded its limits', async () => {
      await storage.setEnableLimit(YT, true);
      await storage.setLimit(YT, 3);
      await storage.setCount(YT, 3);

      await storage.setEnableLimit(IG, true);
      await storage.setLimit(IG, 10);
      await storage.setCount(IG, 5);

      const isYoutubeBlocked = await storage.isCurrentlyBlocked(YT);
      const isInstagramBlocked = await storage.isCurrentlyBlocked(IG);

      expect(isYoutubeBlocked).toBe(true);
      expect(isInstagramBlocked).toBe(false);
    });
  });

  describe('Session Management & Scoped Time Tracking', () => {
    it('should track time independently per platform', async () => {
      vi.setSystemTime(new Date('2026-04-26T10:00:00Z'));

      storage.usageRuntime!.getExactTimeSpent = vi.fn().mockImplementation(async (platform) => {
        if (platform === YT) return 5 * 60 * 1000;
        if (platform === IG) return 2 * 60 * 1000;
        return 0;
      });

      await storage.startSession(YT);
      vi.setSystemTime(new Date('2026-04-26T10:05:00Z'));
      await storage.endSession(YT);

      await storage.startSession(IG);
      vi.setSystemTime(new Date('2026-04-26T10:07:00Z'));
      await storage.endSession(IG);

      expect(await storage.getTimeSpent(YT)).toBe(5 * 60 * 1000);
      expect(await storage.getTimeSpent(IG)).toBe(2 * 60 * 1000);
    });
  });
});
