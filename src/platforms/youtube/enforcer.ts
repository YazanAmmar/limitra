export class YouTubeDomEnforcer {
  private punishmentObserver: MutationObserver | null = null;
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;
  private readonly BLOCKED_KEYS = [' ', 'k', 'ArrowUp', 'ArrowDown'];

  public enforce(): void {
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

  public stop(): void {
    if (this.punishmentObserver) {
      this.punishmentObserver.disconnect();
      this.punishmentObserver = null;
    }
    if (this.keydownHandler) {
      window.removeEventListener('keydown', this.keydownHandler, true);
      this.keydownHandler = null;
    }
    document.body.classList.remove('limitra-global-punishment');
  }
}
