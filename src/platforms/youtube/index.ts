import { PlatformAdapter, ItemChangeCallback, PlatformId } from '../../types';
import { storage } from '../../core/storage/index';

export class YouTubeAdapter implements PlatformAdapter {
  public readonly id: PlatformId = 'youtube_shorts';
  public name = 'YouTube Shorts';

  private lastVideoId: string | null = null;
  private observer: MutationObserver | null = null;
  private callback: ItemChangeCallback | null = null;

  private punishmentObserver: MutationObserver | null = null;
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;

  private pendingVideoId: string | null = null;
  private readonly WATCH_THRESHOLD = 1500;

  private urlCheckInterval: number | null = null;
  private popstateHandler: (() => void) | null = null;

  private watchTimer: number | null = null;
  private isWatching: boolean = false;
  private visibilityHandler: (() => void) | null = null;

  private countedVideos = new Set<string>();
  private storageListener:
    | ((changes: { [key: string]: chrome.storage.StorageChange }) => void)
    | null = null;

  public isCurrentPlatform(url: string): boolean {
    return url.includes('youtube.com') && url.includes('/shorts/');
  }

  private startOrResumeWatchTimer(id: string) {
    if (this.isWatching) return;

    if (this.countedVideos.has(id)) return;

    this.isWatching = true;
    this.watchTimer = window.setTimeout(() => {
      const currentId = this.getVideoId(window.location.href);

      if (!document.hidden && currentId === id) {
        if (!this.countedVideos.has(id)) {
          this.countedVideos.add(id);
          if (this.callback) this.callback(id);
        }
      }

      this.isWatching = false;
      this.watchTimer = null;
    }, this.WATCH_THRESHOLD);
  }

  private pauseWatchTimer() {
    if (this.watchTimer) {
      window.clearTimeout(this.watchTimer);
      this.watchTimer = null;
    }
    this.isWatching = false;
  }

  private handleVideoChange(id: string) {
    this.pendingVideoId = id;
    this.pauseWatchTimer();

    if (!document.hidden) {
      this.startOrResumeWatchTimer(id);
    }
  }

  public observe(onItemChange: ItemChangeCallback): void {
    this.callback = onItemChange;
    this.lastVideoId = null;

    this.visibilityHandler = () => {
      if (document.hidden) {
        this.pauseWatchTimer();
      } else {
        if (this.pendingVideoId && this.pendingVideoId === this.getVideoId(window.location.href)) {
          this.startOrResumeWatchTimer(this.pendingVideoId);
        }
      }
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);

    this.storageListener = (changes) => {
      if (changes[`limitra_${this.id}_count`] || changes[`limitra_${this.id}_time_spent`]) {
        void storage.isCurrentlyBlocked(this.id).then((isBlocked) => {
          if (isBlocked) {
            this.executePunishment();
          }
        });
      }
    };
    chrome.storage.onChanged.addListener(this.storageListener);

    this.observeUrlChanges();
  }

  public disconnect(): void {
    this.pauseWatchTimer();
    this.countedVideos.clear();

    if (this.urlCheckInterval !== null) {
      window.clearInterval(this.urlCheckInterval);
      this.urlCheckInterval = null;
    }

    if (this.popstateHandler) {
      window.removeEventListener('popstate', this.popstateHandler);
      this.popstateHandler = null;
    }

    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }

    if (this.storageListener) {
      chrome.storage.onChanged.removeListener(this.storageListener);
      this.storageListener = null;
    }

    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    if (this.punishmentObserver) {
      this.punishmentObserver.disconnect();
      this.punishmentObserver = null;
    }

    if (this.keydownHandler) {
      window.removeEventListener('keydown', this.keydownHandler, true);
      this.keydownHandler = null;
    }

    document.body.classList.remove('limitra-global-punishment');
    this.callback = null;
    this.pendingVideoId = null;
    this.lastVideoId = null;
  }

  public executePunishment(): void {
    if (this.punishmentObserver) return;

    document.body.classList.add('limitra-global-punishment');

    const silenceVideos = () => {
      const videos = document.querySelectorAll<HTMLVideoElement>('video');

      videos.forEach((video) => {
        if (!video.paused || !video.muted) {
          video.muted = true;
          video.pause();
        }
      });
    };

    silenceVideos();

    let scheduled = false;

    this.punishmentObserver = new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;

      requestAnimationFrame(() => {
        silenceVideos();
        scheduled = false;
      });
    });

    this.punishmentObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    this.keydownHandler = (e: KeyboardEvent) => {
      const blockedKeys = [' ', 'k', 'ArrowUp', 'ArrowDown'];
      if (blockedKeys.includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener('keydown', this.keydownHandler, true);
  }

  private getVideoId(url: string): string | null {
    const match = url.match(/shorts\/([^?]+)/);
    return match ? match[1] : null;
  }

  private checkUrl() {
    const currentId = this.getVideoId(window.location.href);

    if (currentId !== this.lastVideoId) {
      this.lastVideoId = currentId;
      if (currentId) {
        void this.handleVideoChange(currentId);
      } else {
        this.pauseWatchTimer();
        this.pendingVideoId = null;
      }
    }
  }

  private observeUrlChanges() {
    let lastUrl = window.location.href;

    this.popstateHandler = () => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        this.checkUrl();
      }
    };
    window.addEventListener('popstate', this.popstateHandler);

    this.urlCheckInterval = window.setInterval(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        this.checkUrl();
      }

      if (!document.hidden && !this.isWatching && this.pendingVideoId) {
        if (this.getVideoId(window.location.href) === this.pendingVideoId) {
          this.startOrResumeWatchTimer(this.pendingVideoId);
        }
      }
    }, 500);

    this.checkUrl();
  }

  public isVideoPlaying(): boolean {
    const video = document.querySelector('video') as HTMLVideoElement | null;
    return !!video && !video.paused;
  }
}
