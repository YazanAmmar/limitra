import { YouTubeAdapter } from './platforms/youtube/index';
import { AppOrchestrator } from './app/orchestrator';

declare global {
  interface Window {
    __LIMITRA_INJECTED__?: boolean;
  }
}

if (!window.__LIMITRA_INJECTED__) {
  window.__LIMITRA_INJECTED__ = true;

  void (async () => {
    try {
      const adapters = [new YouTubeAdapter()];
      const currentUrl = location.href;

      const activeAdapter = adapters.find((adapter) => adapter.isCurrentPlatform(currentUrl));

      if (!activeAdapter) {
        console.warn('[Limitra] Site not supported yet. Sleeping...');
        return;
      }

      const app = new AppOrchestrator(activeAdapter);
      await app.start();
    } catch (err) {
      console.error('[Limitra] Bootstrap failed:', err);
      window.__LIMITRA_INJECTED__ = false;
    }
  })();
}
