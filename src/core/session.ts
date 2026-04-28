import { StorageFacade } from './storage/index';
import { Messenger } from './messenger';
import { PlatformAdapter } from '../types';
import { ConnectionManager } from './interfaces/connection-manager';

export class SessionManager {
  private messenger: Messenger;
  private adapter: PlatformAdapter;
  private lastActivityTime = Date.now();
  private lastHeartbeat = Date.now();
  private lastSyncTime = Date.now();
  private isTracking = false;
  private isBlocked = false;
  private heartbeatId: ReturnType<typeof window.setInterval> | null = null;
  private connectionManager: ConnectionManager;

  constructor(
    messenger: Messenger,
    adapter: PlatformAdapter,
    connectionManager: ConnectionManager,
    private storage: StorageFacade,
  ) {
    this.messenger = messenger;
    this.adapter = adapter;
    this.connectionManager = connectionManager;
  }

  public async init() {
    await this.storage.ensureSession();
    this.setupActivityListeners();
    this.observeVisibility();
    this.startHeartbeat();
    this.setupUnloadHandler();
  }

  public async blockSession() {
    this.isBlocked = true;
    if (this.heartbeatId !== null) {
      window.clearInterval(this.heartbeatId);
      this.heartbeatId = null;
    }
    await this.stopTracking();
  }

  private setupActivityListeners() {
    ['mousemove', 'keydown', 'scroll', 'click'].forEach((event) => {
      window.addEventListener(
        event,
        () => {
          this.lastActivityTime = Date.now();
        },
        { passive: true },
      );
    });
  }

  private async startTracking() {
    if (this.isBlocked) return;
    if (!this.isTracking) {
      await this.storage.startSession(this.adapter.id);
      this.isTracking = true;
      this.messenger.notifyActive();
    }
  }

  private async stopTracking() {
    if (this.isTracking) {
      await this.storage.endSession(this.adapter.id);
      this.isTracking = false;
      this.messenger.notifyHidden();
    }
  }

  private startHeartbeat() {
    this.heartbeatId = window.setInterval(async () => {
      if (this.isBlocked) return;
      await this.storage.ensureSession();

      const now = Date.now();

      if (now - this.lastHeartbeat > 5000 && this.isTracking) {
        console.warn('[Limitra] Sleep detected. Erasing time gap.');
        await this.storage.startSession(this.adapter.id);
        this.lastHeartbeat = now;
        this.lastSyncTime = now;
        return;
      }

      this.lastHeartbeat = now;

      if (this.isTracking && now - this.lastSyncTime >= 10000) {
        await this.storage.endSession(this.adapter.id);
        await this.storage.startSession(this.adapter.id);
        this.lastSyncTime = now;
      }

      if (document.hidden) return;

      const isTimeEnabled = await this.storage.getEnableTime(this.adapter.id);
      const timeLimit = await this.storage.getTimeLimit(this.adapter.id);

      if (!isTimeEnabled || timeLimit <= 0) {
        await this.stopTracking();
        return;
      }

      const mode = await this.storage.getTrackingMode();
      const isPlaying = this.adapter.isVideoPlaying();
      const isIdle = now - this.lastActivityTime > 10000;

      let shouldTrack = false;
      if (mode === 'strict') shouldTrack = true;
      else if (mode === 'playing_only') shouldTrack = isPlaying;
      else if (mode === 'smart') shouldTrack = isPlaying || !isIdle;

      if (shouldTrack) await this.startTracking();
      else await this.stopTracking();
    }, 2000);
  }

  private observeVisibility() {
    document.addEventListener('visibilitychange', async () => {
      if (this.isBlocked) return;
      if (document.hidden) await this.stopTracking();
      else this.lastActivityTime = Date.now();
    });
  }

  private setupUnloadHandler() {
    this.connectionManager.connect('limitra-session');
  }
}
