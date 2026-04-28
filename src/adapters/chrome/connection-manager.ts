import { ConnectionManager } from '../../core/interfaces/connection-manager';

export class ChromeConnectionManager implements ConnectionManager {
  public connect(name: string): void {
    chrome.runtime.connect({ name });
  }
}
