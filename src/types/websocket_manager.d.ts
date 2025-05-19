interface WebSocketMessage {
  type: string;
  action?: string;
  data?: any;
}

type WebSocketFactory = (url: string) => WebSocket;

declare class WebSocketManager {
  private static instance: WebSocketManager;
  public ws: WebSocket | null;
  public isHost: boolean;
  private _debugInstanceId: string;
  private _roomCode: string | null;
  private _onMessageCallback: ((event: MessageEvent) => void) | null;
  private _onCloseCallback: ((event: CloseEvent) => void) | null;
  private _onErrorCallback: ((event: Event) => void) | null;
  private _webSocketFactory: WebSocketFactory;

  constructor(webSocketFactory?: WebSocketFactory);
  
  // Connection management
  connect(): WebSocket | null;
  disconnect(): void;
  isConnected(): boolean;
  
  // Message handling
  send(data: any): void;
  sendHealthUpdate(health: number, playerIndex: number): void;
  setMessageCallback(callback: (data: any) => void): void;
  
  // Event handlers
  onMessage(callback: (event: MessageEvent) => void): void;
  onClose(callback: (event: CloseEvent) => void): void;
  onError(callback: (event: Event) => void): void;
  
  // Room management
  createRoom(): Promise<string>;
  joinRoom(roomCode: string, isHost: boolean): Promise<boolean>;
  
  // Static methods
  static getInstance(webSocketFactory?: WebSocketFactory): WebSocketManager;
}
