import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BackgroundOrchestrator } from '../src/core/background-orchestrator';
import { AlarmManager } from '../src/core/interfaces/alarm-manager';
import { TabManager } from '../src/core/interfaces/tab-manager';
import { MessageBus } from '../src/core/interfaces/message-bus';
import { StorageFacade } from '../src/core/storage/index';

describe('BackgroundOrchestrator', () => {
  const mockAlarmManager: AlarmManager = { create: vi.fn(), clear: vi.fn(), onAlarm: vi.fn() };
  const mockTabManager: TabManager = { sendMessageToPattern: vi.fn(), hasActiveTabs: vi.fn() };
  const mockMessageBus: MessageBus = {
    sendMessage: vi.fn(),
    onMessage: vi.fn(),
    removeListener: vi.fn(),
  };

  const mockStorage = {
    onChange: vi.fn(),
  } as unknown as StorageFacade;

  let orchestrator: BackgroundOrchestrator;

  beforeEach(() => {
    vi.clearAllMocks();
    orchestrator = new BackgroundOrchestrator(
      mockAlarmManager,
      mockTabManager,
      mockMessageBus,
      mockStorage,
    );
  });

  it('should initialize listeners correctly', () => {
    orchestrator.init();
    expect(mockMessageBus.onMessage).toHaveBeenCalled();
    expect(mockAlarmManager.onAlarm).toHaveBeenCalled();
    expect(mockStorage.onChange).toHaveBeenCalled();
  });
});
