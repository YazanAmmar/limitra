import { PlatformId } from '../../types';

export type ItemChangeCallback = (itemId: string) => void;

/**
 * PlatformAdapter Port: Defines the contract for any supported platform (YouTube, IG, etc.)
 */
export interface PlatformAdapter {
  /**
   * Unique identifier for the platform (used for scoped storage and dynamic tracking)
   */
  readonly id: PlatformId;

  /**
   * Platform name used for UI and logging
   */
  name: string;

  /**
   * Checks whether the current URL belongs to this platform and its specific mode
   */
  isCurrentPlatform(url: string): boolean;

  /**
   * Starts observing platform-specific events (e.g., video changes, scrolling)
   */
  observe(onItemChange: ItemChangeCallback): void;

  /**
   * Cleans up all observers, intervals, and listeners
   */
  disconnect(): void;

  /**
   * Applies the enforcement/punishment logic (e.g., pause, mute, blur)
   */
  executePunishment(): void;

  /**
   * Checks if media is currently active (playing) for accurate time tracking
   */
  isVideoPlaying(): boolean;
}
