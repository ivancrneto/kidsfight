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
  [key: string]: any; // For any additional dynamic properties
}

export type WebSocketFactory = (url: string) => WebSocket;

export default class WebSocketManager {
  private static instance: WebSocketManager | null = null;
  private _ws: WebSocket | null = null;
  private _isHost: boolean = false;
  private _debugInstanceId: string = Math.random().toString(36).substr(2, 6);
  private _roomCode: string | null = null;
  private _onMessageCallback: ((event: MessageEvent) => void) | null = null;
  private _onCloseCallback: ((event: CloseEvent) => void) | null = null;
  private _onErrorCallback: ((event: Event) => void) | null = null;
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
      WebSocketManager.instance = null;
    }
  }

  public setHost(isHost: boolean): void {
    this._isHost = isHost;
  }

  public setRoomCode(roomCode: string): void {
    this._roomCode = roomCode;
  }

  public connect(url?: string, roomCode?: string): WebSocket | null {
    if (this._ws) {
      console.warn(`[WSM] WebSocket already connected [${this._debugInstanceId}]`);
      return this._ws;
    }

    try {
      this._isHost = false;
      this._ws = this._webSocketFactory(url!);

      this._ws.onopen = () => {
        console.log(`[WSM] Connected to server [${this._debugInstanceId}]`);
        if (this._onMessageCallback) {
          this._boundMessageCallback = (e: MessageEvent) => this._onMessageCallback?.(e);
          this._ws?.addEventListener('message', this._boundMessageCallback);
        }
      };

      this._ws.onclose = (event: CloseEvent) => {
        console.log(`[WSM] Disconnected from server [${this._debugInstanceId}]`, event);
        if (this._boundMessageCallback) {
          this._ws?.removeEventListener('message', this._boundMessageCallback);
          this._boundMessageCallback = null;
        }
        this._ws = null;
        this._onCloseCallback?.(event);
      };

      this._ws.onerror = (error: Event) => {
        console.error(`[WSM] WebSocket error [${this._debugInstanceId}]:`, error);
        this._onErrorCallback?.(error);
      };
    } catch (error) {
      console.error(`[WSM] Failed to connect to ${url}:`, error);
      this._onErrorCallback?.(error as Event);
    }
    return this._ws;
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
    return this._ws?.readyState === WebSocket.OPEN;
  }

  public send(message: WebSocketMessage): boolean {
    if (!this.isConnected()) {
      console.error('[WSM] Cannot send message - not connected');
      return false;
    }

    try {
      const messageString = JSON.stringify(message);
      this._ws!.send(messageString);
      console.log(`[WSM] Message sent:`, message);
      return true;
    } catch (error) {
      console.error('[WSM] Error sending message:', error);
      return false;
    }
  }

  public sendGameAction(action: string, data?: Record<string, any>): boolean {
    if (!this.isConnected()) {
      console.error('[WSM] Cannot send game action - not connected');
      return false;
    }

    try {
      const message: WebSocketMessage = {
        type: 'game_action',
        action,
        ...data, // Spread any additional data
        timestamp: Date.now()
      };
      
      const messageString = JSON.stringify(message);
      this._ws!.send(messageString);
      console.log('[WSM] Sent game action:', message);
      return true;
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

  public getRoomCode(): string | null {
    return this._roomCode;
  }

  public onMessage(callback: (event: MessageEvent) => void): void {
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

  public onClose(callback: (event: CloseEvent) => void): void {
    this._onCloseCallback = callback;
  }

  public onError(callback: (event: Event) => void): void {
    this._onErrorCallback = callback;
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

  public sendPositionUpdate(playerIndex: number, x: number, y: number, velocityX: number, velocityY: number, flipX: boolean, frame?: number): boolean {
    if (!this.isConnected()) {
      console.error('[WSM] Cannot send position update - not connected');
      return false;
    }

    try {
      const message: WebSocketMessage = {
        type: 'position_update',
        playerIndex,
        x,
        y,
        velocityX,
        velocityY,
        flipX,
        frame,
        timestamp: Date.now()
      };

      const messageString = JSON.stringify(message);
      this._ws!.send(messageString);
      return true;
    } catch (error) {
      console.error('[WSM] Error sending position update:', error);
      return false;
    }
  }

  // --- PATCH: Add missing methods for compatibility ---
  public setMessageCallback(callback: (event: MessageEvent) => void): void {
    this.onMessage(callback);
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

// Create and export the singleton instance
const wsManager = WebSocketManager.getInstance();

export { WebSocketManager };
