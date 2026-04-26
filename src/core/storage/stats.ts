import { StorageDriver } from './driver';
import { PlatformId } from '../../types';

export class StatsStorage {
  constructor(private driver: StorageDriver) {}

  async getCount(platform: PlatformId): Promise<number> {
    return (await this.driver.get<number>(`limitra_${platform}_count`)) ?? 0;
  }
  async setCount(platform: PlatformId, count: number): Promise<void> {
    await this.driver.set(`limitra_${platform}_count`, count);
  }
  async incrementCount(platform: PlatformId): Promise<void> {
    const count = await this.getCount(platform);
    await this.setCount(platform, count + 1);
  }
  async resetCount(platform: PlatformId): Promise<void> {
    await this.setCount(platform, 0);
  }
  async getTimeSpent(platform: PlatformId): Promise<number> {
    return (await this.driver.get<number>(`limitra_${platform}_time_spent`)) ?? 0;
  }
  async setTimeSpent(platform: PlatformId, ms: number): Promise<void> {
    await this.driver.set(`limitra_${platform}_time_spent`, ms);
  }
  async addTime(platform: PlatformId, ms: number): Promise<void> {
    const current = await this.getTimeSpent(platform);
    await this.setTimeSpent(platform, current + ms);
  }
}
