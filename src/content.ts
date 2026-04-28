import { YouTubeAdapter } from './platforms/youtube/index';
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
    try {
      const storageDriver = new ChromeStorageDriver();
      const storage = new StorageFacade(storageDriver);
      const messageBus = new ChromeMessageBus();
      const connectionManager = new ChromeConnectionManager();

      const adapters = [new YouTubeAdapter(storage)];
      const currentUrl = location.href;
      const activeAdapter = adapters.find((adapter) => adapter.isCurrentPlatform(currentUrl));

      if (!activeAdapter) {
        console.warn('[Limitra] Site not supported yet. Sleeping...');
        return;
      }

      const app = new AppOrchestrator(activeAdapter, messageBus, connectionManager, storage);
      await app.start();
    } catch (err) {
      console.error('[Limitra] Bootstrap failed:', err);
      window.__LIMITRA_INJECTED__ = false;
    }
  })();
}
