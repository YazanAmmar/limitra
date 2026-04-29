import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { AppOrchestrator } from '../src/app/orchestrator';
import { PlatformAdapter } from '../src/core/interfaces/platform-adapter';
import { MessageBus } from '../src/core/interfaces/message-bus';
import { ConnectionManager } from '../src/core/interfaces/connection-manager';
import { StorageFacade } from '../src/core/storage/index';
import { PlatformId } from '../src/types';

vi.mock('../src/ui/overlay/controller', () => ({
  showOverlay: vi.fn(),
  initOverlayListeners: vi.fn(),
}));

vi.stubGlobal('window', {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  getComputedStyle: vi.fn().mockReturnValue({
    display: 'block',
    visibility: 'visible',
    opacity: '1',
  }),
  setInterval: vi.fn().mockReturnValue(123),
  clearInterval: vi.fn(),
});

vi.stubGlobal('document', {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  getElementById: vi.fn().mockReturnValue(null),
  body: { classList: { remove: vi.fn(), add: vi.fn() } },
  hidden: false,
});

describe('AppOrchestrator Logic', () => {
  let mockAdapter: PlatformAdapter;
  let mockMessageBus: MessageBus;
  let mockConnectionManager: ConnectionManager;
  let mockStorage: Record<string, Mock>;

  beforeEach(() => {
    mockAdapter = {
      id: 'youtube_shorts' as PlatformId,
      name: 'Mock Platform',
      isCurrentPlatform: vi.fn().mockReturnValue(true),
      observe: vi.fn(),
      disconnect: vi.fn(),
      executePunishment: vi.fn(),
      isVideoPlaying: vi.fn().mockReturnValue(true),
    };

    mockMessageBus = { sendMessage: vi.fn(), onMessage: vi.fn(), removeListener: vi.fn() };
    mockConnectionManager = { connect: vi.fn() };

    mockStorage = {
      getLimit: vi.fn().mockResolvedValue(5),
      getEnableLimit: vi.fn().mockResolvedValue(true),
      getTimeLimit: vi.fn().mockResolvedValue(10),
      getEnableTime: vi.fn().mockResolvedValue(true),
      getTimeSpent: vi.fn().mockResolvedValue(0),
      getCount: vi.fn().mockResolvedValue(0),
      isCurrentlyBlocked: vi.fn().mockResolvedValue(false),
      detectBypass: vi.fn().mockResolvedValue(false),
      onChange: vi.fn(),
      removeListener: vi.fn(),
      ensureSession: vi.fn().mockResolvedValue(false),
      incrementCount: vi.fn().mockResolvedValue(undefined),
    };
  });

  it('should initialize and NOT execute punishment if under limits', async () => {
    const orchestrator = new AppOrchestrator(
      mockAdapter,
      mockMessageBus,
      mockConnectionManager,
      mockStorage as unknown as StorageFacade,
    );
    await orchestrator.start();

    expect(mockStorage.getLimit).toHaveBeenCalledWith('youtube_shorts');
    expect(mockAdapter.executePunishment).not.toHaveBeenCalled();
  });

  it('should execute punishment immediately if bypass is detected on initial check', async () => {
    mockStorage.detectBypass.mockResolvedValue(true);
    mockStorage.isCurrentlyBlocked.mockResolvedValue(true);

    const orchestrator = new AppOrchestrator(
      mockAdapter,
      mockMessageBus,
      mockConnectionManager,
      mockStorage as unknown as StorageFacade,
    );
    await orchestrator.start();

    expect(mockAdapter.executePunishment).toHaveBeenCalled();
  });

  it('should block immediately if count >= limit on start', async () => {
    mockStorage.getCount.mockResolvedValue(5);
    mockStorage.isCurrentlyBlocked.mockResolvedValue(true);

    const orchestrator = new AppOrchestrator(
      mockAdapter,
      mockMessageBus,
      mockConnectionManager,
      mockStorage as unknown as StorageFacade,
    );
    await orchestrator.start();

    expect(mockAdapter.executePunishment).toHaveBeenCalled();
  });

  it('should block immediately if time spent >= time limit on start', async () => {
    mockStorage.getTimeSpent.mockResolvedValue(600_000);
    mockStorage.isCurrentlyBlocked.mockResolvedValue(true);

    const orchestrator = new AppOrchestrator(
      mockAdapter,
      mockMessageBus,
      mockConnectionManager,
      mockStorage as unknown as StorageFacade,
    );
    await orchestrator.start();

    expect(mockAdapter.executePunishment).toHaveBeenCalled();
  });

  it('should clean up all listeners and modules on destroy', async () => {
    const orchestrator = new AppOrchestrator(
      mockAdapter,
      mockMessageBus,
      mockConnectionManager,
      mockStorage as unknown as StorageFacade,
    );
    await orchestrator.start();

    orchestrator.destroy();

    expect(mockStorage.removeListener).toHaveBeenCalled();
    expect(mockAdapter.disconnect).toHaveBeenCalled();
    expect(mockMessageBus.removeListener).toHaveBeenCalled();
  });
});
