import { describe, it, expect } from 'vitest';
import { getVideoId, getPlatformType, isYouTubeUrl } from '../../../src/platforms/youtube/parser';

describe('YouTube URL Parser (Pure Functions)', () => {
  describe('isYouTubeUrl', () => {
    it('should return true for valid YouTube URLs', () => {
      expect(isYouTubeUrl('https://www.youtube.com/watch?v=123')).toBe(true);
      expect(isYouTubeUrl('https://youtube.com/shorts/abc')).toBe(true);
    });

    it('should return false for non-YouTube URLs', () => {
      expect(isYouTubeUrl('https://vimeo.com/watch?v=123')).toBe(false);
      expect(isYouTubeUrl('https://google.com')).toBe(false);
    });
  });

  describe('getVideoId', () => {
    it('should extract ID from standard watch URLs', () => {
      expect(getVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
      expect(getVideoId('https://youtube.com/watch?v=12345&t=42s')).toBe('12345');
    });

    it('should extract ID from Shorts URLs', () => {
      expect(getVideoId('https://www.youtube.com/shorts/aBcDeFgHiJk')).toBe('aBcDeFgHiJk');
      expect(getVideoId('https://youtube.com/shorts/xyz?feature=share')).toBe('xyz');
    });

    it('should return null for invalid URLs or missing IDs', () => {
      expect(getVideoId('https://www.youtube.com/feed/subscriptions')).toBeNull();
      expect(getVideoId('not-a-valid-url')).toBeNull();
    });
  });

  describe('getPlatformType', () => {
    it('should identify Shorts platform', () => {
      expect(getPlatformType('https://www.youtube.com/shorts/123')).toBe('youtube_shorts');
    });

    it('should identify Watch platform for standard video URLs', () => {
      expect(getPlatformType('https://www.youtube.com/watch?v=123')).toBe('youtube_watch');
      expect(getPlatformType('https://www.youtube.com/')).toBe('youtube_watch');
    });
  });
});
