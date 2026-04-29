import { PlatformId } from '../../types';

/**
 * Ensures that Instagram-specific parsing logic is only applied to valid Instagram URLs.
 * This prevents incorrect platform detection and avoids leaking invalid data into the core logic.
 */
export function isInstagramUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname.includes('instagram.com');
  } catch {
    return false;
  }
}

/**
 * Extracts a stable identifier for Reel content to enable tracking and enforcement.
 * This allows the system to associate user activity with a specific short-form content unit.
 */
export function getVideoId(url: string): string | null {
  try {
    const parsedUrl = new URL(url);

    const pathParts = parsedUrl.pathname.split('/').filter(Boolean);

    // Reel URLs follow /reels/{id} or /reel/{id}
    if (pathParts.length >= 2 && (pathParts[0] === 'reels' || pathParts[0] === 'reel')) {
      return pathParts[1];
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Resolves the Instagram usage mode based on navigation context (URL structure),
 * not content type. This ensures consistent enforcement behavior aligned with
 * how the user is consuming the platform (Reels vs Feed).
 */
export function getPlatformType(url: string): PlatformId {
  try {
    const parsedUrl = new URL(url);
    const pathParts = parsedUrl.pathname.split('/').filter(Boolean);

    if (pathParts.length > 0 && (pathParts[0] === 'reels' || pathParts[0] === 'reel')) {
      return 'instagram_reels';
    }

    return 'instagram_feed';
  } catch {
    return 'instagram_feed';
  }
}
