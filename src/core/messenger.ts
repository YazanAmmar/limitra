import { AppAction, ExtensionMessage } from '../types';
import { MessageBus } from './interfaces/message-bus';

export class Messenger {
  private onBlockCallback: () => void;
  private messageBus: MessageBus;

  private messageListener = (message: ExtensionMessage) => {
    if (message && message.action === AppAction.BLOCK_NOW) {
      console.warn('[Messenger] Received BLOCK_NOW from background');
      this.onBlockCallback();
    }
  };

  constructor(onBlock: () => void, messageBus: MessageBus) {
    this.onBlockCallback = onBlock;
    this.messageBus = messageBus;
  }

  public init() {
    this.messageBus.onMessage(this.messageListener);
    this.notifyActive();
  }

  public destroy() {
    this.messageBus.removeListener(this.messageListener);
  }

  public notifyActive() {
    void this.messageBus.sendMessage({ action: AppAction.TAB_ACTIVE });
  }

  public notifyHidden() {
    void this.messageBus.sendMessage({ action: AppAction.TAB_HIDDEN });
  }
}
