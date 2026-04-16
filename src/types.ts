export type ItemChangeCallback = (itemId: string) => void;

export interface PlatformAdapter {
  /**
   * Platform name used for logging and debugging purposes
   */
  name: string;

  /**
   * Checks whether the current URL belongs to this platform
   * and matches the required pattern (e.g., Shorts URL)
   */
  isCurrentPlatform(url: string): boolean;

  /**
   * Some platforms observe changes in elements (like YouTube),
   * while others only track whether the user remains on the page (like articles).
   */
  observe(onItemChange: ItemChangeCallback): void;

  /**
   * Cleans up resources and stops any active observers
   */
  disconnect(): void;

  /**
   * The function that applies the penalty in a way that suits the platform
   * (e.g., pausing the video or blurring the screen)
   */
  executePunishment(): void;

  isVideoPlaying(): boolean;
}

export enum AppAction {
  BLOCK_NOW = 'BLOCK_NOW',
  TAB_ACTIVE = 'TAB_ACTIVE',
  TAB_HIDDEN = 'TAB_HIDDEN',
  PING = 'PING',
}

export interface ExtensionMessage {
  action: AppAction;
  [key: string]: unknown;
}
