import { MessageBus, MessageListener } from '../../core/interfaces/message-bus';
import { ExtensionMessage } from '../../types';

export class ChromeMessageBus implements MessageBus {
  private listenerMap = new WeakMap<
    MessageListener,
    (
      message: unknown,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: unknown) => void,
    ) => void
  >();

  public async sendMessage(message: ExtensionMessage): Promise<void> {
    try {
      await chrome.runtime.sendMessage(message);
    } catch (error) {
      console.warn('[ChromeMessageBus] Failed to send message:', error);
    }
  }

  public onMessage(listener: MessageListener): void {
    const wrapper = (
      message: unknown,
      sender: chrome.runtime.MessageSender,
      _sendResponse: (response?: unknown) => void,
    ) => {
      listener(message as ExtensionMessage, { isTab: !!sender.tab });
    };

    this.listenerMap.set(listener, wrapper);
    chrome.runtime.onMessage.addListener(wrapper);
  }

  public removeListener(listener: MessageListener): void {
    const wrapper = this.listenerMap.get(listener);
    if (wrapper) {
      chrome.runtime.onMessage.removeListener(wrapper);
      this.listenerMap.delete(listener);
    }
  }
}
