import { storage } from './core/storage/index';
import { AppAction, ExtensionMessage } from './types';

async function checkTimeLimit() {
  const isTimeEnabled = await storage.getEnableTime();
  if (!isTimeEnabled) {
    void chrome.alarms.clear('limitra_block_alarm');
    return;
  }

  const timeLimitMins = await storage.getTimeLimit();
  if (timeLimitMins <= 0) {
    void chrome.alarms.clear('limitra_block_alarm');
    return;
  }

  const timeSpentMs = await storage.getTimeSpent();
  const limitMs = timeLimitMins * 60 * 1000;

  if (timeSpentMs >= limitMs) {
    const message: ExtensionMessage = { action: AppAction.BLOCK_NOW };

    const tabs = await chrome.tabs.query({ url: '*://*.youtube.com/*' });
    for (const tab of tabs) {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, message).catch(() => {});
      }
    }
  } else {
    const timeRemainingMs = limitMs - timeSpentMs;
    let delayInMinutes = timeRemainingMs / 60000;
    delayInMinutes = Number(Math.max(0.1, delayInMinutes).toFixed(2));
    void chrome.alarms.create('limitra_block_alarm', { delayInMinutes });
  }
}

chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender) => {
  if (message.action === AppAction.TAB_ACTIVE && sender.tab?.id) {
    void checkTimeLimit();
  } else if (message.action === AppAction.TAB_HIDDEN && sender.tab?.id) {
    void chrome.tabs.query({ url: '*://*.youtube.com/*' }).then((tabs) => {
      if (tabs.length === 0) {
        void chrome.alarms.clear('limitra_block_alarm');
      }
    });
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'limitra_block_alarm') {
    void checkTimeLimit();
  }
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local') {
    if (
      changes['limitra_last_reset'] ||
      changes['limitra_time_limit'] ||
      changes['limitra_enable_time'] ||
      changes['limitra_time_spent']
    ) {
      void checkTimeLimit();
    }
  }
});

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'limitra-session') return;

  port.onDisconnect.addListener(async () => {
    await storage.endSession();

    const tabs = await chrome.tabs.query({ url: '*://*.youtube.com/*' });
    if (tabs.length === 0) {
      void chrome.alarms.clear('limitra_block_alarm');
    }
  });
});

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install' || details.reason === 'update') {
    try {
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const iconPath = isSystemDark
        ? 'assets/manifest/32x32-dark.png'
        : 'assets/manifest/32x32-light.png';
      void chrome.action.setIcon({ path: iconPath });

      const tabs = await chrome.tabs.query({ url: '*://*.youtube.com/*' });
      for (const tab of tabs) {
        if (tab.id) {
          await chrome.scripting.insertCSS({
            target: { tabId: tab.id },
            files: ['styles.css'],
          });

          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js'],
          });

          console.warn(`[Limitra] Successfully injected into existing tab: ${tab.id}`);
        }
      }
    } catch (error) {
      console.error('[Limitra] Failed to inject scripts on install:', error);
    }
  }
});
