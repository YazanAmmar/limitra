import { AlarmManager } from '../../core/interfaces/alarm-manager';

export class ChromeAlarmManager implements AlarmManager {
  public create(name: string, delayInMinutes: number): void {
    void chrome.alarms.create(name, { delayInMinutes });
  }

  public async clear(name: string): Promise<void> {
    await chrome.alarms.clear(name);
  }

  public onAlarm(listener: (name: string) => void): void {
    chrome.alarms.onAlarm.addListener((alarm) => {
      listener(alarm.name);
    });
  }
}
