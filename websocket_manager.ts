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
  _cascade_prevScenarioCallback?: (() => void) | null;

  public get isHost(): boolean {
    return this._isHost;
  }
  private static instance: WebSocketManager | null = null;
  private _ws: WebSocket | null = null;
  private _isHost: boolean = false;
  private _debugInstanceId: string = Math.random().toString(36).substr(2, 6);
  private _roomCode: string | null = null;
  private _onMessageCallback: ((event: MessageEvent) => void) | null = null;
  // Buffer for messages received when no handler is set
  private _pendingMessages: MessageEvent[] = []; // <-- PATCH: buffer for undelivered messages
  private _messageCallbackId: number = 0;
  private _currentCallbackId: number = 0;
  private _onCloseCallback: ((event: CloseEvent) => void) | null = null;
  private _onErrorCallback: ((event: Event) => void) | null = null;
  private _onConnectionCallback: ((isConnected: boolean) => void) | null = null;
  private _boundMessageCallback: ((event: MessageEvent) => void) | null = null;
  private _webSocketFactory: (url: string) => WebSocket;
  private _lastProcessedMessage: { type: string, timestamp: number } | null = null;
  private _messageQueue: Array<{ data: any, timestamp: number }> = [];
  private _isProcessingQueue: boolean = false;
  private _connectionState: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
  private _reconnectAttempts: number = 0;
  private _maxReconnectAttempts: number = 5;
  private _reconnectDelay: number = 1000;
  private _reconnectTimeout: NodeJS.Timeout | null = null;

  private constructor(webSocketFactory?: (url: string) => WebSocket) {
    this._webSocketFactory = webSocketFactory || ((url: string) => new WebSocket(url));
    console.log(`[WSM] WebSocketManager instance created [${this._debugInstanceId}]`);
  }

  public static getInstance(webSocketFactory?: (url: string) => WebSocket): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager(webSocketFactory);
      console.log(`[WSM][getInstance] New instance created`);
    } else {
      console.log(`[WSM][getInstance] Existing instance reused`);
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
    const prev = this._isHost;
    this._isHost = isHost;
    console.log(`[WSM][setHost] Host status changed from ${prev} to ${isHost}. Stack:`, new Error().stack);
    this.send({ type: 'host_status', isHost });
  }

  public setRoomCode(roomCode: string): void {
    this._roomCode = roomCode;
    this.send({ type: 'room_code', roomCode });
  }

  public getRoomCode(): string | null {
    return this._roomCode;
  }

  public send(message: any): void {
    if (!this._ws || this._ws.readyState !== WebSocket.OPEN) {
      console.warn('[WSM] Tried to send on closed socket', message);
      return;
    }
    console.log('[WSM][SEND] Sending:', message);
    this._ws.send(typeof message === 'string' ? message : JSON.stringify(message));
  }

  /**
   * Connect to the WebSocket server. Uses Render in production, localhost in development.
   * @param url Optional override URL (used for testing or custom endpoints)
   */
  private _updateConnectionState(newState: 'disconnected' | 'connecting' | 'connected'): void {
    if (this._connectionState === newState) return;
    
    console.log(`[WSM] Connection state changed: ${this._connectionState} -> ${newState}`);
    this._connectionState = newState;
    
    if (newState === 'connected') {
      this._reconnectAttempts = 0;
      this._onConnectionCallback?.(true);
    } else if (newState === 'disconnected') {
      this._onConnectionCallback?.(false);
    }
  }

  private _scheduleReconnect(): void {
    if (this._reconnectAttempts >= this._maxReconnectAttempts) {
      console.log(`[WSM] Max reconnection attempts (${this._maxReconnectAttempts}) reached`);
      return;
    }

    this._reconnectAttempts++;
    const delay = Math.min(this._reconnectDelay * Math.pow(2, this._reconnectAttempts - 1), 30000);
    
    console.log(`[WSM] Will attempt to reconnect in ${delay}ms (attempt ${this._reconnectAttempts}/${this._maxReconnectAttempts})`);
    
    this._reconnectTimeout = setTimeout(() => {
      if (this._ws) {
        this._ws.close();
        this._ws = null;
      }
      this.connect();
    }, delay);
  }

  public async connect(url?: string, roomCode?: string): Promise<WebSocket> {
    console.log('[WSM][DIAG] connect() called', { url, roomCode });
    
    if (this._connectionState === 'connected') {
      console.warn(`[WSM] Already connected [${this._debugInstanceId}]`);
      return Promise.resolve(this._ws!);
    }
    
    if (this._connectionState === 'connecting') {
      console.warn(`[WSM] Connection already in progress [${this._debugInstanceId}]`);
      return Promise.reject(new Error('Connection already in progress'));
    }
    
    this._updateConnectionState('connecting');
    
    // Clear any existing reconnect timeout
    if (this._reconnectTimeout) {
      clearTimeout(this._reconnectTimeout);
      this._reconnectTimeout = null;
    }
    
    let wsUrl = url || getWebSocketUrl();
    
    return new Promise((resolve, reject) => {
      try {
        this._isHost = false;
        this._ws = this._webSocketFactory(url!);
        console.log('[WSM][DIAG] _ws created', { ws: !!this._ws, url: this._ws?.url });

        // Add raw event logs for debugging
        if (this._ws) {
          this._ws.onopen = (e) => { console.log(`[WSM][onopen][${this._debugInstanceId}] WebSocket opened`, e); };
          this._ws.onclose = (e) => { console.warn(`[WSM][onclose][${this._debugInstanceId}] WebSocket closed`, e); };
          this._ws.onerror = (e) => { console.error(`[WSM][onerror][${this._debugInstanceId}] WebSocket error`, e); };
          // Aggressive diagnostic: log when addEventListener is called
          this._ws.addEventListener('message', (e) => {
            console.log(`[WSM][DIAG][${this._debugInstanceId}] addEventListener('message') fired:`, e.data);
          });
        }
        
        // Set up event handlers
        this._ws.onopen = () => {
          console.log('[WSM][DIAG] _ws.onopen called');
          console.log(`[WSM] Connected to server [${this._debugInstanceId}]`);
          
          this._updateConnectionState('connected');
          // --- PATCH: Always register message handler after connect ---
          if (this._onMessageCallback && !this._boundMessageCallback) {
            this._boundMessageCallback = (e: MessageEvent) => this._onMessageCallback?.(e);
            this._ws!.addEventListener('message', this._boundMessageCallback);
            console.log(`[WSM][DIAG][${this._debugInstanceId}] Registered _boundMessageCallback after connect`, this._boundMessageCallback);
          }
          // Set up message handler if not already set
          if (this._onMessageCallback && !this._boundMessageCallback) {
            this._boundMessageCallback = (e: MessageEvent) => {
              console.log('[WSM][RAW INCOMING]', e.data); // Debug: log all incoming messages
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
                
                // Add to message queue for processing
                this._messageQueue.push({
                  data: { ...e, data: parsedData },
                  timestamp: Date.now()
                });
                
                // Process queue if not already doing so
                if (!this._isProcessingQueue) {
                  this._processMessageQueue();
                }
              } catch (error) {
                console.error('[WSM] Error processing message:', error);
              }
            };
            
            this._ws?.addEventListener('message', this._boundMessageCallback);
            console.log('[WSM] Message event listener registered', { 
              ws: !!this._ws, 
              callback: !!this._boundMessageCallback 
            });
          }
          // Add LOGGING to all incoming messages
          if (this._ws) {
            this._ws.addEventListener('message', (event: MessageEvent) => {
              // Robust PATCH: Always buffer all messages
              this._pendingMessages.push(event);
              // If a handler is set, deliver all buffered messages in order
              if (this._onMessageCallback) {
                while (this._pendingMessages.length > 0) {
                  const bufferedEvent = this._pendingMessages.shift();
                  console.log('[WSM] Delivering buffered message to handler:', bufferedEvent);
                  this._onMessageCallback(bufferedEvent!);
                }
              }
            });
          }
          resolve(this._ws!);
        };

        this._ws.onclose = (event: CloseEvent) => {
          console.log(`[WSM] Disconnected from server [${this._debugInstanceId}]`, event);
          
          // Clean up WebSocket reference
          if (this._boundMessageCallback) {
            this._ws?.removeEventListener('message', this._boundMessageCallback);
            this._boundMessageCallback = null;
          }
          
          const wasConnected = this.isConnected();
          this._ws = null;
          
          // Only trigger callbacks if we were actually connected
          if (wasConnected) {
            this._onCloseCallback?.(event);
            this._updateConnectionState('disconnected');
            
            // Schedule reconnection if this wasn't an intentional disconnect
            if (event.code !== 1000) { // 1000 = Normal closure
              this._scheduleReconnect();
            }
          }
        };

        this._ws.onerror = (error: Event) => {
          console.error(`[WSM] WebSocket error [${this._debugInstanceId}]:`, error);
          console.log('[WSM][DIAG] connect() onerror');
          
          this._onErrorCallback?.(error);
          
          // Only reject if we're in the initial connection phase
          if (this._connectionState === 'connecting') {
            this._updateConnectionState('disconnected');
            reject(error);
          } else {
            // For errors after connection, trigger reconnection
            this._updateConnectionState('disconnected');
            this._scheduleReconnect();
          }
        };
      } catch (error) {
        console.error('[WSM][DIAG] connect() threw', error);
        reject(error);
      }
    });
  }

  public disconnect(code?: number, reason?: string): void {
    console.log(`[WSM] Disconnecting...`);
    
    // Clear any pending reconnect attempts
    if (this._reconnectTimeout) {
      clearTimeout(this._reconnectTimeout);
      this._reconnectTimeout = null;
    }
    
    if (this._ws) {
      try {
        // Remove all event listeners
        this._ws.onopen = null;
        this._ws.onclose = null;
        this._ws.onerror = null;
        
        if (this._boundMessageCallback) {
          this._ws.removeEventListener('message', this._boundMessageCallback);
          this._boundMessageCallback = null;
        }
        
        // Only try to close if not already closing or closed
        if (this._ws.readyState === WebSocket.OPEN) {
          this._ws.close(code, reason);
        }
        
        this._ws = null;
        this._updateConnectionState('disconnected');
      } catch (error) {
        console.error('[WSM] Error during disconnect:', error);
      } finally {
        this._ws = null;
        this._updateConnectionState('disconnected');
      }
    }
    
    // Clear message queue on disconnect
    this._messageQueue = [];
    this._isProcessingQueue = false;
  }

  public isConnected(): boolean {
    return this._connectionState === 'connected' && 
           !!this._ws && 
           this._ws.readyState === WebSocket.OPEN;
  }

  public send(message: any): boolean {
    if (!this.isConnected()) {
      console.log('[WSM] Cannot send message - not connected, readyState:', this._ws?.readyState);
      return false;
    }

    try {
      const msgToSend = typeof message === 'string' ? message : JSON.stringify(message);
      
      // Skip duplicate messages
      if (typeof message === 'object' && message.type) {
        if (this._lastProcessedMessage && 
            this._lastProcessedMessage.type === message.type && 
            (Date.now() - this._lastProcessedMessage.timestamp < 1000)) {
          console.log(`[WSM] Skipping duplicate message: ${message.type}`);
          return false;
        }
        this._lastProcessedMessage = {
          type: message.type,
          timestamp: Date.now()
        };
      }
      
      console.log('[WSM] Sending message, type:', typeof message, 'content:', message);
      console.log('[WSM] Stringified message to send:', msgToSend);
      
      this._ws!.send(msgToSend);
      
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
    } catch (error) {
      console.error('[WSM] Error sending message:', error);
      return false;
    }
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

  private _processMessageQueue(): void {
    if (this._isProcessingQueue || this._messageQueue.length === 0) return;
    
    this._isProcessingQueue = true;
    const message = this._messageQueue.shift();
    
    if (message) {
      try {
        if (this._onMessageCallback) {
          console.log(`[WSM][DIAG][${this._debugInstanceId}] _processMessageQueue: calling _onMessageCallback with:`, message.data, 'Callback:', this._onMessageCallback);
          this._onMessageCallback(message.data);
        }
      } catch (error) {
        console.error('[WSM] Error processing message from queue:', error);
      }
    }
    
    this._isProcessingQueue = false;
    
    // Process next message in queue if any
    if (this._messageQueue.length > 0) {
      setImmediate(() => this._processMessageQueue());
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

    this._onMessageCallback = (event: MessageEvent) => {
      try {
        // Queue the message for processing
        console.log(`[WSM][DIAG][${this._debugInstanceId}] Pushing message to queue. Event:`, event, 'Current queue:', this._messageQueue);
        this._messageQueue.push({
          data: event,
          timestamp: Date.now()
        });
        console.log(`[WSM][DIAG][${this._debugInstanceId}] After push: queue=`, this._messageQueue, '_onMessageCallback=', this._onMessageCallback);
        // Start processing queue if not already doing so
        if (!this._isProcessingQueue) {
          this._processMessageQueue();
        }
      } catch (error) {
        console.error('[WSM] Error in message callback:', error);
      }
    };

    // If WebSocket is already connected, set up the new listener
    if (this.isConnected()) {
      this._boundMessageCallback = (e: MessageEvent) => this._onMessageCallback?.(e);
      this._ws!.addEventListener('message', this._boundMessageCallback);
    }
  }

  public setMessageCallback(cb: (event: MessageEvent) => void): void {
    console.log(`[WSM] setMessageCallback called [${this._debugInstanceId}]. Handler:`, cb, 'Pending messages:', this._pendingMessages.length, '_onMessageCallback:', this._onMessageCallback);
    this._messageCallback = cb;
    this._onMessageCallback = cb; // <-- THIS IS CRUCIAL
    // Always register the real message handler if connected
    if (this._ws && this.isConnected()) {
      if (this._boundMessageCallback) {
        this._ws.removeEventListener('message', this._boundMessageCallback);
      }
      this._boundMessageCallback = (e: MessageEvent) => this._onMessageCallback?.(e);
      this._ws.addEventListener('message', this._boundMessageCallback);
      console.log(`[WSM][DIAG][${this._debugInstanceId}] Registered _boundMessageCallback in setMessageCallback`, this._boundMessageCallback);
    }
    // Always register the real message handler if connected
    // if (this._ws && this.isConnected()) {
    //   if (this._boundMessageCallback) {
    //     this._ws.removeEventListener('message', this._boundMessageCallback);
    //   }
    //   this._boundMessageCallback = (e: MessageEvent) => this._onMessageCallback?.(e);
    //   this._ws.addEventListener('message', this._boundMessageCallback);
    //   console.log(`[WSM][DIAG][${this._debugInstanceId}] Registered _boundMessageCallback in setMessageCallback`, this._boundMessageCallback);
    // }
    // Deliver any buffered messages
    if (this._pendingMessages.length > 0 && cb) {
      while (this._pendingMessages.length > 0) {
        const event = this._pendingMessages.shift();
        console.log('[WSM] Delivering buffered message to new callback:', event);
        cb(event!);
      }
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
