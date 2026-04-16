import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { storage } from '../src/core/storage';

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

describe('Storage Core Logic & Anti-Bypass', () => {
  beforeEach(() => {
    for (const key in mockStorage) {
      delete mockStorage[key];
    }
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Basic Operations', () => {
    it('should return default limit (0) if not set', async () => {
      const limit = await storage.getLimit();
      expect(limit).toBe(0);
    });

    it('should set and get limit correctly', async () => {
      await storage.setLimit(5);
      const limit = await storage.getLimit();
      expect(limit).toBe(5);
    });

    it('should increment count correctly', async () => {
      await storage.setCount(2);
      const next = await storage.incrementCount();
      expect(next).toBe(3);
      const current = await storage.getCount();
      expect(current).toBe(3);
    });
  });

  describe('Session Management & Day Rollover', () => {
    it('should reset count on a new day', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      mockStorage['limitra_last_reset'] = yesterday.getTime();
      mockStorage['limitra_count'] = 5;

      await storage.ensureSession();

      const count = await storage.getCount();
      expect(count).toBe(0);
    });

    it('should NOT reset count on the same day', async () => {
      mockStorage['limitra_last_reset'] = Date.now();
      mockStorage['limitra_count'] = 5;

      await storage.ensureSession();

      const count = await storage.getCount();
      expect(count).toBe(5);
    });
  });

  describe('Anti-Bypass System (Security Checks)', () => {
    it('should NOT detect bypass on normal increment', async () => {
      mockStorage['limitra_count'] = 5;
      mockStorage['limitra_last_count'] = 4;

      const isBypassed = await storage.detectBypass();
      expect(isBypassed).toBe(false);
    });

    it('should NOT detect bypass after a legitimate session reset', async () => {
      mockStorage['limitra_count'] = 10;
      mockStorage['limitra_last_count'] = 10;
      await storage.ensureSession();
      const isBypassed = await storage.detectBypass();
      expect(isBypassed).toBe(false);
    });
  });

  describe('Time Tracking', () => {
    it('should calculate time spent correctly', async () => {
      vi.setSystemTime(new Date('2026-03-31T10:00:00Z'));
      await storage.startSession();

      vi.setSystemTime(new Date('2026-03-31T10:05:00Z'));
      const delta = await storage.endSession();

      expect(delta).toBe(5 * 60 * 1000);
      const timeSpent = await storage.getTimeSpent();
      expect(timeSpent).toBe(5 * 60 * 1000);
    });
  });
});
