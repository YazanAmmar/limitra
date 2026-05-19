import { describe, it, expect } from 'vitest';
import { AnalyticsFormatter } from '../../../src/core/analytics/formatter';

describe('AnalyticsFormatter', () => {
  it('should format ms to readable string correctly', () => {
    expect(AnalyticsFormatter.msToReadable(30000)).toBe('1m');
    expect(AnalyticsFormatter.msToReadable(45 * 60 * 1000)).toBe('45m');
    expect(AnalyticsFormatter.msToReadable(135 * 60 * 1000)).toBe('2h 15m');
    expect(AnalyticsFormatter.msToReadable(180 * 60 * 1000)).toBe('3h');
  });

  it('should support custom translation tokens', () => {
    const customTranslations = {
      hours: 'hours',
      minutes: 'minutes',
    };

    expect(AnalyticsFormatter.msToReadable(135 * 60 * 1000, customTranslations)).toBe(
      '2hours 15minutes',
    );
  });

  it('should calculate trend percentage accurately', () => {
    expect(AnalyticsFormatter.calculateTrendPercent(100, 150)).toBe(50);
    expect(AnalyticsFormatter.calculateTrendPercent(200, 100)).toBe(-50);
    expect(AnalyticsFormatter.calculateTrendPercent(0, 100)).toBe(100);
    expect(AnalyticsFormatter.calculateTrendPercent(100, 100)).toBe(0);
  });

  it('should format trend string correctly', () => {
    expect(AnalyticsFormatter.formatTrend(50)).toBe('+50%');
    expect(AnalyticsFormatter.formatTrend(-30)).toBe('-30%');
    expect(AnalyticsFormatter.formatTrend(0)).toBe('0%');
  });
});
