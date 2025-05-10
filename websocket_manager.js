// Singleton WebSocket manager to maintain connection across scenes
class WebSocketManager {
  // Static instance property for the singleton pattern
  static instance;
  ws;
  isHost;
  
  constructor() {
    if (WebSocketManager.instance) {
      return WebSocketManager.instance;
    }
    WebSocketManager.instance = this;
    this.ws = null;
    this.isHost = false;
  }

  connect() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.log('[WebSocketManager] Creating new connection');
      this.ws = new WebSocket('ws://localhost:8081');
      
      this.ws.onopen = () => {
        console.log('[WebSocketManager] Connection opened');
      };
      
      this.ws.onerror = (error) => {
        console.error('[WebSocketManager] WebSocket error:', error);
      };
      
      this.ws.onclose = () => {
        console.log('[WebSocketManager] Connection closed');
      };
      
      // Add message logging with enhanced debugging for game actions
      const originalOnMessage = this.ws.onmessage;
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Enhanced logging for game actions
          if (data.type === 'game_action') {
            console.log('[WebSocketManager] Received game action:', {
              actionType: data.action?.type,
              direction: data.action?.direction,
              isHost: this.isHost,
              fullData: data
            });
          } else {
            console.log('[WebSocketManager] Received message:', {
              type: data.type,
              isHost: this.isHost,
              data: data
            });
          }
          
          if (originalOnMessage) {
            originalOnMessage(event);
          }
        } catch (error) {
          console.error('[WebSocketManager] Error processing message:', error, event.data);
        }
      };
    } else {
      console.log('[WebSocketManager] Reusing existing connection');
    }
    return this.ws;
  }

  setHost(isHost) {
    this.isHost = isHost;
  }

  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  send(message) {
    if (this.isConnected()) {
      // Enhanced logging for game actions
      if (typeof message === 'object' && message.type === 'game_action') {
        console.log('[WebSocketManager] Sending game action:', {
          actionType: message.action?.type,
          direction: message.action?.direction,
          isHost: this.isHost,
          fullMessage: message
        });
      } else {
        console.log('[WebSocketManager] Sending message:', message);
      }
      
      // Send the message
      this.ws.send(typeof message === 'string' ? message : JSON.stringify(message));
    } else {
      console.error('[WebSocketManager] Cannot send message - not connected');
    }
  }

  close() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Create and export a singleton instance
const wsManager = new WebSocketManager();
export default wsManager;
