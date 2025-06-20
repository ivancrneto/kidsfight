const WebSocket = require('ws');
const PORT = process.argv[2] ? parseInt(process.argv[2], 10) : 8081;
const server = new WebSocket.Server({ port: PORT });
console.log(`WebSocket server running on port ${PORT}`);

// Store active game rooms
const gameRooms = new Map();

// Helper to get or init player state in a room
function getPlayerState(room, playerKey) {
  if (!room.gameState[playerKey]) {
    room.gameState[playerKey] = { hits: 0, specialEnabled: false };
  }
  return room.gameState[playerKey];
}

// Helper to check if both players are ready and have selected characters
function shouldStartGame(room) {
  const p1 = room.gameState.p1;
  const p2 = room.gameState.p2;
  return (
    p1 && p2 &&
    p1.ready && p2.ready &&
    p1.character && p2.character
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
          ws.send(JSON.stringify({ type: 'room_created', roomCode }));
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
              action: data.action,
              ...(typeof data.action === 'object' && data.action && 'payload' in data ? { payload: data.action.payload } : {})
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

console.log('WebSocket server running on ws://localhost:8081');
