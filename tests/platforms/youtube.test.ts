import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { YouTubeAdapter } from '../../src/platforms/youtube/index';
import { StorageFacade } from '../../src/core/storage/index';
import { ChromeStorageDriver } from '../../src/adapters/chrome/storage-driver';

// Mocking Chrome API
vi.stubGlobal('chrome', {
  storage: {
    local: {
      get: vi.fn((_, cb) => cb({})),
      set: vi.fn((_, cb) => cb()),
    },
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
});

describe('YouTubeAdapter', () => {
  let storage: StorageFacade;
  let mockOnModeChange: () => void;

  beforeEach(() => {
    vi.clearAllMocks();
    const driver = new ChromeStorageDriver();
    storage = new StorageFacade(driver);
    mockOnModeChange = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('URL Parsing and Identity', () => {
    it('should identify YouTube Shorts correctly', () => {
      const adapter = new YouTubeAdapter(
        storage,
        'https://www.youtube.com/shorts/12345',
        mockOnModeChange,
      );
      expect(adapter.id).toBe('youtube_shorts');
      expect(adapter.name).toBe('YouTube Shorts');
    });

    it('should identify standard YouTube Watch correctly', () => {
      const adapter = new YouTubeAdapter(
        storage,
        'https://www.youtube.com/watch?v=12345',
        mockOnModeChange,
      );
      expect(adapter.id).toBe('youtube_watch');
      expect(adapter.name).toBe('YouTube Watch');
    });

    it('should identify the root YouTube domain as Watch mode', () => {
      const adapter = new YouTubeAdapter(storage, 'https://www.youtube.com/', mockOnModeChange);
      expect(adapter.id).toBe('youtube_watch');
    });
  });

  describe('Hot-Swap Triggering', () => {
    it('should trigger onModeChange when navigating from Shorts to Watch', () => {
      const adapter = new YouTubeAdapter(
        storage,
        'https://www.youtube.com/shorts/abc',
        mockOnModeChange,
      );

      vi.stubGlobal('window', {
        location: { href: 'https://www.youtube.com/watch?v=xyz' },
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
