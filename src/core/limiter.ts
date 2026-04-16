export interface LimiterConfig {
  limit: number;
}

export interface LimiterEvents {
  onWarning?: (count: number) => void;
  onBlock?: (count: number) => void;
}

export interface PenaltyStrategy {
  apply(count: number): void;
}

export class NoPenalty implements PenaltyStrategy {
  apply(): void {
    // do nothing for now
  }
}

export class Limiter {
  private count = 0;
  private limit: number;
  private warned = false;

  private penalty: PenaltyStrategy;
  private events: LimiterEvents;

  constructor(
    config: LimiterConfig,
    events: LimiterEvents = {},
    penalty: PenaltyStrategy = new NoPenalty(),
  ) {
    this.limit = config.limit;
    this.events = events;
    this.penalty = penalty;
  }

  public increment(_videoId: string) {
    this.count++;
    this.handleState();
  }

  private handleState() {
    if (this.limit <= 0) return;

    if (this.count >= this.limit) {
      this.penalty.apply(this.count);
      this.events.onBlock?.(this.count);
    } else if (this.count === this.limit - 1 && !this.warned) {
      this.warned = true;
      this.events.onWarning?.(this.count);
    }
  }

  public getCount() {
    return this.count;
  }

  public getLimit() {
    return this.limit;
  }

  public setLimit(newLimit: number) {
    this.limit = newLimit;

    if (this.limit > 0) {
      this.warned = this.count >= this.limit - 1;
    } else {
      this.warned = false;
    }

    this.handleState();
  }

  public reset() {
    this.count = 0;
    this.warned = false;
  }

  /**
   * Hydrates internal state without triggering events.
   * Used when restoring persisted state.
   */
  public setInitialCount(count: number) {
    this.count = count;
    if (this.limit > 0) {
      this.warned = count >= this.limit - 1;
    }
  }
}
