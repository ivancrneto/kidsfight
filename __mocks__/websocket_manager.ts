// Mock WebSocketManager for testing
class MockWebSocket {
  readyState: number = 1; // Ensure OPEN by default
  send = jest.fn(() => true);
  close = jest.fn();
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  private _listeners: { [key: string]: Function[] } = {
    open: [],
    message: [],
    close: [],
    error: []
  };
  private _lastMessageCallback: Function | null = null; // Track the last bound message callback


  constructor() {
    this.readyState = 1;
    this.send.mockClear();
    this.close.mockClear();
  }

  addEventListener(eventType: string, callback: Function) {
    if (!this._listeners[eventType]) {
      this._listeners[eventType] = [];
    }
    this._listeners[eventType].push(callback);
    console.log(`[MOCK WS] addEventListener: ${eventType}, cb:`, callback, 'listeners:', this._listeners[eventType]);
  }

  removeEventListener(eventType: string, callback: Function) {
    if (!this._listeners[eventType]) return;
    this._listeners[eventType] = this._listeners[eventType].filter((cb: Function) => cb !== callback);
    console.log(`[MOCK WS] removeEventListener: ${eventType}, cb:`, callback, 'listeners:', this._listeners[eventType]);
  }

  _trigger(eventType: string, data: any = {}) {
    if (eventType === 'open') {
      this.readyState = 1;
      const openEvent = new Event('open');
      console.log('[MOCK WS][DIAG] _trigger open: calling onopen?', !!this.onopen);
      if (this.onopen) this.onopen(openEvent);
      (this._listeners['open'] || []).forEach((cb: Function) => cb(openEvent));
    } else if (eventType === 'message') {
      let event = data;
      if (!(event instanceof MessageEvent)) {
        event = new MessageEvent('message', { data: data.data });
      }
      // Only call the last registered message callback
      if (this._listeners['message'] && this._listeners['message'].length > 0) {
        const lastCb = this._listeners['message'][this._listeners['message'].length - 1];
        console.log('[MOCK WS] _trigger: message, _lastMessageCallback:', lastCb);
        lastCb(event);
      }
      // (Removed: do not call all listeners)
    } else if (eventType === 'close') {
      this.readyState = 3;
      const closeEvent = new CloseEvent('close', {
        code: data?.code || 1000,
        reason: data?.reason || '',
        wasClean: true
      });
      if (this.onclose) this.onclose(closeEvent);
      (this._listeners['close'] || []).forEach((cb: Function) => cb(closeEvent));
    } else if (eventType === 'error') {
      const errorEvent = new Event('error');
      if (this.onerror) this.onerror(errorEvent);
      (this._listeners['error'] || []).forEach((cb: Function) => cb(errorEvent));
    }
  }

  resetMocks() {
    this.readyState = 1;
    this.send.mockClear();
    this.close.mockClear();
    this.onopen = null;
    this.onclose = null;
    this.onerror = null;
    this.onmessage = null;
    this._listeners = { open: [], message: [], close: [], error: [] };
  }
}

let mockWebSocket: MockWebSocket | null = null;

export { MockWebSocket, mockWebSocket };


export class WebSocketManager {
  private static instance: WebSocketManager | null = null;
  private _ws: any;
  private _isHost: boolean = false;
  private _debugInstanceId: string = 'test';
  private _roomCode: string | null = null;
  private _onMessageCallback: ((event: MessageEvent) => void) | null = null;
  private _onCloseCallback: ((event: CloseEvent) => void) | null = null;
  private _onErrorCallback: ((event: Event) => void) | null = null;
  private _webSocketFactory: (url: string) => any;

  constructor(webSocketFactory?: (url: string) => any) {
    if (WebSocketManager.instance) {
      return WebSocketManager.instance;
    }
    this._webSocketFactory = webSocketFactory || (() => new MockWebSocket());
    this._ws = this._webSocketFactory('ws://mock');
    if (this._ws instanceof MockWebSocket) {
      this._ws.resetMocks();
    }
    mockWebSocket = this._ws;
    WebSocketManager.instance = this;
  }

  public static getInstance(webSocketFactory?: (url: string) => any): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager(webSocketFactory);
    }
    return WebSocketManager.instance;
  }

  public static resetInstance(): void {
    if (mockWebSocket && typeof mockWebSocket.resetMocks === 'function') {
      mockWebSocket.resetMocks();
    }
    WebSocketManager.instance = null;
    mockWebSocket = null;
  }

  public connect(url?: string): Promise<any> {
    return Promise.resolve(this._ws);
  }

  private _boundMessageCallback: ((event: MessageEvent) => void) | null = null;

  public setMessageCallback(callback: (event: MessageEvent) => void): void {
    console.log('[MOCK WSM] setMessageCallback: Setting new callback', callback);
    this._onMessageCallback = callback;
    
    // Always attach the handler, regardless of connection state (for test robustness)
    if (this._ws) {
      // Remove previous event listener if it exists
      if (this._boundMessageCallback && typeof this._ws.removeEventListener === 'function') {
        console.log('[MOCK WSM] setMessageCallback: Removing previous callback', this._boundMessageCallback);
        this._ws.removeEventListener('message', this._boundMessageCallback);
      }
      
      // Create a new bound callback and store it for later removal
      this._boundMessageCallback = (event: MessageEvent) => {
        console.log('[MOCK WSM] _boundMessageCallback: Calling message callback');
        if (this._onMessageCallback) this._onMessageCallback(event);
      };
      
      // Set both onmessage and addEventListener for compatibility
      this._ws.onmessage = this._boundMessageCallback;
      
      if (typeof this._ws.addEventListener === 'function') {
        console.log('[MOCK WSM] setMessageCallback: Adding new callback', this._boundMessageCallback);
        this._ws.addEventListener('message', this._boundMessageCallback);
      }
    }
  }

  public onMessage(callback: (event: MessageEvent) => void): void {
    this.setMessageCallback(callback);
  }

  public onClose(callback: (event: CloseEvent) => void): void {
    this._onCloseCallback = callback;
    this._ws.onclose = (event: CloseEvent) => {
      if (this._onCloseCallback) this._onCloseCallback(event);
    };
  }

  public setErrorCallback(callback: (event: Event) => void): void {
    this._onErrorCallback = callback;
    this._ws.onerror = (event: Event) => {
      if (this._onErrorCallback) this._onErrorCallback(event);
    };
  }

  public setHost(isHost: boolean): void {
    this._isHost = isHost;
  }

  public setRoomCode(code: string): void {
    this._roomCode = code;
  }

  public getRoomCode(): string | null {
    return this._roomCode;
  }

  public setMockWebSocket(ws: any) {
    this._ws = ws;
    mockWebSocket = ws;
  }

  public setConnected(connected: boolean) {
    this._ws = this._ws || {};
    this._ws.readyState = connected ? 1 : 0;
    mockWebSocket = this._ws;
  }

  public isConnected(): boolean {
    return this._ws && this._ws.readyState === 1;
  }

  public send(message: any): boolean {
    if (!this.isConnected()) return false;
    try {
      const msgStr = JSON.stringify(message);
      if (mockWebSocket && typeof mockWebSocket.send === 'function') {
        mockWebSocket.send(msgStr);
      }
      return true;
    } catch (e) {
      if (typeof console !== 'undefined' && console.error) {
        if (message && message.type === 'position_update') {
          console.error('[WSM] Error sending position update:', e);
        } else {
          console.error('[WSM] Error sending message:', e);
        }
      }
      return false;
    }
  }

  public sendPositionUpdate(playerIndex: number, x: number, y: number, velocityX = 0, velocityY = 0, flipX = false, frame?: number, cause?: string): boolean {
    if (typeof x !== 'number' || typeof y !== 'number' || typeof velocityX !== 'number' || typeof velocityY !== 'number') return false;
    try {
      return this.send({ type: 'position_update', playerIndex, x, y, velocityX, velocityY, flipX, frame, timestamp: Date.now(), ...(cause ? { cause } : {}) });
    } catch (e) {
      console.error('[WSM] Error sending position update:', { playerIndex, x, y, velocityX, velocityY, flipX, frame, cause }, e);
      return false;
    }
  }

  public sendHealthUpdate(playerIndex: number, health: number): boolean {
    try {
      return this.send({ type: 'health_update', playerIndex, health, timestamp: Date.now() });
    } catch (e) {
      return false;
    }
  }

  public sendReplayRequest(matchId: string, playerId: string, data?: Record<string, any>): boolean {
    try {
      return this.send({ type: 'replay_request', matchId, playerId, ...(data || {}), timestamp: Date.now() });
    } catch (e) {
      return false;
    }
  }

  public sendReplayResponse(matchId: string, accepted: boolean, data?: Record<string, any>): boolean {
    try {
      return this.send({ type: 'replay_response', matchId, accepted, ...(data || {}), timestamp: Date.now() });
    } catch (e) {
      return false;
    }
  }

  public sendGameAction(action: string, data: Record<string, any> = {}): boolean {
    try {
      // Mimic real logic: convert x and y to numbers if present
      const cleanData = { ...data };
      if ('x' in cleanData) cleanData.x = Number(cleanData.x);
      if ('y' in cleanData) cleanData.y = Number(cleanData.y);
      return this.send({ type: 'game_action', action, ...cleanData, timestamp: Date.now() });
    } catch (e) {
      return false;
    }
  }

  public disconnect(code?: number, reason?: string): void {
    this._ws.readyState = 3; // WebSocket.CLOSED
    if (this._ws.onclose) {
      this._ws.onclose({ code, reason } as CloseEvent);
    }
  }

  public simulateMessage(data: any): void {
    if (this._onMessageCallback) {
      this._onMessageCallback({ data: JSON.stringify(data) } as MessageEvent);
    }
  }

  public simulateError(event: Event): void {
    if (this._onErrorCallback) {
      this._onErrorCallback(event);
    }
  }

  public simulateClose(event: CloseEvent): void {
    if (this._onCloseCallback) {
      this._onCloseCallback(event);
    }
  }
}

export default WebSocketManager;
