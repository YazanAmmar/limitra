export interface TimeTranslations {
  hours: string;
  minutes: string;
}

export class AnalyticsFormatter {
  /**
   * Convert milliseconds to a readable format (e.g., 2h 15m or 45m)
   */
  public static msToReadable(
    ms: number,
    t: TimeTranslations = { hours: 'h', minutes: 'm' },
  ): string {
    const totalMinutes = Math.floor(ms / (1000 * 60));
    if (totalMinutes < 1) return `0${t.minutes}`;

    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    if (hours > 0) {
      return mins > 0 ? `${hours}${t.hours} ${mins}${t.minutes}` : `${hours}${t.hours}`;
    }
    return `${mins}${t.minutes}`;
  }

  /**
   * Calculate the percentage change between two periods (e.g., today compared to yesterday)
   * A positive result indicates an increase in usage, and a negative one indicates a decrease (improvement).
   */
  public static calculateTrendPercent(oldMs: number, newMs: number): number {
    if (oldMs === 0) return newMs > 0 ? 100 : 0;
    const difference = newMs - oldMs;
    return Math.round((difference / oldMs) * 100);
  }

  /**
   * Convert percentage to a formatted string with a sign (e.g., +15% or -32%)
   */
  public static formatTrend(trendPercent: number): string {
    if (trendPercent > 0) return `+${trendPercent}%`;
    if (trendPercent < 0) return `${trendPercent}%`;
    return '0%';
  }
}
