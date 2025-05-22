// Mock WebSocketManager for testing
export class WebSocketManager {
  private static instance: WebSocketManager | null = null;
  private _ws: any = {
    readyState: 1, // WebSocket.OPEN
    send: jest.fn(),
    close: jest.fn(),
    onopen: null,
    onclose: null,
    onerror: null,
    onmessage: null
  };
  private _isHost: boolean = false;
  private _debugInstanceId: string = 'test';
  private _roomCode: string | null = null;
  private _onMessageCallback: ((event: MessageEvent) => void) | null = null;
  private _onCloseCallback: ((event: CloseEvent) => void) | null = null;
  private _onErrorCallback: ((event: Event) => void) | null = null;
  private _webSocketFactory: (url: string) => any = () => this._ws;
  
  // Mock for setMessageCallback
  public setMessageCallback(callback: (event: MessageEvent) => void): void {
    this._onMessageCallback = callback;
    this._ws.onmessage = (event: MessageEvent) => {
      if (this._onMessageCallback) {
        this._onMessageCallback(event);
      }
    };
  }

  constructor(webSocketFactory?: (url: string) => any) {
    if (WebSocketManager.instance) {
      return WebSocketManager.instance;
    }
    if (webSocketFactory) {
      this._webSocketFactory = webSocketFactory;
    }
    WebSocketManager.instance = this;
  }

  public static getInstance(webSocketFactory?: (url: string) => any): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager(webSocketFactory);
    }
    return WebSocketManager.instance;
  }

  public static resetInstance(): void {
    WebSocketManager.instance = null;
  }

  public connect(url?: string, roomCode?: string): any {
    this._ws.readyState = 1; // WebSocket.OPEN
    if (this._ws.onopen) {
      this._ws.onopen(new Event('open'));
    }
    return this._ws;
  }

  public disconnect(code?: number, reason?: string): void {
    this._ws.readyState = 3; // WebSocket.CLOSED
    if (this._ws.onclose) {
      this._ws.onclose(new CloseEvent('close', { code, reason }));
    }
  }

  public isConnected(): boolean {
    return this._ws.readyState === 1; // WebSocket.OPEN
  }

  public send(message: any): boolean {
    if (this.isConnected()) {
      this._ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  public onMessage(callback: (event: MessageEvent) => void): void {
    this._onMessageCallback = callback;
  }

  public onClose(callback: (event: CloseEvent) => void): void {
    this._onCloseCallback = callback;
  }

  public onError(callback: (event: Event) => void): void {
    this._onErrorCallback = callback;
  }

  public setHost(isHost: boolean): void {
    this._isHost = isHost;
  }

  public setRoomCode(roomCode: string): void {
    this._roomCode = roomCode;
  }

  public getRoomCode(): string | null {
    return this._roomCode;
  }

  // Mock helper methods for testing
  public simulateMessage(data: any): void {
    if (this._onMessageCallback) {
      this._onMessageCallback({ data: JSON.stringify(data) } as MessageEvent);
    }
  }

  public simulateError(error: Event): void {
    if (this._onErrorCallback) {
      this._onErrorCallback(error);
    }
  }

  public simulateClose(closeEvent: CloseEvent): void {
    if (this._onCloseCallback) {
      this._onCloseCallback(closeEvent);
    }
  }
}

export default WebSocketManager;
