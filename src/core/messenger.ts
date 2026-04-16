import { AppAction, ExtensionMessage } from '../types';

export class Messenger {
  private onBlockCallback: () => void;

  private messageListener = (
    message: unknown,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void,
  ) => {
    const extMessage = message as ExtensionMessage;

    if (extMessage && extMessage.action === AppAction.PING) {
      sendResponse({ status: 'ALIVE' });
      return;
    }

    if (extMessage && extMessage.action === AppAction.BLOCK_NOW) {
      console.warn('[Messenger] Received BLOCK_NOW from background');
      this.onBlockCallback();
    }
  };

  constructor(onBlock: () => void) {
    this.onBlockCallback = onBlock;
  }

  public init() {
    this.listenToBackground();
    this.notifyActive();
  }

  public destroy() {
    chrome.runtime.onMessage.removeListener(this.messageListener);
  }

  public notifyActive() {
    void chrome.runtime.sendMessage({ action: AppAction.TAB_ACTIVE });
  }

  public notifyHidden() {
    void chrome.runtime.sendMessage({ action: AppAction.TAB_HIDDEN });
  }

  private listenToBackground() {
    chrome.runtime.onMessage.addListener(this.messageListener);
  }
}
