export interface OverlayData {
  badgeText: string;
  quoteText: string;
  reasonText: string;
  isDark: boolean;
  direction: 'rtl' | 'ltr';
  nextResetTime: number;
  unlocksInText: string;
  unlockingText: string;
  clickToCopyText: string;
  copiedText: string;
}

export function renderOverlay(data: OverlayData): void {
  if (document.getElementById('limitra-overlay')) return;

  if (!document.getElementById('limitra-fonts')) {
    const fontLink = document.createElement('link');
    fontLink.id = 'limitra-fonts';
    fontLink.rel = 'stylesheet';
    fontLink.href =
      'https://fonts.googleapis.com/css2?family=Inter:wght@800&family=JetBrains+Mono:wght@800&display=swap';
    document.head.appendChild(fontLink);
  }

  const container = document.createElement('div');
  container.id = 'limitra-overlay';
  container.className = 'limitra-overlay';
  container.dir = data.direction;

  if (data.isDark) {
    container.classList.add('dark');
  }

  const card = document.createElement('div');
  card.className = 'limitra-overlay-card';

  const badge = document.createElement('div');
  badge.className = 'limitra-badge';
  badge.textContent = data.badgeText;

  const message = document.createElement('p');
  message.className = 'limitra-quote';
  message.textContent = data.quoteText;
  message.title = data.clickToCopyText;

  let toastTimeout: number;

  message.addEventListener('click', () => {
    void navigator.clipboard.writeText(data.quoteText);

    let toast = document.getElementById('limitra-toast');
    if (toast) {
      toast.remove();
      clearTimeout(toastTimeout);
    }

    toast = document.createElement('div');
    toast.id = 'limitra-toast';
    toast.className = 'limitra-toast';
    toast.textContent = data.copiedText;

    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast!.classList.add('show');
    });

    toastTimeout = window.setTimeout(() => {
      const activeToast = document.getElementById('limitra-toast');
      if (activeToast) {
        activeToast.classList.remove('show');
        setTimeout(() => activeToast.remove(), 200);
      }
    }, 2000);
  });

  const reasonNode = document.createElement('div');
  reasonNode.className = 'limitra-reason';
  reasonNode.textContent = data.reasonText;

  const countdownNode = document.createElement('div');
  countdownNode.className = 'limitra-countdown';

  card.appendChild(badge);
  card.appendChild(message);
  card.appendChild(reasonNode);
  card.appendChild(countdownNode);
  container.appendChild(card);
  document.body.appendChild(container);

  const updateCountdown = () => {
    const now = Date.now();
    const diff = data.nextResetTime - now;
    if (diff <= 0) {
      countdownNode.textContent = data.unlockingText;
      clearInterval(intervalId);
      setTimeout(() => window.location.reload(), 1500);
      return;
    }
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    countdownNode.textContent = `${data.unlocksInText} ${timeString}`;
  };
  updateCountdown();
  const intervalId = setInterval(updateCountdown, 1000);
}

export function updateOverlayTheme(isDark: boolean) {
  const container = document.getElementById('limitra-overlay');
  if (!container) return;
  if (isDark) container.classList.add('dark');
  else container.classList.remove('dark');
}
