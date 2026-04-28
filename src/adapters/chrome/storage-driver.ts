import { StorageDriver, StorageChangeListener, StorageChange } from '../../core/storage/driver';

export class ChromeStorageDriver implements StorageDriver {
  private listenerMap = new WeakMap<
    StorageChangeListener,
    (changes: { [key: string]: chrome.storage.StorageChange }, namespace: string) => void
  >();

  async get<T>(key: string): Promise<T | null> {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result: Record<string, unknown>) => {
        resolve((result[key] as T) ?? null);
      });
    });
  }

  async set<T>(key: string, value: T): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, () => {
        resolve();
      });
    });
  }

  onChange(listener: StorageChangeListener): void {
    const wrapper = (
      changes: { [key: string]: chrome.storage.StorageChange },
      namespace: string,
    ) => {
      if (namespace === 'local') {
        listener(changes as Record<string, StorageChange>);
      }
    };
    this.listenerMap.set(listener, wrapper);
    chrome.storage.onChanged.addListener(wrapper);
  }

  removeListener(listener: StorageChangeListener): void {
    const wrapper = this.listenerMap.get(listener);
    if (wrapper) {
      chrome.storage.onChanged.removeListener(wrapper);
      this.listenerMap.delete(listener);
    }
  }
}
