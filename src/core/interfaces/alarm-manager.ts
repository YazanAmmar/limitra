export interface AlarmManager {
  create(name: string, delayInMinutes: number): void;
  clear(name: string): Promise<void>;
  onAlarm(listener: (name: string) => void): void;
}
