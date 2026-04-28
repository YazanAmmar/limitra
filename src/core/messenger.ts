import { AppAction, ExtensionMessage } from '../types';
import { PlatformId } from '../types';
import { MessageBus } from './interfaces/message-bus';

export class Messenger {
  private onBlockCallback: () => void;
  private messageBus: MessageBus;
  private platformId: PlatformId;

  private messageListener = (message: ExtensionMessage) => {
    if (message && message.action === AppAction.BLOCK_NOW) {
      if (message.platform && message.platform !== this.platformId) {
        return;
      }
      console.warn('[Messenger] Received BLOCK_NOW from background for:', this.platformId);
      this.onBlockCallback();
    }
  };

  constructor(onBlock: () => void, messageBus: MessageBus, platformId: PlatformId) {
    this.onBlockCallback = onBlock;
    this.messageBus = messageBus;
    this.platformId = platformId;
  }

  public init() {
    this.messageBus.onMessage(this.messageListener);
    this.notifyActive();
  }

  public destroy() {
    this.messageBus.removeListener(this.messageListener);
  }

  public notifyActive() {
    void this.messageBus.sendMessage({ action: AppAction.TAB_ACTIVE, platform: this.platformId });
  }

  public notifyHidden() {
    void this.messageBus.sendMessage({ action: AppAction.TAB_HIDDEN, platform: this.platformId });
  }
}
