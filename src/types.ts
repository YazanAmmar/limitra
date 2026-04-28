export type PlatformId = 'youtube_shorts' | 'youtube_watch' | 'instagram' | 'global';

export const PLATFORMS_CONFIG: Record<PlatformId, { urlPatterns: string[] }> = {
  youtube_shorts: { urlPatterns: ['*://*.youtube.com/*'] },
  youtube_watch: { urlPatterns: ['*://*.youtube.com/*'] },
  instagram: { urlPatterns: ['*://*.instagram.com/*'] },
  global: { urlPatterns: ['<all_urls>'] },
};

export enum AppAction {
  BLOCK_NOW = 'BLOCK_NOW',
  TAB_ACTIVE = 'TAB_ACTIVE',
  TAB_HIDDEN = 'TAB_HIDDEN',
}

export interface ExtensionMessage {
  action: AppAction;
  platform?: PlatformId;
  [key: string]: unknown;
}
