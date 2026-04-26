export type PlatformId = 'youtube_shorts' | 'youtube_watch' | 'instagram' | 'global';

export const PLATFORMS_CONFIG: Record<PlatformId, { urlPatterns: string[] }> = {
  youtube_shorts: { urlPatterns: ['*://*.youtube.com/*'] },
  youtube_watch: { urlPatterns: ['*://*.youtube.com/*'] },
  instagram: { urlPatterns: ['*://*.instagram.com/*'] },
  global: { urlPatterns: ['<all_urls>'] },
};

export type ItemChangeCallback = (itemId: string) => void;

export interface PlatformAdapter {
  /**
   * Unique identifier for the platform (used for scoped storage and dynamic tracking)
   */
  readonly id: PlatformId;

  /**
   * Platform name used for UI, logging, and debugging purposes
   */
  name: string;

  /**
   * Checks whether the current URL belongs to this platform
   * and matches the required pattern (e.g., Shorts URL)
   */
  isCurrentPlatform(url: string): boolean;

  /**
   * Some platforms observe changes in elements (like YouTube),
   * while others only track whether the user remains on the page.
   */
  observe(onItemChange: ItemChangeCallback): void;

  /**
   * Cleans up resources, intervals, and stops any active observers
   */
  disconnect(): void;

  /**
   * The function that applies the penalty in a way that suits the platform
   * (e.g., pausing the video, muting audio, or blurring the screen)
   */
  executePunishment(): void;

  /**
   * Checks if media is currently playing to track active time accurately
   */
  isVideoPlaying(): boolean;
}

export enum AppAction {
  BLOCK_NOW = 'BLOCK_NOW',
  TAB_ACTIVE = 'TAB_ACTIVE',
  TAB_HIDDEN = 'TAB_HIDDEN',
}

export interface ExtensionMessage {
  action: AppAction;
  [key: string]: unknown;
}
