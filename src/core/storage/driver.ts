export interface StorageChange {
  newValue?: unknown;
  oldValue?: unknown;
}

export type StorageChangeListener = (changes: Record<string, StorageChange>) => void;

export interface StorageDriver {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  onChange(listener: StorageChangeListener): void;
  removeListener(listener: StorageChangeListener): void;
}
