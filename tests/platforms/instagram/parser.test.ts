import { describe, it, expect } from 'vitest';
import {
  isInstagramUrl,
  getVideoId,
  getPlatformType,
} from '../../../src/platforms/instagram/parser';

describe('Instagram URL Parser (Pure Functions)', () => {
  describe('isInstagramUrl', () => {
    it('should return true for valid Instagram URLs', () => {
      expect(isInstagramUrl('https://www.instagram.com/')).toBe(true);
      expect(isInstagramUrl('https://instagram.com/reels/C1XYZ123')).toBe(true);
    });

    it('should return false for non-Instagram URLs', () => {
      expect(isInstagramUrl('https://facebook.com/reels/123')).toBe(false);
      expect(isInstagramUrl('not-a-valid-url')).toBe(false);
    });
  });

  describe('getVideoId', () => {
    it('should extract ID from Reels URLs', () => {
      expect(getVideoId('https://www.instagram.com/reels/C1XYZ123/')).toBe('C1XYZ123');
      expect(getVideoId('https://instagram.com/reel/C1XYZ123/?utm_source=ig_web_copy_link')).toBe(
        'C1XYZ123',
      );
    });

    it('should return null for non-Reel URLs', () => {
      expect(getVideoId('https://www.instagram.com/p/C1XYZ123/')).toBeNull();
      expect(getVideoId('https://www.instagram.com/direct/inbox/')).toBeNull();
      expect(getVideoId('https://www.instagram.com/')).toBeNull();
    });
  });

  describe('getPlatformType', () => {
    it('should identify Reels platform', () => {
      expect(getPlatformType('https://www.instagram.com/reels/123')).toBe('instagram_reels');
      expect(getPlatformType('https://instagram.com/reel/123')).toBe('instagram_reels');
    });

    it('should identify Feed platform for standard URLs', () => {
      expect(getPlatformType('https://www.instagram.com/p/123')).toBe('instagram_feed');
      expect(getPlatformType('https://www.instagram.com/')).toBe('instagram_feed');
    });
  });
});
