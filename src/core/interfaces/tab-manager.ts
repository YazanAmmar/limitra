import { ExtensionMessage } from '../../types';

export interface TabManager {
  sendMessageToPattern(urlPatterns: string[], message: ExtensionMessage): Promise<void>;
  hasActiveTabs(urlPatterns: string[]): Promise<boolean>;
}
