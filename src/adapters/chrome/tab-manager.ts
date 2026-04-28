import { TabManager } from '../../core/interfaces/tab-manager';
import { ExtensionMessage } from '../../types';

export class ChromeTabManager implements TabManager {
  public async sendMessageToPattern(
    urlPatterns: string[],
    message: ExtensionMessage,
  ): Promise<void> {
    const tabs = await chrome.tabs.query({ url: urlPatterns });
    for (const tab of tabs) {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, message).catch(() => {});
      }
    }
  }

  public async hasActiveTabs(urlPatterns: string[]): Promise<boolean> {
    const tabs = await chrome.tabs.query({ url: urlPatterns });
    return tabs.length > 0;
  }
}
