let isOverlayObserverRunning = false;

export function watchOverlayPersistence(onRemoved: () => void): void {
  if (isOverlayObserverRunning) return;
  isOverlayObserverRunning = true;

  const observer = new MutationObserver(() => {
    if (!document.getElementById('limitra-overlay')) {
      observer.disconnect();
      isOverlayObserverRunning = false;

      onRemoved();
    }
  });

  observer.observe(document.body, { childList: true });
}
