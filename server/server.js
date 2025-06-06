const WebSocket = require('ws');
const PORT = process.env.PORT || (process.argv[2] ? parseInt(process.argv[2], 10) : 8081);
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
const server = new WebSocket.Server({ host: HOST, port: PORT });
console.log(`WebSocket server running on ${HOST}:${PORT}`);

// Store active game rooms
const gameRooms = new Map();

// Helper to get or init player state in a room
function getPlayerState(room, playerKey) {
  if (!room.gameState[playerKey]) {
    room.gameState[playerKey] = { 
      hits: 0, 
      specialEnabled: false,
      scene: 'player_select', // Track which scene the player is in
      ready: false
    };
  }
  return room.gameState[playerKey];
}

// Helper to check if both players are ready and have selected characters
function shouldStartGame(room) {
  const p1 = room.gameState.p1;
  const p2 = room.gameState.p2;
  
  // Only start if both players are in the scenario select scene and ready
  return (
    p1 && p2 &&
    p1.ready && p2.ready &&
    p1.character && p2.character &&
    p1.scene === 'scenario_select' &&
    p2.scene === 'scenario_select'
  );
}

function startGame(room, roomCode) {
  if (room.host) {
    room.host.send(JSON.stringify({
      type: 'game_start',
      p1Char: room.gameState.p1.character,
      p2Char: room.gameState.p2.character,
      scenario: room.gameState.scenario || 'scenario1',
      roomCode,
      playerIndex: 0,
      isHost: true
    }));
  }
  if (room.client) {
    room.client.send(JSON.stringify({
      type: 'game_start',
      p1Char: room.gameState.p1.character,
      p2Char: room.gameState.p2.character,
      scenario: room.gameState.scenario || 'scenario1',
      roomCode,
      playerIndex: 1,
      isHost: false
    }));
  }
}

server.on('connection', (ws) => {
  console.log('New client connected');

  // Send a test message to the client immediately on connection
ws.send(JSON.stringify({ type: 'test', msg: 'hello from server' }), (err) => {
  if (err) {
    console.error('[Server] Error sending test:', err);
  } else {
    console.log('[Server] test message sent successfully');
  }
});

  let roomCode = null;
  let isHost = false;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received:', data);

      switch (data.type) {
        case 'create_room':
          // Generate a unique room code
          if (process.env.NODE_ENV === 'development') {
            // Use fixed code only in development for easier testing
            roomCode = '111111';
          } else {
            // Generate a random 6-digit code as string for production and typical development
            roomCode = Math.floor(100000 + Math.random() * 900000).toString();
          }

          // Create new room with default characters
          gameRooms.set(roomCode, {
            host: ws,
            client: null,
            gameState: {
              p1: { character: 'bento' },  // Default character for p1
              p2: { character: 'davir' }   // Default character for p2
            }
          });
          
          isHost = true;
          ws.send(JSON.stringify({ type: 'room_created', roomCode }), (err) => {
            if (err) console.error('[Server] Error sending room_created:', err);
            else console.log('[Server] room_created sent successfully');
          });
          ws.send(JSON.stringify({ type: 'room_code', roomCode }), (err) => {
            if (err) console.error('[Server] Error sending room_code:', err);
            else console.log('[Server] room_code sent successfully');
          });
          console.log('[Server] Sent room_code to host (on create):', roomCode);
          console.log(`Game created with code: ${roomCode}`);
          break;

        case 'join_room':
          const room = gameRooms.get(data.roomCode);
          if (!room) {
            ws.send(JSON.stringify({ type: 'error', message: 'Room not found' }));
            return;
          }
          
          if (room.client) {
            ws.send(JSON.stringify({ type: 'error', message: 'Room is full' }));
            return;
          }

          // Join the room
          room.client = ws;
          roomCode = data.roomCode;
          isHost = false;

          // Notify both players
          room.host.send(JSON.stringify({ 
            type: 'player_joined',
            roomCode: roomCode
          }));
          ws.send(JSON.stringify({ 
            type: 'game_joined',
            roomCode: roomCode,
            playerIndex: 1,
            isHost: false
          }));
          ws.send(JSON.stringify({ type: 'room_code', roomCode })); // Ensure guest always receives room_code
          console.log('[Server] Sent room_code to guest:', roomCode);
          room.host.send(JSON.stringify({ type: 'room_code', roomCode })); // Optionally re-send to host on join
          console.log('[Server] Sent room_code to host (on join):', roomCode);

          console.log(`Player joined room: ${roomCode}`);
          break;

        case 'player_selected':
        case 'playerSelected': {
          const selRoom = gameRooms.get(roomCode);
          if (!selRoom) return;
          // Update character selection in gameState
          if (data.player === 'p1' || data.player === 'p2') {
            selRoom.gameState[data.player] = selRoom.gameState[data.player] || {};
            selRoom.gameState[data.player].character = data.character;
          }
          // Forward selection to the other player
          const selTarget = isHost ? selRoom.client : selRoom.host;
          if (selTarget) {
            selTarget.send(JSON.stringify({
              type: 'player_selected',
              player: data.player,
              character: data.character,
              roomCode: roomCode // optional, for debugging or client logic
            }));
          }
          // Try to start game if both ready and selected
          if (shouldStartGame(selRoom)) {
            startGame(selRoom, roomCode);
          }
          break;
        }
        case 'player_ready': {
          const readyRoom = gameRooms.get(roomCode);
          if (!readyRoom) return;
          // Mark this player as ready
          if (isHost) {
            readyRoom.gameState.p1 = readyRoom.gameState.p1 || {};
            readyRoom.gameState.p1.ready = true;
          } else {
            readyRoom.gameState.p2 = readyRoom.gameState.p2 || {};
            readyRoom.gameState.p2.ready = true;
          }
          // Broadcast to both host and client if present
          if (readyRoom.host) {
            readyRoom.host.send(JSON.stringify({
              type: 'player_ready',
              player: isHost ? 'host' : 'guest',
              roomCode: roomCode
            }));
          }
          if (readyRoom.client) {
            readyRoom.client.send(JSON.stringify({
              type: 'player_ready',
              player: isHost ? 'host' : 'guest',
              roomCode: roomCode
            }));
          }
          // Try to start game if both ready and selected
          if (shouldStartGame(readyRoom)) {
            startGame(readyRoom, roomCode);
          }
          break;
        }
        case 'scenario_selected':
          const scRoom = gameRooms.get(roomCode);
          if (!scRoom) return;
          // Store the selected scenario in the room's game state
          scRoom.gameState.scenario = data.scenario;
          // Forward scenario selection to both players
          if (scRoom.host) {
            scRoom.host.send(JSON.stringify({
              type: 'scenario_selected',
              scenario: data.scenario,
              roomCode: data.roomCode
            }));
          }
          if (scRoom.client) {
            scRoom.client.send(JSON.stringify({
              type: 'scenario_selected',
              scenario: data.scenario,
              roomCode: data.roomCode
            }));
          }
          break;

        case 'game_start': {
          const room = gameRooms.get(roomCode);
          console.log('[Server] Received game_start:', data, 'for room', roomCode);
          console.log('[Server] Room status:', room ? 'exists' : 'not found');
          if (room) {
            console.log('[Server] Host connection:', room.host ? 'connected' : 'not connected');
            console.log('[Server] Guest connection:', room.client ? 'connected' : 'not connected');
          }
          
          if (!room) return;
          
          // Forward to both players
          if (room.host) {
            console.log('[Server] Forwarding game_start to host');
            room.host.send(JSON.stringify({
              type: 'game_start',
              p1Char: data.p1Char,
              p2Char: data.p2Char,
              scenario: data.scenario,
              roomCode: data.roomCode,
              playerIndex: 0,
              isHost: true
            }));
          }
          
          if (room.client) {
            console.log('[Server] Forwarding game_start to guest');
            room.client.send(JSON.stringify({
              type: 'game_start',
              p1Char: data.p1Char,
              p2Char: data.p2Char,
              scenario: data.scenario,
              roomCode: data.roomCode,
              playerIndex: 1,
              isHost: false
            }));
          }
          
          console.log('[Server] game_start message handling complete');
        }
        break;

        case 'scene_change':
          console.log(`[SERVER] Player changed scene:`, data);
          if (!roomCode) {
            console.log(`[SERVER] Room not found for scene change:`, data);
            return;
          }

          const sceneRoom = gameRooms.get(roomCode);
          if (!sceneRoom) {
            console.log(`[SERVER] Room not found for scene change:`, data);
            return;
          }

          
          
          // Update player's scene
          playerState.scene = data.scene;
          console.log(`[SERVER] Player ${playerKey} changed to scene: ${data.scene}`);
          
          // Reset ready state when leaving scenario select
          if (data.scene !== 'scenario_select') {
            playerState.ready = false;
            console.log(`[SERVER] Reset ready state for player ${playerKey} (left scenario select)`);
          }
          
          // Notify both players of the scene change
          broadcastToRoom(ws, sceneRoom, {
            type: 'player_scene_changed',
            player: playerKey,
            scene: data.scene,
            roomCode: roomCode
          });
          break;

        case 'request_game_state':
          console.log(`[SERVER] Game state requested by ${data.isHost ? 'host' : 'guest'}`);
          if (!roomCode) {
            console.log(`[SERVER] Room not found for game state request`);
            return;
          }
          
          const stateRoom = gameRooms.get(roomCode);
          if (!stateRoom) {
            console.log(`[SERVER] Room not found: ${roomCode}`);
            return;
          }
          
          // Send current game state to the requesting client
          const targetWs = data.isHost ? stateRoom.host : stateRoom.client;
          if (targetWs) {
            const gameState = {
              type: 'game_state',
              states: {
                hostReady: stateRoom.gameState.p1?.ready || false,
                guestReady: stateRoom.gameState.p2?.ready || false,
                scenario: stateRoom.gameState.scenario
              }
            };
            targetWs.send(JSON.stringify(gameState));
            console.log(`[SERVER] Sent game state to ${data.isHost ? 'host' : 'guest'}:`, gameState);
          }
          break;
          
        case 'player_ready':
          console.log(`[SERVER] Player ready:`, data);
          if (!roomCode) {
            console.log(`[SERVER] Room not found: ${data.roomCode}`);
            return;
          }

          const readyRoom = gameRooms.get(roomCode);
          if (!readyRoom) {
            console.log(`[SERVER] Room not found: ${data.roomCode}`);
            return;
          }

          const readyPlayerKey = data.player === 'host' ? 'p1' : 'p2';
          const readyPlayerState = getPlayerState(readyRoom, readyPlayerKey);
          
          // Only allow ready state if player is in scenario select
          if (readyPlayerState.scene !== 'scenario_select') {
            console.log(`[SERVER] Player ${readyPlayerKey} tried to ready up while in ${readyPlayerState.scene}`);
            return;
          }

          // Update ready state
          readyPlayerState.ready = true;
          console.log(`[SERVER] Player ${readyPlayerKey} is ready`);

          // Broadcast the ready state to both players
          broadcastToRoom(ws, readyRoom, {
            type: 'player_ready',
            player: data.player,
            roomCode: roomCode
          });

          // Check if we should start the game
          const p1 = readyRoom.gameState.p1;
          const p2 = readyRoom.gameState.p2;
          
          if (p1 && p2 && p1.ready && p2.ready && 
              p1.scene === 'scenario_select' && 
              p2.scene === 'scenario_select' &&
              p1.character && p2.character) {
            
            console.log(`[SERVER] Both players ready, starting game...`);
            
            // Send game start to both players
            broadcastToRoom(ws, readyRoom, {
              type: 'game_start',
              p1Char: p1.character,
              p2Char: p2.character,
              scenario: readyRoom.gameState.scenario || 'scenario1',
              roomCode: roomCode,
              playerIndex: 0 // Host is player 1
            }, true);
          } else {
            console.log('[SERVER] Waiting for:', {
              p1Ready: p1?.ready,
              p2Ready: p2?.ready,
              p1Scene: p1?.scene,
              p2Scene: p2?.scene,
              p1Char: p1?.character,
              p2Char: p2?.character
            });
          }
          break;

        case 'game_action':
          const currentRoom = gameRooms.get(roomCode);
          if (!currentRoom) return;

          // Expect data.action to be an object: { type: 'hit', player: 'p1' | 'p2' | ... }
          if (data.action && data.action.type === 'hit' && data.action.target) {
            // Increment hit count for the attacker
            const attackerKey = data.action.player;
            const attackerState = getPlayerState(currentRoom, attackerKey);
            attackerState.hits = (attackerState.hits || 0) + 1;
            if (attackerState.hits >= 3 && !attackerState.specialEnabled) {
              attackerState.specialEnabled = true;
              // Notify both players that special is enabled for this player
              if (currentRoom.host) currentRoom.host.send(JSON.stringify({ type: 'special_enabled', player: attackerKey }));
              if (currentRoom.client) currentRoom.client.send(JSON.stringify({ type: 'special_enabled', player: attackerKey }));
            }
          }

          // If action is special used, reset counter
          if (data.action && data.action.type === 'special' && data.action.player) {
            const userKey = data.action.player;
            const userState = getPlayerState(currentRoom, userKey);
            userState.hits = 0;
            userState.specialEnabled = false;
          }

          // Forward the action to the other player
          const target = isHost ? currentRoom.client : currentRoom.host;
          if (target) {
            target.send(JSON.stringify({
              type: 'game_action',
              action: data.action
            }));
          }
          break;
      
        // --- RELAY ALL OTHER GAMEPLAY MESSAGES ---
        default: {
          const relayRoom = gameRooms.get(roomCode);
          if (!relayRoom) return;

          // List of system message types to NOT relay
          const systemTypes = [
            'create_room', 'join_room', 'player_joined', 'game_joined',
            'player_selected', 'playerSelected', 'player_ready', 'scenario_selected',
            'game_start', 'game_action'
          ];
          if (!systemTypes.includes(data.type)) {
            const relayTarget = isHost ? relayRoom.client : relayRoom.host;
            if (relayTarget) {
              relayTarget.send(JSON.stringify(data));
              console.log(`[Server] Relayed message of type '${data.type}' from ${isHost ? 'host' : 'guest'} to ${isHost ? 'guest' : 'host'} in room ${roomCode}`);
            }
          }
        }
        break;
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    
    // Clean up the room if either player disconnects
    if (roomCode) {
      const room = gameRooms.get(roomCode);
      if (room) {
        // Notify the other player
        const otherPlayer = isHost ? room.client : room.host;
        if (otherPlayer) {
          otherPlayer.send(JSON.stringify({ 
            type: 'player_disconnected'
          }));
        }
        
        // Remove the room
        gameRooms.delete(roomCode);
      }
    }
  });
});

console.log(`WebSocket server running on ws://${HOST}:${PORT}`);
