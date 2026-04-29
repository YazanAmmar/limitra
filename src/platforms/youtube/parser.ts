import { PlatformId } from '../../types';

/**
 * Determines whether a given URL belongs to YouTube.
 * This acts as a guard to prevent applying platform-specific logic on invalid domains.
 */
export function isYouTubeUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname.includes('youtube.com');
  } catch {
    return false;
  }
}

/**
 * Extracts the YouTube video ID from supported URL formats (Shorts or Watch).
 * This is required for tracking unique content and enforcing limits per video.
 */
export function getVideoId(url: string): string | null {
  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.pathname.startsWith('/shorts/')) {
      const parts = parsedUrl.pathname.split('/');
      return parts[2] || null;
    } else if (parsedUrl.pathname.startsWith('/watch')) {
      return parsedUrl.searchParams.get('v');
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Resolves the YouTube platform type based on URL structure.
 * This ensures correct routing between Shorts and Watch logic in the system.
 */
export function getPlatformType(url: string): PlatformId {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.pathname.startsWith('/shorts/')) {
      return 'youtube_shorts';
    }
    return 'youtube_watch';
  } catch {
    // Fallback to watch to avoid misclassification on malformed URLs
    return 'youtube_watch';
  }
}
