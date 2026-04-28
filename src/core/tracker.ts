import { PlatformAdapter, ItemChangeCallback } from '../core/interfaces/platform-adapter';

export class Tracker {
  private adapter: PlatformAdapter | null = null;
  private callback: ItemChangeCallback | null = null;

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
    if (this.callback) {
      this.adapter.observe((itemId) => {
        if (this.callback) this.callback(itemId);
      });
    }
  }

  public stop() {
    if (this.adapter) {
      this.adapter.disconnect();
    }
  }

  /**
   * Destroys the tracker instance, disconnects adapters, and clears memory references
   */
  public destroy() {
    this.stop();
    this.adapter = null;
    this.callback = null;
  }
}
