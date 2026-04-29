export class InstagramDomEnforcer {
  private punishmentObserver: MutationObserver | null = null;
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;

  private readonly BLOCKED_KEYS = [' ', 'ArrowUp', 'ArrowDown'];

  public enforce(): void {
    if (this.punishmentObserver) return;

    document.body.classList.add('limitra-global-punishment');

    const silenceMedia = () => {
      const videos = document.querySelectorAll<HTMLVideoElement>('video');
      videos.forEach((video) => {
        if (!video.paused || !video.muted) {
          video.muted = true;
          video.pause();
        }
      });
    };

    silenceMedia();

    let scheduled = false;
    this.punishmentObserver = new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        silenceMedia();
        scheduled = false;
      });
    });

    this.punishmentObserver.observe(document.body, {
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
