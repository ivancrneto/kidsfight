// Singleton WebSocket manager to maintain connection across scenes
import { DEV } from './globals.js';

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
      if (DEV) console.log('[WebSocketManager] Creating new connection');
      // Always use a shared WebSocket server to ensure messages are relayed between clients
      // For local testing, both clients should connect to the same server
      let wsUrl;
      
      // Get server from URL parameter if available (for easier testing)
      const urlParams = new URLSearchParams(window.location.search);
      const serverParam = urlParams.get('server');
      
      if (serverParam) {
        // Use server from URL parameter
        wsUrl = serverParam.startsWith('ws') ? serverParam : `ws://${serverParam}`;
        console.log('[WebSocketManager] Using server from URL parameter:', wsUrl);
      } else {
        // Default server configuration
        wsUrl = DEV
          ? 'ws://localhost:8081'
          : 'wss://kidsfight-websocket.glitch.me';
        console.log('[WebSocketManager] Using default server:', wsUrl);
      }
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        if (DEV) console.log('[WebSocketManager] Connection opened');
      };
      
      this.ws.onerror = (error) => {
        console.error('[WebSocketManager] WebSocket error:', error);
      };
      
      this.ws.onclose = () => {
        if (DEV) console.log('[WebSocketManager] Connection closed');
      };
      
      // CRITICAL FIX: Use a single global handler for ALL WebSocket messages
      // This ensures we don't miss any messages due to multiple handlers overwriting each other
      this.ws.onmessage = (event) => {
        console.log('🔴🔴 [FAILSAFE] Raw WebSocket message received:', event.data.substring(0, 100));
        console.log('[FULL-LOG] RECEIVED MESSAGE LENGTH:', event.data.length);
        
        // First try-catch block just for parsing
        let data;
        try {
          data = JSON.parse(event.data);
        } catch (error) {
          console.error('[WebSocketManager] Failed to parse message:', error, event.data);
          return; // Exit early if we can't parse the message
        }
        
        // HIGHEST PRIORITY: Check for player_update messages specifically
        if (data.type === 'player_update') {
          console.log('🔴🔴 [FAILSAFE] Intercepted player_update message:', {
            x: data.x, 
            y: data.y,
            velocityX: data.velocityX,
            velocityY: data.velocityY,
            frame: data.frame,
            flipX: data.flipX,
            timestamp: Date.now(),
            type: data.type,
            hasData: !!data
          });
          
          try {
            // Direct emergency handling for player updates
            if (this.gameScene) {
              console.log('[FAILSAFE] Game scene available:', {
                hasGameScene: !!this.gameScene,
                hasLocalPlayerIndex: this.gameScene.localPlayerIndex !== undefined,
                hasPlayers: !!this.gameScene.players,
                playersLength: this.gameScene.players ? this.gameScene.players.length : 0
              });
              
              // Determine player to update
              const localPlayerIndex = this.gameScene.localPlayerIndex;
              const remotePlayerIndex = localPlayerIndex === 0 ? 1 : 0;
              const remotePlayer = this.gameScene.players ? this.gameScene.players[remotePlayerIndex] : null;
              
              console.log('[FAILSAFE] Remote player info:', {
                localPlayerIndex,
                remotePlayerIndex,
                remotePlayerExists: !!remotePlayer,
                hasBody: remotePlayer ? !!remotePlayer.body : false
              });
              
              if (remotePlayer) {
                // Directly update position
                const oldX = remotePlayer.x;
                const oldY = remotePlayer.y;
                remotePlayer.x = data.x;
                remotePlayer.y = data.y;
                
                if (remotePlayer.body) {
                  remotePlayer.body.velocity.x = data.velocityX || 0;
                  remotePlayer.body.velocity.y = data.velocityY || 0;
                }
                
                // Update flip and animation
                if (typeof data.flipX === 'boolean') {
                  remotePlayer.setFlipX(data.flipX);
                }
                
                if (typeof data.frame === 'number' || typeof data.frame === 'string') {
                  try {
                    remotePlayer.setFrame(data.frame);
                  } catch (frameErr) {
                    console.error('[FAILSAFE] Error setting frame:', frameErr);
                  }
                }
                
                console.log('🔴🔴 [FAILSAFE] SUCCESSFULLY updated remote player position:', {
                  oldX,
                  newX: remotePlayer.x,
                  oldY,
                  newY: remotePlayer.y,
                  velocityX: remotePlayer.body ? remotePlayer.body.velocity.x : 'no body',
                  velocityY: remotePlayer.body ? remotePlayer.body.velocity.y : 'no body',
                  frame: remotePlayer.frame ? remotePlayer.frame.name : 'unknown'
                });
              }
            }
          } catch (err) {
            console.error('🔴🔴 [FAILSAFE] Failed to update player:', err);
          }
        }
        
        // Continue with the standard message handling
        try {
          // Enhanced logging for game actions
          if (data.type === 'game_action') {
            if (DEV) console.log('[WebSocketManager] Received game action:', {
              actionType: data.action?.type,
              direction: data.action?.direction,
              isHost: this.isHost,
              fullData: data
            });
          } 
          // Enhanced logging for replay requests
          else if (data.type === 'replay_request') {
            if (DEV) console.log('[WebSocketManager] Received replay request:', {
              action: data.action,
              isHost: this.isHost,
              roomCode: data.roomCode,
              timestamp: data.timestamp,
              fullData: data
            });
          }
          // Enhanced logging for replay responses
          else if (data.type === 'replay_response') {
            if (DEV) console.log('[WebSocketManager] Received replay response:', {
              action: data.action,
              accepted: data.accepted,
              isHost: this.isHost,
              fullData: data
            });
          }
          // Add explicit logging for health update messages
          else if (data.type === 'health_update') {
            // Always log health updates (not behind DEV flag)
            console.log('🔴 [WebSocketManager] RECEIVED HEALTH UPDATE:', {
              playerIndex: data.playerIndex,
              health: data.health,
              isHost: this.isHost,
              readyState: this.ws.readyState,
              timestamp: Date.now()
            });
            
            // Use direct health sync if game scene is available
            if (this.gameScene && this.gameScene.playerHealth) {
              // Update health directly in the game scene
              this.gameScene.playerHealth[data.playerIndex] = data.health;
              
              // Update health bars if the method exists
              if (typeof this.gameScene.updateHealthBars === 'function') {
                this.gameScene.updateHealthBars();
                console.log('🔴 [WebSocketManager] Directly updated health bars for player', data.playerIndex);
              }
            } else {
              console.warn('[WebSocketManager] Received health_update but gameScene not registered or playerHealth not available');
            }
          }
          // Add explicit handling for player_update messages
          else if (data.type === 'player_update') {
            // CRITICAL DEBUGGING - Log every player update with timestamp
            console.log('🔴🔴 [CRITICAL] WebSocketManager RECEIVED PLAYER UPDATE:', {
              x: data.x,
              y: data.y,
              frame: data.frame,
              flipX: data.flipX,
              velocityX: data.velocityX,
              velocityY: data.velocityY,
              isHost: this.isHost,
              wsReady: this.isConnected(),
              readyState: this.ws.readyState,
              timestamp: Date.now(),
              hasGameScene: !!this.gameScene
            });
            
            try {
              // Use our direct sync method to update the player position
              // This bypasses the complex message handler chain
              if (this.gameScene) {
                // Double-check that game scene is properly initialized
                console.log('[CRITICAL] Game scene check:', {
                  hasPlayers: !!this.gameScene.players,
                  playerCount: this.gameScene.players ? this.gameScene.players.length : 0,
                  localPlayerIndex: this.gameScene.localPlayerIndex,
                  scene: this.gameScene.scene?.key || 'unknown'
                });
                
                // EMERGENCY FIX: Force player update directly in the scene
                if (this.gameScene.players && this.gameScene.players.length >= 2) {
                  const localPlayerIndex = this.gameScene.localPlayerIndex;
                  const remotePlayerIndex = localPlayerIndex === 0 ? 1 : 0;
                  const remotePlayer = this.gameScene.players[remotePlayerIndex];
                  
                  if (remotePlayer && remotePlayer.body) {
                    console.log('[CRITICAL] EMERGENCY DIRECT POSITION UPDATE');
                    // Direct update without using method
                    remotePlayer.x = data.x;
                    remotePlayer.y = data.y;
                    remotePlayer.body.velocity.x = data.velocityX || 0;
                    remotePlayer.body.velocity.y = data.velocityY || 0;
                    
                    if (typeof data.flipX === 'boolean') {
                      remotePlayer.setFlipX(data.flipX);
                    }
                    
                    console.log('[CRITICAL] Successfully updated remote player position');
                  } else {
                    console.error('[CRITICAL] Remote player or physics body missing');
                  }
                } else {
                  console.error('[CRITICAL] Cannot update position - not enough players');
                }
                
                // Also directly call the method in the game scene if it exists
                if (this.gameScene && typeof this.gameScene.directSyncPlayerPosition === 'function') {
                  try {
                    this.gameScene.directSyncPlayerPosition(data);
                    console.log('[CRITICAL] Called game scene directSyncPlayerPosition');
                  } catch (syncErr) {
                    console.error('[CRITICAL] Error calling game scene directSyncPlayerPosition:', syncErr);
                  }
                }
                
                // Also try using the method as fallback
                try {
                  this.directSyncPlayerPosition(data);
                  console.log('[CRITICAL] Called WebSocketManager directSyncPlayerPosition');
                } catch (wsErr) {
                  console.error('[CRITICAL] Error in WebSocketManager directSyncPlayerPosition:', wsErr);
                }
              } else {
                console.warn('[CRITICAL] Received player_update but gameScene not registered');
              }
            } catch (error) {
              console.error('[CRITICAL] Error syncing player position:', error.message, error.stack);
            }
          }
          else {
            if (DEV) console.log('[WebSocketManager] Received message:', {
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
      if (DEV) console.log('[WebSocketManager] Reusing existing connection');
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
      // Enhanced logging for the send method
      
      // Special handling for player_update messages - CRITICAL FIX
      if (typeof message === 'object' && message.type === 'player_update') {
        console.log(' [CRITICAL] Sending player_update:', {
          x: message.x,
          y: message.y,
          velocityX: message.velocityX,
          velocityY: message.velocityY,
          frame: message.frame,
          flipX: message.flipX,
          timestamp: Date.now()
        });
        
        // VERY IMPORTANT: If this is a player_update message and we're handling the sending, 
        // make sure it actually gets sent through the WebSocket
        try {
          const messageString = JSON.stringify(message);
          this.ws.send(messageString);
          console.log(' [CRITICAL] player_update WebSocket message sent successfully', messageString.length);
          return true; // Exit early after handling player_update
        } catch (error) {
          console.error(' [CRITICAL] Error sending player_update message:', error);
          return false;
        }
      }
      
      // Special handling for health update messages
      if (typeof message === 'object' && message.type === 'health_update') {
        console.log(' [WebSocketManager] Sending health update:', message);
      }
      else if (typeof message === 'object' && message.type === 'game_action') {
        if (DEV) console.log('[WebSocketManager] Sending game action:', {
          actionType: message.action?.type,
          direction: message.action?.direction,
          isHost: this.isHost,
          fullMessage: message
        });
      }
      // Enhanced logging for replay requests
      else if (typeof message === 'object' && message.type === 'replay_request') {
        if (DEV) console.log('[WebSocketManager] Sending replay request:', {
          action: message.action,
          isHost: this.isHost,
          roomCode: message.roomCode,
          timestamp: message.timestamp,
          fullMessage: message
        });
      }
      // Enhanced logging for replay responses
      else if (typeof message === 'object' && message.type === 'replay_response') {
        if (DEV) console.log('[WebSocketManager] Sending replay response:', {
          action: message.action,
          accepted: message.accepted,
          isHost: this.isHost,
          fullMessage: message
        });
      }
      else {
        if (DEV) console.log('[WebSocketManager] Sending message:', message);
      }
      
      // Send the message (for messages that didn't get early handling)
      this.ws.send(typeof message === 'string' ? message : JSON.stringify(message));
    } else {
      console.error('[WebSocketManager] Cannot send message - not connected');
    }
  }
  
  sendGameAction(action) {
    if (!this.isConnected()) {
      console.error('[WebSocketManager] Cannot send game action - not connected');
      return;
    }
    
    if (DEV) console.log('[WebSocketManager] Sending game action:', action);
    
    const message = {
      type: 'game_action',
      action: action
    };
    
    this.send(message);
  }
  
  // Add a specific method for sending health updates to ensure they're properly formatted
  sendHealthUpdate(playerIndex, health) {
    if (!this.isConnected()) {
      console.log(' Cannot send health update - not connected:', {
        playerIndex,
        health,
        isHost: this.isHost,
        readyState: this.ws?.readyState,
        timestamp: Date.now()
      });
      return false;
    }
    
    console.log('[HEALTH SYNC][SENDER] Preparing to send health_update:', {
      playerIndex,
      health,
      isHost: this.isHost,
      readyState: this.ws.readyState,
      timestamp: Date.now()
    });
    
    const message = {
      type: 'health_update',
      playerIndex: playerIndex,
      health: health
    };
    
    this.send(message);
    return true;
  }

  // Store a reference to the game scene
  setGameScene(scene) {
    this.gameScene = scene;
    console.log('[CRITICAL] WebSocketManager now has a reference to the game scene', {
      hasScene: !!this.gameScene,
      sceneKey: this.gameScene?.scene?.key
    });
    return this;
  }
  
  // Direct method to handle player updates without relying on WebSocket message handlers
  directSyncPlayerPosition(playerData) {
    // Always log critical debugging info for player updates during troubleshooting
    console.log('[DIRECT-SYNC] CRITICAL DEBUG - Received player_update data:', {
      receivedData: playerData,
      hasGameScene: !!this.gameScene,
      hasPlayers: this.gameScene ? !!this.gameScene.players : false,
      playerCount: this.gameScene && this.gameScene.players ? this.gameScene.players.length : 0,
      localPlayerIndex: this.gameScene ? this.gameScene.localPlayerIndex : 'unknown'
    });
    
    if (!this.gameScene || !this.gameScene.players || this.gameScene.players.length < 2) {
      console.log('[DIRECT-SYNC] ‼️ Cannot sync player position - no game scene or players');
      return false;
    }
    
    // Determine which player to update based on the local player index
    const localPlayerIndex = this.gameScene.localPlayerIndex;
    const remotePlayerIndex = localPlayerIndex === 0 ? 1 : 0;
    const remotePlayer = this.gameScene.players[remotePlayerIndex];
    
    console.log('[DIRECT-SYNC] Player indexes:', {
      localPlayerIndex,
      remotePlayerIndex,
      hasRemotePlayer: !!remotePlayer,
      hasRemoteBody: remotePlayer ? !!remotePlayer.body : false
    });
    
    if (!remotePlayer) {
      console.log('[DIRECT-SYNC] ‼️ Cannot sync player position - no remote player');
      return false;
    }
    
    if (!remotePlayer.body) {
      console.log('[DIRECT-SYNC] ‼️ Cannot sync player position - remote player has no physics body');
      return false;
    }
    
    // Store original position for debugging
    const originalX = remotePlayer.x;
    const originalY = remotePlayer.y;
    
    // Update the remote player position and state
    remotePlayer.x = playerData.x;
    remotePlayer.y = playerData.y;
    remotePlayer.body.velocity.x = playerData.velocityX;
    remotePlayer.body.velocity.y = playerData.velocityY;
    
    if (typeof playerData.flipX === 'boolean') {
      remotePlayer.setFlipX(playerData.flipX);
    }
    
    if (typeof playerData.frame === 'string' || typeof playerData.frame === 'number') {
      try {
        if (typeof playerData.frame === 'string') {
          // Try to set frame by name
          remotePlayer.setFrame(playerData.frame);
        } else {
          // Try to set frame by number
          remotePlayer.setFrame(playerData.frame);
        }
      } catch (e) {
        console.log('[DIRECT-SYNC] ‼️ Error setting frame:', e.message);
      }
    }
    
    // Log position change for EVERY update during troubleshooting
    console.log('[DIRECT-SYNC] ✅ Updated remote player position:', {
      from: { x: originalX, y: originalY },
      to: { x: remotePlayer.x, y: remotePlayer.y },
      velocityX: remotePlayer.body.velocity.x,
      velocityY: remotePlayer.body.velocity.y,
      frameData: playerData.frame,
      flipX: playerData.flipX
    });
    
    return true;
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
