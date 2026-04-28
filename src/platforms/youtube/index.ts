import { PlatformAdapter, ItemChangeCallback, PlatformId } from '../../types';
import { StorageChangeListener } from '../../core/storage/driver';
import { StorageFacade } from '../../core/storage/index';

export class YouTubeAdapter implements PlatformAdapter {
  public readonly id: PlatformId = 'youtube_shorts';
  public name = 'YouTube Shorts';

  private readonly WATCH_THRESHOLD = 1500;
  private readonly BLOCKED_KEYS = [' ', 'k', 'ArrowUp', 'ArrowDown'];

  private storageListener: StorageChangeListener | null = null;
  private callback: ItemChangeCallback | null = null;

  private lastVideoId: string | null = null;
  private pendingVideoId: string | null = null;

  private punishmentObserver: MutationObserver | null = null;
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;

  private ytNavigationHandler: ((e: Event) => void) | null = null;
  private popstateHandler: (() => void) | null = null;
  private urlCheckInterval: number | null = null;

  private watchTimer: number | null = null;
  private isWatching: boolean = false;
  private visibilityHandler: (() => void) | null = null;

  private countedVideos = new Set<string>();

  constructor(private storage: StorageFacade) {}

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

  public isCurrentPlatform(url: string): boolean {
    return url.includes('youtube.com') && url.includes('/shorts/');
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

    this.storageListener = (
      changes: Record<string, import('../../core/storage/driver').StorageChange>,
    ) => {
      if (changes[`limitra_${this.id}_count`] || changes[`limitra_${this.id}_time_spent`]) {
        void this.storage.isCurrentlyBlocked(this.id).then((isBlocked: boolean) => {
          if (isBlocked) {
            this.executePunishment();
          }
        });
      }
    };
    this.storage.onChange(this.storageListener);

    this.observeUrlChanges();
  }

  public disconnect(): void {
    this.pauseWatchTimer();
    this.countedVideos.clear();

    if (this.urlCheckInterval !== null) {
      window.clearInterval(this.urlCheckInterval);
      this.urlCheckInterval = null;
    }

    if (this.ytNavigationHandler) {
      window.removeEventListener('yt-navigate-finish', this.ytNavigationHandler);
      this.ytNavigationHandler = null;
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
      this.storage.removeListener(this.storageListener);
      this.storageListener = null;
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

    const appContainer = document.querySelector('ytd-app') || document.body;
    this.punishmentObserver.observe(appContainer, {
      childList: true,
      subtree: true,
    });

    this.keydownHandler = (e: KeyboardEvent) => {
      if (this.BLOCKED_KEYS.includes(e.key)) {
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
    this.popstateHandler = () => this.checkUrl();
    window.addEventListener('popstate', this.popstateHandler);

    this.ytNavigationHandler = () => this.checkUrl();
    window.addEventListener('yt-navigate-finish', this.ytNavigationHandler);

    this.urlCheckInterval = window.setInterval(() => {
      this.checkUrl();

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
