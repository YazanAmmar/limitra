import { ExtensionMessage } from '../../types';

export interface MessageContext {
  isTab: boolean;
}

export type MessageListener = (message: ExtensionMessage, context: MessageContext) => void;

export interface MessageBus {
  sendMessage(message: ExtensionMessage): Promise<void>;
  onMessage(listener: MessageListener): void;
  removeListener(listener: MessageListener): void;
}
