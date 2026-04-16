import { PlatformAdapter, ItemChangeCallback } from '../../types';

export class YouTubeAdapter implements PlatformAdapter {
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

  public isCurrentPlatform(url: string): boolean {
    return url.includes('youtube.com') && url.includes('/shorts/');
  }

  public observe(onItemChange: ItemChangeCallback): void {
    this.callback = onItemChange;
    this.lastVideoId = this.getVideoId(window.location.href);
    this.observeUrlChanges();
  }

  public disconnect(): void {
    if (this.urlCheckInterval !== null) {
      window.clearInterval(this.urlCheckInterval);
      this.urlCheckInterval = null;
    }

    if (this.popstateHandler) {
      window.removeEventListener('popstate', this.popstateHandler);
      this.popstateHandler = null;
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
      const blockedKeys = [' ', 'k', 'ArrowUp', 'ArrowDown']; // play/pause shortcuts
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

  private async handleVideoChange(id: string) {
    if (!this.callback) return;
    this.pendingVideoId = id;
    await new Promise((r) => setTimeout(r, this.WATCH_THRESHOLD));
    if (this.pendingVideoId === id && this.getVideoId(window.location.href) === id) {
      this.callback(id);
    }
  }

  private checkUrl() {
    const currentId = this.getVideoId(window.location.href);
    if (!currentId) return;
    if (currentId !== this.lastVideoId) {
      this.lastVideoId = currentId;
      void this.handleVideoChange(currentId);
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
    }, 500);

    this.checkUrl();
  }

  public isVideoPlaying(): boolean {
    const video = document.querySelector('video') as HTMLVideoElement | null;
    return !!video && !video.paused;
  }
}
