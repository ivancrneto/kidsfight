export class WebSocketManager {
  private static instance: WebSocketManager | null = null;
  private _ws: WebSocket | null = null;
  private _isHost: boolean = false;
  private _roomCode: string | null = null;
  private _onMessageCallback: ((event: MessageEvent) => void) | null = null;
  private _onOpenCallback: (() => void) | null = null;
  private _onCloseCallback: (() => void) | null = null;
  private _onErrorCallback: ((error: Event) => void) | null = null;
  private _isConnected: boolean = false;
  private _messageQueue: any[] = [];
  private _reconnectAttempts: number = 0;
  private _maxReconnectAttempts: number = 5;
  private _reconnectDelay: number = 1000;
  private _reconnectTimeout: NodeJS.Timeout | null = null;
  private _url: string = '';
  private _playerId: string = '';
  private _matchId: string = '';
  private _debugInstanceId: string = '';

  private constructor() {}

  public static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  public connect(url: string, roomCode: string): void {
    this._url = url;
    this._roomCode = roomCode;
    this._isConnected = true;
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
      console.warn('WebSocket not connected, message queued');
      this._messageQueue.push(message);
      return;
    }
    // Simulate message handling
    if (this._onMessageCallback) {
      this._onMessageCallback({ data: JSON.stringify(message) } as MessageEvent);
    }
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
      this._onMessageCallback({ data: JSON.stringify(message) } as MessageEvent);
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
    this._playerId = '';
    this._matchId = '';
    this._debugInstanceId = '';
  }
}

export const wsManager = WebSocketManager.getInstance();

export default WebSocketManager;
