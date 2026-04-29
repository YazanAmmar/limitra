import { PlatformAdapter, ItemChangeCallback } from '../../core/interfaces/platform-adapter';
import { PlatformId } from '../../types';
import { isYouTubeUrl, getVideoId, getPlatformType } from './parser';
import { YouTubeDomEnforcer } from './enforcer';

export class YouTubeAdapter implements PlatformAdapter {
  public readonly id: PlatformId;
  public name: string;

  private get WATCH_THRESHOLD() {
    return this.id === 'youtube_shorts' ? 1500 : 10000;
  }

  private callback: ItemChangeCallback | null = null;
  private lastVideoId: string | null = null;
  private pendingVideoId: string | null = null;

  private ytNavigationHandler: ((e: Event) => void) | null = null;
  private popstateHandler: (() => void) | null = null;
  private visibilityHandler: (() => void) | null = null;
  private urlCheckInterval: number | null = null;

  private watchTimer: number | null = null;
  private isWatching: boolean = false;
  private countedVideos = new Set<string>();

  private enforcer = new YouTubeDomEnforcer();

  constructor(
    currentUrl: string,
    private onModeChange: () => void,
  ) {
    this.id = getPlatformType(currentUrl);
    this.name = this.id === 'youtube_shorts' ? 'YouTube Shorts' : 'YouTube Watch';
  }

  private startOrResumeWatchTimer(id: string) {
    if (this.isWatching) return;
    if (this.countedVideos.has(id)) return;

    this.isWatching = true;
    this.watchTimer = window.setTimeout(() => {
      const currentId = getVideoId(window.location.href);
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
    return isYouTubeUrl(url);
  }

  public observe(onItemChange: ItemChangeCallback): void {
    this.callback = onItemChange;
    this.lastVideoId = null;

    this.visibilityHandler = () => {
      if (document.hidden) {
        this.pauseWatchTimer();
      } else {
        if (this.pendingVideoId && this.pendingVideoId === getVideoId(window.location.href)) {
          this.startOrResumeWatchTimer(this.pendingVideoId);
        }
      }
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);

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

    this.enforcer.stop();

    this.callback = null;
    this.pendingVideoId = null;
    this.lastVideoId = null;
  }

  public executePunishment(): void {
    this.enforcer.enforce();
  }

  private checkUrl() {
    const currentUrl = window.location.href;
    const evaluatedMode = getPlatformType(currentUrl);

    if (evaluatedMode !== this.id) {
      this.onModeChange();
      return;
    }

    const currentId = getVideoId(currentUrl);
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
        if (getVideoId(window.location.href) === this.pendingVideoId) {
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
