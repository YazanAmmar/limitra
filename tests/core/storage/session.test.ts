import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SessionStorage } from '../../../src/core/storage/session';
import { StorageDriver } from '../../../src/core/storage/driver';
import { StatsStorage } from '../../../src/core/storage/stats';
import { AnalyticsRepository } from '../../../src/core/interfaces/analytics-repository';
import { PlatformId } from '../../../src/types';

describe('SessionStorage Core Logic (Session Stitching & Grace Period)', () => {
  let sessionStorage: SessionStorage;
  let mockDriver: StorageDriver;
  let mockStats: StatsStorage;
  let mockAnalyticsRepo: AnalyticsRepository;

  const memoryStore: Record<string, unknown> = {};

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-18T10:00:00Z'));

    for (const key in memoryStore) delete memoryStore[key];

    mockDriver = {
      get: vi.fn().mockImplementation(async <T>(key: string): Promise<T | null> => {
        return (memoryStore[key] as T) || null;
      }),
      set: vi.fn().mockImplementation(async (key: string, value: unknown) => {
        memoryStore[key] = value;
      }),
      onChange: vi.fn(),
      removeListener: vi.fn(),
    } as unknown as StorageDriver;

    mockStats = {
      addTime: vi.fn(),
      resetCount: vi.fn(),
      setTimeSpent: vi.fn(),
    } as unknown as StatsStorage;

    mockAnalyticsRepo = {
      saveRecord: vi.fn().mockResolvedValue(undefined),
      queryRecords: vi.fn(),
      clearRecordsOlderThan: vi.fn(),
    };

    sessionStorage = new SessionStorage(mockDriver, mockStats);
    sessionStorage.setAnalyticsRepository(mockAnalyticsRepo);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  const YT: PlatformId = 'youtube_watch';

  it('Scenario 1: Double Start Protection - Should not create duplicate sessions', async () => {
    await sessionStorage.startSession(YT);
    await sessionStorage.startSession(YT);
    await sessionStorage.startSession(YT);

    expect(mockAnalyticsRepo.saveRecord).toHaveBeenCalledTimes(1);
  });

  it('Scenario 2: Grace Period Resume - Should stitch sessions within 15 minutes', async () => {
    await sessionStorage.startSession(YT);

    vi.setSystemTime(new Date('2026-05-18T10:10:00Z'));
    await sessionStorage.endSession(YT);

    const pausedKey = `limitra_${YT}_paused_session`;
    expect(memoryStore[pausedKey]).toBeDefined();

    vi.setSystemTime(new Date('2026-05-18T10:20:00Z'));
    await sessionStorage.startSession(YT);

    vi.setSystemTime(new Date('2026-05-18T10:30:00Z'));
    await sessionStorage.endSession(YT);

    const lastCallArg = vi.mocked(mockAnalyticsRepo.saveRecord).mock.lastCall![0];
    expect(lastCallArg.durationMs).toBe(20 * 60 * 1000);
    expect(memoryStore[pausedKey]).toBeDefined();
  });

  it('Scenario 3: Grace Period Expiration - Should create new session after 15 minutes', async () => {
    await sessionStorage.startSession(YT);

    vi.setSystemTime(new Date('2026-05-18T10:10:00Z'));
    await sessionStorage.endSession(YT);

    const pausedData = memoryStore[`limitra_${YT}_paused_session`] as { id: string };
    const firstSessionId = pausedData.id;

    vi.setSystemTime(new Date('2026-05-18T10:30:00Z'));
    await sessionStorage.startSession(YT);

    vi.setSystemTime(new Date('2026-05-18T10:35:00Z'));
    await sessionStorage.endSession(YT);

    const newSession = memoryStore[`limitra_${YT}_paused_session`] as {
      id: string;
      durationMs: number;
    };
    expect(newSession.id).not.toBe(firstSessionId);
    expect(newSession.durationMs).toBe(5 * 60 * 1000);
  });

  it('Scenario 4: Interruption Exclusion - Should calculate accumulatedMs correctly ignoring break time', async () => {
    await sessionStorage.startSession(YT);
    vi.setSystemTime(new Date('2026-05-18T10:10:00Z'));
    await sessionStorage.endSession(YT);

    vi.setSystemTime(new Date('2026-05-18T10:15:00Z'));

    await sessionStorage.startSession(YT);

    vi.setSystemTime(new Date('2026-05-18T10:35:00Z'));
    await sessionStorage.endSession(YT);

    const lastCallArg = vi.mocked(mockAnalyticsRepo.saveRecord).mock.lastCall![0];
    expect(lastCallArg.durationMs).toBe(30 * 60 * 1000);
  });

  it('Scenario 5: Multi-tab Resume - Should resume session using central storage across isolated tabs', async () => {
    await sessionStorage.startSession(YT);
    vi.setSystemTime(new Date('2026-05-18T10:05:00Z'));
    await sessionStorage.endSession(YT);

    const pausedSession = memoryStore[`limitra_${YT}_paused_session`];
    expect(pausedSession).toBeDefined();

    const tabBSessionStorage = new SessionStorage(mockDriver, mockStats);
    tabBSessionStorage.setAnalyticsRepository(mockAnalyticsRepo);

    vi.setSystemTime(new Date('2026-05-18T10:10:00Z'));
    await tabBSessionStorage.startSession(YT);

    vi.setSystemTime(new Date('2026-05-18T10:15:00Z'));
    await tabBSessionStorage.endSession(YT);

    const lastCallArg = vi.mocked(mockAnalyticsRepo.saveRecord).mock.lastCall![0];
    expect(lastCallArg.durationMs).toBe(10 * 60 * 1000);

    const finalPausedSession = memoryStore[`limitra_${YT}_paused_session`] as { id: string };
    expect(finalPausedSession).toBeDefined();
  });
});
