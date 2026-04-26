import { storage } from './core/storage/index';
import { AppAction, ExtensionMessage, PlatformId, PLATFORMS_CONFIG } from './types';

async function checkTimeLimitForPlatform(platform: PlatformId) {
  const alarmName = `limitra_block_alarm_${platform}`;
  const config = PLATFORMS_CONFIG[platform];
  if (!config) return;

  const isTimeEnabled = await storage.getEnableTime(platform);
  if (!isTimeEnabled) {
    void chrome.alarms.clear(alarmName);
    return;
  }

  const timeLimitMins = await storage.getTimeLimit(platform);
  if (timeLimitMins <= 0) {
    void chrome.alarms.clear(alarmName);
    return;
  }

  const timeSpentMs = await storage.getTimeSpent(platform);
  const limitMs = timeLimitMins * 60 * 1000;

  if (timeSpentMs >= limitMs) {
    const message: ExtensionMessage = { action: AppAction.BLOCK_NOW };

    const tabs = await chrome.tabs.query({ url: config.urlPatterns });
    for (const tab of tabs) {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, message).catch(() => {});
      }
    }
  } else {
    const timeRemainingMs = limitMs - timeSpentMs;
    let delayInMinutes = timeRemainingMs / 60000;
    delayInMinutes = Number(Math.max(0.1, delayInMinutes).toFixed(2));
    void chrome.alarms.create(alarmName, { delayInMinutes });
  }
}

async function checkAllTimeLimits() {
  const platforms = Object.keys(PLATFORMS_CONFIG) as PlatformId[];
  for (const platform of platforms) {
    void checkTimeLimitForPlatform(platform);
  }
}

chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender) => {
  if (message.action === AppAction.TAB_ACTIVE && sender.tab?.id) {
    void checkAllTimeLimits();
  } else if (message.action === AppAction.TAB_HIDDEN && sender.tab?.id) {
    const platforms = Object.keys(PLATFORMS_CONFIG) as PlatformId[];
    platforms.forEach((platform) => {
      void chrome.tabs.query({ url: PLATFORMS_CONFIG[platform].urlPatterns }).then((tabs) => {
        if (tabs.length === 0) {
          void chrome.alarms.clear(`limitra_block_alarm_${platform}`);
        }
      });
    });
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name.startsWith('limitra_block_alarm_')) {
    const platform = alarm.name.replace('limitra_block_alarm_', '') as PlatformId;
    void checkTimeLimitForPlatform(platform);
  }
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local') {
    if (changes['limitra_last_reset']) {
      void checkAllTimeLimits();
      return;
    }

    const platforms = Object.keys(PLATFORMS_CONFIG) as PlatformId[];
    for (const platform of platforms) {
      if (
        changes[`limitra_${platform}_time_limit`] ||
        changes[`limitra_${platform}_enable_time`] ||
        changes[`limitra_${platform}_time_spent`]
      ) {
        void checkTimeLimitForPlatform(platform);
      }
    }
  }
});

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'limitra-session') return;

  port.onDisconnect.addListener(async () => {
    const platforms = Object.keys(PLATFORMS_CONFIG) as PlatformId[];
    for (const platform of platforms) {
      await storage.endSession(platform);

      const tabs = await chrome.tabs.query({ url: PLATFORMS_CONFIG[platform].urlPatterns });
      if (tabs.length === 0) {
        void chrome.alarms.clear(`limitra_block_alarm_${platform}`);
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

      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const iconPath = isSystemDark
        ? 'assets/manifest/32x32-dark.png'
        : 'assets/manifest/32x32-light.png';
      void chrome.action.setIcon({ path: iconPath });

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
