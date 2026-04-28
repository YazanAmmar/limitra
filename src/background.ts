import { StorageFacade } from './core/storage/index';
import { ChromeStorageDriver } from './adapters/chrome/storage-driver';
import { PlatformId, PLATFORMS_CONFIG } from './types';
import { ChromeAlarmManager } from './adapters/chrome/alarm-manager';
import { ChromeTabManager } from './adapters/chrome/tab-manager';
import { ChromeMessageBus } from './adapters/chrome/message-bus';
import { BackgroundOrchestrator } from './core/background-orchestrator';

const alarmManager = new ChromeAlarmManager();
const tabManager = new ChromeTabManager();
const messageBus = new ChromeMessageBus();
const storageDriver = new ChromeStorageDriver();
const storage = new StorageFacade(storageDriver);

const orchestrator = new BackgroundOrchestrator(alarmManager, tabManager, messageBus, storage);
orchestrator.init();

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'limitra-session') return;
  port.onDisconnect.addListener(async () => {
    const platforms = Object.keys(PLATFORMS_CONFIG) as PlatformId[];
    for (const platform of platforms) {
      await storage.endSession(platform);
      const hasTabs = await tabManager.hasActiveTabs(PLATFORMS_CONFIG[platform].urlPatterns);
      if (!hasTabs) {
        await alarmManager.clear(`limitra_block_alarm_${platform}`);
      }
    }
  });
});

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install' || details.reason === 'update') {
    try {
      const oldData = await chrome.storage.local.get([
        'limitra_count',
        'limitra_limit',
        'limitra_time_spent',
        'limitra_time_limit',
        'limitra_enable_limit',
        'limitra_enable_time',
      ]);

      if (oldData['limitra_count'] !== undefined) {
        const checkNew = await chrome.storage.local.get(['limitra_youtube_shorts_count']);
        if (checkNew['limitra_youtube_shorts_count'] === undefined) {
          console.warn('[Limitra] Migrating global settings to scoped (youtube_shorts)...');
          await chrome.storage.local.set({
            limitra_youtube_shorts_count: oldData['limitra_count'],
            limitra_youtube_shorts_limit: oldData['limitra_limit'],
            limitra_youtube_shorts_time_spent: oldData['limitra_time_spent'],
            limitra_youtube_shorts_time_limit: oldData['limitra_time_limit'],
            limitra_youtube_shorts_enable_limit: oldData['limitra_enable_limit'] ?? true,
            limitra_youtube_shorts_enable_time: oldData['limitra_enable_time'] ?? true,
          });
        }
      }

      const savedTheme = await storage.getTheme();
      const iconPath =
        savedTheme === 'dark'
          ? 'assets/manifest/32x32-dark.png'
          : 'assets/manifest/32x32-light.png';
      void chrome.action.setIcon({ path: iconPath }).catch(() => {});

      const platforms = Object.keys(PLATFORMS_CONFIG) as PlatformId[];
      for (const platform of platforms) {
        const tabs = await chrome.tabs.query({ url: PLATFORMS_CONFIG[platform].urlPatterns });
        for (const tab of tabs) {
          if (tab.id) {
            await chrome.scripting
              .insertCSS({ target: { tabId: tab.id }, files: ['styles.css'] })
              .catch(() => console.warn('CSS Injection skipped'));
            await chrome.scripting
              .executeScript({ target: { tabId: tab.id }, files: ['content.js'] })
              .catch(() => console.warn('Script Injection skipped'));
          }
        }
      }
    } catch (error) {
      console.error('[Limitra] Failed to inject scripts on install:', error);
    }
  }
});
