// Mock implementation of WebSocketManager
export class WebSocketManager {
  private static instance: WebSocketManager | null = null;
  private _isConnected: boolean = false;
  private _roomCode: string | null = null;
  private _onMessageCallback: ((event: MessageEvent) => void) | null = null;
  private _onOpenCallback: (() => void) | null = null;
  private _onCloseCallback: (() => void) | null = null;
  private _onErrorCallback: ((error: Event) => void) | null = null;
  private _messageQueue: any[] = [];
  private _playerId: string = 'test-player-id';
  private _matchId: string = 'test-match-id';
  private _debugInstanceId: string = 'test-debug-id';

  private constructor() {}

  public static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  public connect(url: string, roomCode: string): void {
    this._isConnected = true;
    this._roomCode = roomCode;
    if (this._onOpenCallback) {
      this._onOpenCallback();
    }
  }

  public disconnect(): void {
    this._isConnected = false;
    if (this._onCloseCallback) {
      this._onCloseCallback();
    }
  }

  public send(message: any): void {
    if (!this._isConnected) {
      this._messageQueue.push(message);
      return;
    }
    // In tests, we'll just log the message
    console.log('WebSocket message sent:', message);
  }

  public onMessage(callback: (event: MessageEvent) => void): void {
    this._onMessageCallback = callback;
  }

  public onOpen(callback: () => void): void {
    this._onOpenCallback = callback;
  }

  public onClose(callback: () => void): void {
    this._onCloseCallback = callback;
  }

  public onError(callback: (error: Event) => void): void {
    this._onErrorCallback = callback;
  }

  public isConnected(): boolean {
    return this._isConnected;
  }
  public getRoomCode(): string | null {
    return this._roomCode;
  }
  public getPlayerId(): string {
    return this._playerId;
  }
  public getMatchId(): string {
    return this._matchId;
  }

  // Test helper methods
  public _simulateMessage(message: any): void {
    if (this._onMessageCallback) {
      const event = { data: JSON.stringify(message) } as MessageEvent;
      this._onMessageCallback(event);
    }
  }

  public _simulateOpen(): void {
    if (this._onOpenCallback) {
      this._onOpenCallback();
    }
  }

  public _simulateClose(): void {
    if (this._onCloseCallback) {
      this._onCloseCallback();
    }
  }

  public _simulateError(error: Event): void {
    if (this._onErrorCallback) {
      this._onErrorCallback(error);
    }
  }

  public _reset(): void {
    this._isConnected = false;
    this._messageQueue = [];
    this._onMessageCallback = null;
    this._onOpenCallback = null;
    this._onCloseCallback = null;
    this._onErrorCallback = null;
    this._roomCode = null;
  }
}

// Create and export the singleton instance
export const wsManager = WebSocketManager.getInstance();

// No default export, only named exports to match the import in kidsfight_scene.ts
