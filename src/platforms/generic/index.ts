import { PlatformAdapter, ItemChangeCallback } from '../../core/interfaces/platform-adapter';
import { PlatformId } from '../../types';

export class GenericAdapter implements PlatformAdapter {
  public readonly id: PlatformId = 'global';
  public name = 'Generic Website';

  public isCurrentPlatform(_url: string): boolean {
    return false;
  }

  public observe(_onItemChange: ItemChangeCallback): void {
    console.warn('[GenericAdapter] Observing generic page. Relying on session timer.');
  }

  public disconnect(): void {}

  public executePunishment(): void {
    document.body.classList.add('limitra-global-punishment');
  }

  public isVideoPlaying(): boolean {
    return true;
  }
}
