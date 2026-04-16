import { StorageDriver } from './driver';

const COUNT_KEY = 'limitra_count';
const TIME_SPENT_KEY = 'limitra_time_spent';

export class StatsStorage {
  constructor(private driver: StorageDriver) {}

  async getCount(): Promise<number> {
    return (await this.driver.get<number>(COUNT_KEY)) ?? 0;
  }

  async setCount(count: number): Promise<void> {
    await this.driver.set<number>(COUNT_KEY, count);
  }

  async incrementCount(): Promise<number> {
    return new Promise((resolve) => {
      chrome.storage.local.get(['limitra_count'], (result) => {
        const current = (result['limitra_count'] as number) ?? 0;
        const next = current + 1;
        chrome.storage.local.set({ limitra_count: next }, () => {
          resolve(next);
        });
      });
    });
  }
  async resetCount(): Promise<void> {
    await this.setCount(0);
  }

  async getTimeSpent(): Promise<number> {
    return (await this.driver.get<number>(TIME_SPENT_KEY)) ?? 0;
  }

  async setTimeSpent(ms: number): Promise<void> {
    await this.driver.set<number>(TIME_SPENT_KEY, ms);
  }

  async addTime(ms: number): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.get(['limitra_time_spent'], (result) => {
        const current = (result['limitra_time_spent'] as number) ?? 0;
        chrome.storage.local.set({ limitra_time_spent: current + ms }, () => {
          resolve();
        });
      });
    });
  }
}
