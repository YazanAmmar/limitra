import { PlatformAdapter, ItemChangeCallback } from '../types';

export class Tracker {
  private adapter: PlatformAdapter | null = null;
  private callback: ItemChangeCallback;

  constructor(callback: ItemChangeCallback) {
    this.callback = callback;
  }

  /**
   * Sets the platform adapter to be used by the tracker
   */
  public setAdapter(adapter: PlatformAdapter) {
    if (this.adapter) {
      this.adapter.disconnect();
    }
    this.adapter = adapter;
  }

  public init() {
    if (!this.adapter) {
      console.warn('[Tracker] No platform adapter set.');
      return;
    }
    this.adapter.observe((itemId) => {
      this.callback(itemId);
    });
  }

  public stop() {
    if (this.adapter) {
      this.adapter.disconnect();
    }
  }
}
