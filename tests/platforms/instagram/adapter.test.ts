import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { InstagramAdapter } from '../../../src/platforms/instagram/adapter';

describe('InstagramAdapter', () => {
  let mockOnModeChange: () => void;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnModeChange = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('URL Parsing and Identity', () => {
    it('should identify Instagram Reels correctly', () => {
      const adapter = new InstagramAdapter(
        'https://www.instagram.com/reels/12345',
        mockOnModeChange,
      );
      expect(adapter.id).toBe('instagram_reels');
      expect(adapter.name).toBe('Instagram Reels');
    });

    it('should identify standard Instagram Feed correctly', () => {
      const adapter = new InstagramAdapter('https://www.instagram.com/p/12345', mockOnModeChange);
      expect(adapter.id).toBe('instagram_feed');
      expect(adapter.name).toBe('Instagram Feed');
    });

    it('should identify the root Instagram domain as Feed mode', () => {
      const adapter = new InstagramAdapter('https://www.instagram.com/', mockOnModeChange);
      expect(adapter.id).toBe('instagram_feed');
    });
  });

  describe('Hot-Swap Triggering', () => {
    it('should trigger onModeChange when navigating from Reels to Feed', () => {
      const adapter = new InstagramAdapter('https://www.instagram.com/reels/abc', mockOnModeChange);

      vi.stubGlobal('window', {
        location: { href: 'https://www.instagram.com/' },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        setInterval: vi.fn(),
        clearInterval: vi.fn(),
        setTimeout: vi.fn(),
        clearTimeout: vi.fn(),
      });

      adapter['checkUrl']();

      expect(mockOnModeChange).toHaveBeenCalledTimes(1);
    });
  });
});
