import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { Limiter, NoPenalty } from '../src/core/limiter';

describe('Limiter Core Logic', () => {
  let onWarningMock: Mock<(count: number) => void>;
  let onBlockMock: Mock<(count: number) => void>;
  let limiter: Limiter;

  const LIMIT = 3;

  beforeEach(() => {
    onWarningMock = vi.fn();
    onBlockMock = vi.fn();
    limiter = new Limiter(
      { limit: LIMIT },
      {
        onWarning: onWarningMock,
        onBlock: onBlockMock,
      },
      new NoPenalty(),
    );
  });

  it('should start with zero count and the correct limit', () => {
    expect(limiter.getCount()).toBe(0);
    expect(limiter.getLimit()).toBe(LIMIT);
  });

  it('should increment the count correctly', () => {
    limiter.increment('video_1');
    expect(limiter.getCount()).toBe(1);
    limiter.increment('video_2');
    expect(limiter.getCount()).toBe(2);
  });

  it('should trigger onWarning exactly once at (limit - 1)', () => {
    limiter.increment('video_1');
    limiter.increment('video_2');

    expect(onWarningMock).toHaveBeenCalledTimes(1);
    expect(onWarningMock).toHaveBeenCalledWith(2);
    expect(onBlockMock).not.toHaveBeenCalled();

    limiter.increment('video_3');
    expect(onWarningMock).toHaveBeenCalledTimes(1);
  });

  it('should trigger onBlock exactly when the limit is reached and beyond', () => {
    limiter.increment('video_1');
    limiter.increment('video_2');
    expect(onBlockMock).not.toHaveBeenCalled();

    limiter.increment('video_3');
    expect(onBlockMock).toHaveBeenCalledTimes(1);
    expect(onBlockMock).toHaveBeenCalledWith(3);

    limiter.increment('video_4');
    expect(onBlockMock).toHaveBeenCalledTimes(2);
    expect(onBlockMock).toHaveBeenCalledWith(4);
  });

  it('should handle custom initial counts correctly', () => {
    limiter.setInitialCount(2);
    expect(limiter.getCount()).toBe(2);

    limiter.increment('video_3');
    expect(onWarningMock).not.toHaveBeenCalled();
    expect(onBlockMock).toHaveBeenCalledTimes(1);
  });

  it('should do nothing if limit is 0 (Disabled)', () => {
    const disabledLimiter = new Limiter(
      { limit: 0 },
      { onWarning: onWarningMock, onBlock: onBlockMock },
    );
    disabledLimiter.increment('video_1');
    expect(onWarningMock).not.toHaveBeenCalled();
    expect(onBlockMock).not.toHaveBeenCalled();
  });
});
