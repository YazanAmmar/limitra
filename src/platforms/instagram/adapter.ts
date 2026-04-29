import { PlatformAdapter, ItemChangeCallback } from '../../core/interfaces/platform-adapter';
import { PlatformId } from '../../types';
import { isInstagramUrl, getVideoId, getPlatformType } from './parser';
import { InstagramDomEnforcer } from './enforcer';

export class InstagramAdapter implements PlatformAdapter {
  public readonly id: PlatformId;
  public name: string;

  private readonly WATCH_THRESHOLD = 1500;

  private callback: ItemChangeCallback | null = null;
  private lastVideoId: string | null = null;
  private pendingVideoId: string | null = null;

  private popstateHandler: (() => void) | null = null;
  private visibilityHandler: (() => void) | null = null;
  private urlCheckInterval: number | null = null;

  private feedObserver: IntersectionObserver | null = null;
  private domObserver: MutationObserver | null = null;

  private watchTimer: number | null = null;
  private isWatching: boolean = false;
  private countedItems = new Set<string>();

  private enforcer = new InstagramDomEnforcer();

  constructor(
    currentUrl: string,
    private onModeChange: () => void,
  ) {
    this.id = getPlatformType(currentUrl);
    this.name = this.id === 'instagram_reels' ? 'Instagram Reels' : 'Instagram Feed';
  }

  private startOrResumeWatchTimer(id: string) {
    if (this.isWatching) return;
    if (this.countedItems.has(id)) return;

    this.isWatching = true;
    this.watchTimer = window.setTimeout(() => {
      const isReels = this.id === 'instagram_reels';
      const isValid = isReels
        ? getVideoId(window.location.href) === id
        : this.pendingVideoId === id;

      if (!document.hidden && isValid) {
        if (!this.countedItems.has(id)) {
          this.countedItems.add(id);
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

  private handleItemChange(id: string) {
    this.pendingVideoId = id;
    this.pauseWatchTimer();
    if (!document.hidden) {
      this.startOrResumeWatchTimer(id);
    }
  }

  private setupFeedObservation() {
    if (this.feedObserver) return;

    this.feedObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const link = entry.target.querySelector('a[href*="/p/"], a[href*="/reel/"]');
          const postId = link ? link.getAttribute('href') : null;

          if (entry.isIntersecting && postId) {
            this.pendingVideoId = postId;
            this.startOrResumeWatchTimer(postId);
          } else if (!entry.isIntersecting && postId === this.pendingVideoId) {
            this.pauseWatchTimer();
            this.pendingVideoId = null;
          }
        });
      },
      { threshold: 0.6 },
    );

    this.domObserver = new MutationObserver(() => {
      const articles = document.querySelectorAll('article');
      articles.forEach((article) => {
        if (!article.hasAttribute('data-limitra-observed')) {
          article.setAttribute('data-limitra-observed', 'true');
          this.feedObserver?.observe(article);
        }
      });
    });

    this.domObserver.observe(document.body, { childList: true, subtree: true });
  }

  private stopFeedObservation() {
    if (this.feedObserver) {
      this.feedObserver.disconnect();
      this.feedObserver = null;
    }
    if (this.domObserver) {
      this.domObserver.disconnect();
      this.domObserver = null;
    }
  }

  public isCurrentPlatform(url: string): boolean {
    return isInstagramUrl(url);
  }

  public observe(onItemChange: ItemChangeCallback): void {
    this.callback = onItemChange;
    this.lastVideoId = null;

    this.visibilityHandler = () => {
      if (document.hidden) {
        this.pauseWatchTimer();
      } else {
        if (this.pendingVideoId) {
          this.startOrResumeWatchTimer(this.pendingVideoId);
        }
      }
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);

    this.observeUrlChanges();

    if (this.id === 'instagram_feed') {
      this.setupFeedObservation();
    }
  }

  public disconnect(): void {
    this.pauseWatchTimer();
    this.stopFeedObservation();
    this.countedItems.clear();

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

    if (this.id === 'instagram_reels') {
      const currentId = getVideoId(currentUrl);
      if (currentId !== this.lastVideoId) {
        this.lastVideoId = currentId;
        if (currentId) {
          void this.handleItemChange(currentId);
        } else {
          this.pauseWatchTimer();
          this.pendingVideoId = null;
        }
      }
    }
  }

  private observeUrlChanges() {
    this.popstateHandler = () => this.checkUrl();
    window.addEventListener('popstate', this.popstateHandler);

    this.urlCheckInterval = window.setInterval(() => {
      this.checkUrl();
      if (
        this.id === 'instagram_reels' &&
        !document.hidden &&
        !this.isWatching &&
        this.pendingVideoId
      ) {
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
