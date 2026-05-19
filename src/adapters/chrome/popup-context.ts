export interface PopupContext {
  getActiveTabUrl(): Promise<string>;
  openOptionsPage(): Promise<void>;
}

export interface PopupContext {
  getActiveTabUrl(): Promise<string>;
  openOptionsPage(): Promise<void>;
  setActionIcon(isDark: boolean): Promise<void>;
}

export class ChromePopupContext implements PopupContext {
  async getActiveTabUrl(): Promise<string> {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      return tabs[0]?.url || '';
    } catch {
      return '';
    }
  }

  async openOptionsPage(): Promise<void> {
    if (typeof chrome !== 'undefined' && chrome.runtime?.openOptionsPage) {
      await chrome.runtime.openOptionsPage();
    }
  }

  async setActionIcon(isDark: boolean): Promise<void> {
    const iconPath = isDark
      ? '../../assets/manifest/32x32-dark.png'
      : '../../assets/manifest/32x32-light.png';

    if (typeof chrome !== 'undefined' && chrome.action) {
      await chrome.action.setIcon({ path: iconPath }).catch(console.error);
    }
  }
}
