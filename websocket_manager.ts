import { DEV } from './globals';

export interface WebSocketMessage {
  type: 'game_action' | 'replay_request' | 'replay_response' | 'health_update' | 'position_update' | string;
  action?: string;
  data?: any;
  roomCode?: string;
  matchId?: string;
  playerId?: string;
  playerIndex?: number;
  accepted?: boolean;
  health?: number;
  x?: number;
  y?: number;
  velocityX?: number;
  velocityY?: number;
  flipX?: boolean;
  frame?: number;
  timestamp?: number;
  cause?: string; // <-- NEW: allow sending cause
  animation?: string; // <-- NEW: allow sending animation
  [key: string]: any; // For any additional dynamic properties
}

export type WebSocketFactory = (url: string) => WebSocket;

// Returns the correct WebSocket URL for the current environment
export function getWebSocketUrl(): string {
  // Prefer browser-based detection
  if (typeof window !== 'undefined' && window.location) {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocal) return 'ws://localhost:8081';
    return 'wss://kidsfight-ws.onrender.com';
  }
  // Fallback for Node/test environments
  if (process.env.NODE_ENV === 'production' || !(typeof DEV === 'undefined' ? false : DEV)) {
    return 'wss://kidsfight-ws.onrender.com';
  }
  return 'ws://localhost:8081';
}

class WebSocketManager {

  public get isHost(): boolean {
    return this._isHost;
  }
  private static instance: WebSocketManager | null = null;
  private _ws: WebSocket | null = null;
  private _isHost: boolean = false;
  private _debugInstanceId: string = Math.random().toString(36).substr(2, 6);
  private _roomCode: string | null = null;
  private _onMessageCallback: ((event: MessageEvent) => void) | null = null;
  private _messageCallbackId: number = 0;
  private _currentCallbackId: number = 0;
  private _onCloseCallback: ((event: CloseEvent) => void) | null = null;
  private _onErrorCallback: ((event: Event) => void) | null = null;
  private _onConnectionCallback: ((isConnected: boolean) => void) | null = null;
  private _boundMessageCallback: ((event: MessageEvent) => void) | null = null;
  private _webSocketFactory: (url: string) => WebSocket;

  private constructor(webSocketFactory?: (url: string) => WebSocket) {
    this._webSocketFactory = webSocketFactory || ((url: string) => new WebSocket(url));
    console.log(`[WSM] WebSocketManager instance created [${this._debugInstanceId}]`);
  }

  public static getInstance(webSocketFactory?: (url: string) => WebSocket): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager(webSocketFactory);
    }
    return WebSocketManager.instance;
  }

  public static resetInstance(): void {
    if (WebSocketManager.instance) {
      WebSocketManager.instance.disconnect();
    }
    WebSocketManager.instance = null;
  }

  public setHost(isHost: boolean): void {
    this._isHost = isHost;
    this.send({ type: 'host_status', isHost });
  }

  public setRoomCode(roomCode: string): void {
    this._roomCode = roomCode;
    this.send({ type: 'room_code', roomCode });
  }

  public getRoomCode(): string | null {
    return this._roomCode;
  }

  /**
   * Connect to the WebSocket server. Uses Render in production, localhost in development.
   * @param url Optional override URL (used for testing or custom endpoints)
   */
  public async connect(url?: string, roomCode?: string): Promise<WebSocket> {
    console.log('[WSM][DIAG] connect() called', { url, roomCode });
    // Use Render in production, localhost in development
    let wsUrl = url;
    if (!wsUrl) {
      wsUrl = getWebSocketUrl();
    }
    if (this._ws) {
      console.warn(`[WSM] WebSocket already connected [${this._debugInstanceId}]`);
      return Promise.resolve(this._ws);
    }
    
    return new Promise((resolve, reject) => {
      try {
        this._isHost = false;
        this._ws = this._webSocketFactory(url!);
        console.log('[WSM][DIAG] _ws created', { ws: !!this._ws, url: this._ws?.url });
        
        // Set up event handlers
        this._ws.onopen = () => {
          console.log('[WSM][DIAG] _ws.onopen called');
          console.log(`[WSM] Connected to server [${this._debugInstanceId}]`);
          this._onConnectionCallback?.(true);
          if (this._onMessageCallback) {
            this._boundMessageCallback = (e: MessageEvent) => {
              console.warn(`[WSM] _boundMessageCallback (connect) INVOKED. Current callback ID: ${this._currentCallbackId}`);
              console.log('[WSM] Raw message event:', e.data);
              try {
                // Parse the message data if it's a string
                let parsedData = e.data;
                if (typeof e.data === 'string') {
                  try {
                    parsedData = JSON.parse(e.data);
                  } catch (parseError) {
                    // If it's not JSON, keep it as is
                    parsedData = e.data;
                  }
                }
                this._onMessageCallback?.({ ...e, data: parsedData });
              } catch (error) {
                console.error('[WSM] Error processing message:', error);
              }
            };
            this._ws?.addEventListener('message', this._boundMessageCallback);
            console.log('[WSM] Message event listener registered', { ws: !!this._ws, callback: !!this._boundMessageCallback });
          }
          // Add LOGGING to all incoming messages
          if (this._ws) {
            this._ws.addEventListener('message', (event) => {
              try {
                const msg = JSON.parse(event.data);
                console.log('[WSM][RECV]', msg);
              } catch (e) {
                console.error('[WSM][RECV][ERROR]', event.data, e);
              }
            });
          }
          resolve(this._ws!);
        };

        this._ws.onclose = (event: CloseEvent) => {
          console.log(`[WSM] Disconnected from server [${this._debugInstanceId}]`, event);
          if (this._boundMessageCallback) {
            this._ws?.removeEventListener('message', this._boundMessageCallback);
            this._boundMessageCallback = null;
          }
          // Only null out after cleanup to ensure isConnected() works during cleanup
          const wasConnected = this.isConnected();
          this._ws = null;
          // Only trigger close callback if we were actually connected
          if (wasConnected) {
            this._onCloseCallback?.(event);
          }
          this._onConnectionCallback?.(false);
        };

        this._ws.onerror = (error: Event) => {
          console.error(`[WSM] WebSocket error [${this._debugInstanceId}]:`, error);
          console.log('[WSM][DIAG] connect() onerror');
          this._onErrorCallback?.(error);
          reject(error);
        };
      } catch (error) {
        console.error('[WSM][DIAG] connect() threw', error);
        reject(error);
      }
    });
  }

  public disconnect(code?: number, reason?: string): void {
    if (this._ws) {
      try {
        if (this._boundMessageCallback) {
          this._ws.removeEventListener('message', this._boundMessageCallback);
          this._boundMessageCallback = null;
        }
        this._ws.close(code, reason);
      } catch (error) {
        console.error('[WSM] Error during disconnect:', error);
      } finally {
        this._ws = null;
      }
    }
  }

  public isConnected(): boolean {
    return !!this._ws && this._ws.readyState === WebSocket.OPEN;
  }

  public send(message: any): boolean {
    if (this._ws && this._ws.readyState === WebSocket.OPEN) {
      console.log('[WSM] Sending message, type:', typeof message, 'content:', message);
      const msgToSend = typeof message === 'string' ? message : JSON.stringify(message);
      console.log('[WSM] Stringified message to send:', msgToSend);
      this._ws.send(msgToSend);
      // Log human-readable message
      if (typeof message === 'string') {
        try {
          console.log('[WSM] Message sent:', JSON.parse(message));
        } catch {
          console.log('[WSM] Message sent:', message);
        }
      } else {
        console.log('[WSM] Message sent:', message);
      }
      return true;
    }
    console.log('[WSM] Cannot send message - not connected, readyState:', this._ws?.readyState);
    return false;
  }

  public sendGameAction(action: string, data: Record<string, any> = {}): boolean {
    if (!this.isConnected()) {
      console.error('[WSM] Cannot send game action - not connected');
      return false;
    }
    
    try {
      // Create a clean data object to avoid modifying the original
      const cleanData = { ...data };
      
      // Ensure x and y are numbers if they exist
      if ('x' in cleanData) cleanData.x = Number(cleanData.x);
      if ('y' in cleanData) cleanData.y = Number(cleanData.y);
      
      const message: WebSocketMessage = {
        type: 'game_action',
        action,
        ...cleanData,
        timestamp: Date.now()
      };
      
      console.log('[WSM] Sent game action:', message);
      return this.send(message);
    } catch (error) {
      console.error('[WSM] Error sending game action:', error);
      return false;
    }
  }

  public sendReplayRequest(matchId: string, playerId: string, data?: Record<string, any>): boolean {
    if (!this.isConnected()) {
      console.error('[WSM] Cannot send replay request - not connected');
      return false;
    }

    try {
      const message: WebSocketMessage = {
        type: 'replay_request',
        matchId,
        playerId,
        ...data, // Spread any additional data
        timestamp: Date.now()
      };
      
      const messageString = JSON.stringify(message);
      this._ws!.send(messageString);
      console.log('[WSM] Sent replay request:', message);
      return true;
    } catch (error) {
      console.error('[WSM] Error sending replay request:', error);
      return false;
    }
  }

  public sendReplayResponse(matchId: string, accepted: boolean, data?: Record<string, any>): boolean {
    if (!this.isConnected()) {
      console.error('[WSM] Cannot send replay response - not connected');
      return false;
    }

    try {
      const message: WebSocketMessage = {
        type: 'replay_response',
        matchId,
        accepted,
        ...data, // Spread any additional data
        timestamp: Date.now()
      };
      
      const messageString = JSON.stringify(message);
      this._ws!.send(messageString);
      console.log('[WSM] Sent replay response:', message);
      return true;
    } catch (error) {
      console.error('[WSM] Error sending replay response:', error);
      return false;
    }
  }

  public onMessage(callback: (event: MessageEvent) => void): void {
    this._messageCallbackId++;
    const cbId = this._messageCallbackId;
    console.warn(`[WSM] onMessage() called. Assigning callback ID: ${cbId}`);
    console.warn(`[WSM] onMessage() stack trace:`, new Error().stack);

    // Remove existing message listener if it exists
    if (this._boundMessageCallback) {
      this._ws?.removeEventListener('message', this._boundMessageCallback);
    }

    this._onMessageCallback = callback;

    // If WebSocket is already connected, set up the new listener
    if (this.isConnected()) {
      this._boundMessageCallback = (e: MessageEvent) => this._onMessageCallback?.(e);
      this._ws!.addEventListener('message', this._boundMessageCallback);
    }
  }

  public setMessageCallback(callback: ((event: MessageEvent) => void) | null): void {
    this._onMessageCallback = callback;
    if (this._ws && this.isConnected()) {
      if (this._boundMessageCallback) {
        this._ws.removeEventListener('message', this._boundMessageCallback);
      }
      this._boundMessageCallback = (e: MessageEvent) => this._onMessageCallback?.(e);
      this._ws.addEventListener('message', this._boundMessageCallback);
    }
  }

  public onClose(callback: (event: CloseEvent) => void): void {
    this._onCloseCallback = callback;
  }

  public setErrorCallback(callback: (event: Event) => void): void {
    this._onErrorCallback = callback;
  }

  public setConnectionCallback(callback: (isConnected: boolean) => void): void {
    this._onConnectionCallback = callback;
  }

  public sendHealthUpdate(playerIndex: number, health: number): boolean {
    if (!this.isConnected()) {
      console.error('[WSM] Cannot send health update - not connected');
      return false;
    }

    try {
      const message: WebSocketMessage = {
        type: 'health_update',
        playerIndex,
        health,
        timestamp: Date.now()
      };

      const messageString = JSON.stringify(message);
      this._ws!.send(messageString);
      console.log('[WSM] Sent health update:', message);
      return true;
    } catch (error) {
      console.error('[WSM] Error sending health update:', error);
      return false;
    }
  }

  public sendPositionUpdate(
    playerIndex: number,
    x: number,
    y: number,
    velocityX: number,
    velocityY: number,
    flipX: boolean,
    frame?: number,
    cause?: string,
    animation?: string
  ): boolean {
    // DEBUG: Log all arguments received
    console.log('[WSM][DEBUG] sendPositionUpdate called with:', {
      playerIndex, x, y, velocityX, velocityY, flipX, frame, cause, animation
    });
    try {
      const message: any = {
        type: 'position_update',
        playerIndex,
        x,
        y,
        velocityX,
        velocityY,
        flipX,
        frame,
        timestamp: Date.now(),
      };
      if (cause) message.cause = cause;
      if (animation) message.animation = animation;
      const messageString = JSON.stringify(message);
      this._ws!.send(messageString);
      // DEBUG: Log outgoing position_update
      if (message.type === 'position_update') {
        console.log('[WSM] Sending position_update:', messageString);
      }
      return true;
    } catch (error) {
      console.error('[WSM] Error sending position update:', error);
      return false;
    }
  }

  public on(event: 'message' | 'close' | 'error', callback: (event: any) => void): void {
    switch (event) {
      case 'message':
        this.onMessage(callback);
        break;
      case 'close':
        this._onCloseCallback = callback as (event: CloseEvent) => void;
        break;
      case 'error':
        this._onErrorCallback = callback as (event: Event) => void;
        break;
      default:
        console.warn(`[WSM] Unknown event type: ${event}`);
    }
  }
}

// Export the WebSocketManager class and singleton instance
// export const wsManager = WebSocketManager.getInstance();
export { WebSocketManager };
