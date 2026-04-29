import { YouTubeAdapter } from './platforms/youtube/adapter';
import { InstagramAdapter } from './platforms/instagram/adapter';
import { AppOrchestrator } from './app/orchestrator';
import { ChromeMessageBus } from './adapters/chrome/message-bus';
import { ChromeConnectionManager } from './adapters/chrome/connection-manager';
import { ChromeStorageDriver } from './adapters/chrome/storage-driver';
import { StorageFacade } from './core/storage/index';

declare global {
  interface Window {
    __LIMITRA_INJECTED__?: boolean;
  }
}

if (!window.__LIMITRA_INJECTED__) {
  window.__LIMITRA_INJECTED__ = true;

  void (async () => {
    const storageDriver = new ChromeStorageDriver();
    const storage = new StorageFacade(storageDriver);
    const messageBus = new ChromeMessageBus();
    const connectionManager = new ChromeConnectionManager();

    let currentApp: AppOrchestrator | null = null;

    let isBootstrapping = false;

    const bootstrap = async () => {
      if (isBootstrapping) return;
      isBootstrapping = true;

      try {
        const ghostOverlay = document.getElementById('limitra-overlay');
        if (ghostOverlay) {
          console.warn('[Limitra] Removing ghost overlay from previous installation.');
          ghostOverlay.remove();
          document.body.classList.remove('limitra-global-punishment');
        }

        if (currentApp) {
          console.warn('[Limitra] Platform change detected. Destroying old instance...');
          currentApp.destroy();
          currentApp = null;
        }

        const currentUrl = location.href;

        const adapters = [
          new YouTubeAdapter(currentUrl, () => {
            void bootstrap();
          }),
          new InstagramAdapter(currentUrl, () => {
            void bootstrap();
          }),
        ];

        const activeAdapter = adapters.find((adapter) => adapter.isCurrentPlatform(currentUrl));

        if (!activeAdapter) {
          console.warn('[Limitra] Site not supported yet or context irrelevant. Sleeping...');
          return;
        }

        currentApp = new AppOrchestrator(activeAdapter, messageBus, connectionManager, storage);
        await currentApp.start();

        console.warn(`[Limitra] engine started for: ${activeAdapter.id}`);
      } catch (err) {
        console.error('[Limitra] Bootstrap failed:', err);
        window.__LIMITRA_INJECTED__ = false;
      } finally {
        isBootstrapping = false;
      }
    };

    await bootstrap();
  })();
}
