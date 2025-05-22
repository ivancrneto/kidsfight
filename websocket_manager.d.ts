import { WebSocketMessage } from './websocket_manager';

declare class WebSocketManager {
    private static instance: WebSocketManager | null;
    private ws: WebSocket | null;
    private isHost: boolean;
    private _roomCode: string | null;
    private _onMessageCallback: ((message: any) => void) | null;
    private _onCloseCallback: ((event: CloseEvent) => void) | null;
    private _onErrorCallback: ((error: Event) => void) | null;
    private _debugInstanceId: string;
    private _webSocketFactory: (url: string) => WebSocket;

    private constructor(webSocketFactory?: (url: string) => WebSocket);

    static getInstance(webSocketFactory?: (url: string) => WebSocket): WebSocketManager;
    static resetInstance(): void;

    connect(url?: string): WebSocket | null;
    disconnect(): void;
    isConnected(): boolean;
    send(message: any): boolean;
    setHost(isHost: boolean): void;
    setRoomCode(code: string): void;
    getRoomCode(): string | null;
    setMessageCallback(callback: (message: any) => void): void;
    setCloseCallback(callback: (event: CloseEvent) => void): void;
    setErrorCallback(callback: (error: Event) => void): void;
    sendGameAction(action: any): boolean;
    sendReplayRequest(request: any): boolean;
    sendReplayResponse(response: any): boolean;
    sendHealthUpdate(playerIndex: number, health: number): boolean;
    sendPositionUpdate(playerIndex: number, x: number, y: number, velocityX: number, velocityY: number, flipX: boolean, frame: number): boolean;
}

export { WebSocketManager };

declare const wsManager: WebSocketManager;
export { wsManager };
