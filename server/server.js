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

function generateRoomCode() {
  if (process.env.NODE_ENV === 'development' && !gameRooms.has('111111')) {
    return '111111';
  }
  for (let i = 0; i < 20; i++) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    if (!gameRooms.has(code)) return code;
  }
  return Date.now().toString().slice(-6);
}

function socketOpen(sock) {
  return sock && sock.readyState === WebSocket.OPEN;
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
          // Never replace a room that still has a connected player.
          roomCode = generateRoomCode();

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
          
          if (socketOpen(room.client)) {
            ws.send(JSON.stringify({ type: 'error', message: 'Room is full' }));
            return;
          }

          // Join the room
          room.client = ws;
          roomCode = data.roomCode;
          isHost = false;

          // Notify both players
          if (socketOpen(room.host)) {
            room.host.send(JSON.stringify({
              type: 'player_joined',
              roomCode: roomCode
            }));
          }
          
          ws.send(JSON.stringify({ 
            type: 'game_joined',
            roomCode: roomCode,
            playerIndex: 1,
            isHost: false
          }));

          console.log(`Player joined room: ${roomCode}`);
          break;

        case 'rejoin_room': {
          const rejoin = gameRooms.get(data.roomCode);
          if (!rejoin) {
            ws.send(JSON.stringify({ type: 'error', message: 'Room not found' }));
            return;
          }
          const wantHost = !!data.isHost;
          if (wantHost) {
            if (socketOpen(rejoin.host) && rejoin.host !== ws) {
              ws.send(JSON.stringify({ type: 'error', message: 'Room is full' }));
              return;
            }
            rejoin.host = ws;
            isHost = true;
          } else {
            if (socketOpen(rejoin.client) && rejoin.client !== ws) {
              ws.send(JSON.stringify({ type: 'error', message: 'Room is full' }));
              return;
            }
            rejoin.client = ws;
            isHost = false;
          }
          roomCode = data.roomCode;
          ws.send(JSON.stringify({
            type: 'room_rejoined',
            roomCode,
            isHost,
            playerIndex: isHost ? 0 : 1
          }));
          const other = isHost ? rejoin.client : rejoin.host;
          if (socketOpen(other)) {
            other.send(JSON.stringify({ type: 'player_rejoined', roomCode }));
          }
          break;
        }

        case 'player_selected':
        case 'playerSelected': {
          const selRoom = gameRooms.get(roomCode);
          if (!selRoom) return;
          // Host owns p1, guest owns p2. Either side used to overwrite the other.
          if (isHost && data.player !== 'p1') return;
          if (!isHost && data.player !== 'p2') return;
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
          if (!isHost) return;
          const scRoom = gameRooms.get(roomCode);
          if (!scRoom) return;
          // Store scenario in game state
          scRoom.gameState.scenario = data.scenario;
          // Forward scenario selection to client only (not back to host)
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
      
        case 'replay_request': {
          const replayRoom = gameRooms.get(roomCode);
          if (!replayRoom) return;
          // Forward replay request to the other player
          const target = isHost ? replayRoom.client : replayRoom.host;
          if (target) {
            target.send(JSON.stringify({
              type: 'replay_request',
              matchId: data.matchId,
              playerId: data.playerId,
              roomCode: roomCode
            }));
          }
          break;
        }
        
        case 'replay_response': {
          const replayRoom = gameRooms.get(roomCode);
          if (!replayRoom) return;
          // Forward replay response to the other player
          const target = isHost ? replayRoom.client : replayRoom.host;
          if (target) {
            target.send(JSON.stringify({
              type: 'replay_response',
              matchId: data.matchId,
              accepted: data.accepted,
              roomCode: roomCode
            }));
          }
          // If accepted, both players should restart the game
          if (data.accepted) {
            // Reset game state
            replayRoom.gameState.p1.ready = false;
            replayRoom.gameState.p2.ready = false;
            replayRoom.gameState.p1.hits = 0;
            replayRoom.gameState.p2.hits = 0;
            replayRoom.gameState.p1.specialEnabled = false;
            replayRoom.gameState.p2.specialEnabled = false;
            // Send restart signal to both players
            if (replayRoom.host) {
              replayRoom.host.send(JSON.stringify({
                type: 'game_restart',
                roomCode: roomCode
              }));
            }
            if (replayRoom.client) {
              replayRoom.client.send(JSON.stringify({
                type: 'game_restart',
                roomCode: roomCode
              }));
            }
          }
          break;
        }
        
        // --- RELAY ALL OTHER GAMEPLAY MESSAGES ---
        default: {
          const relayRoom = gameRooms.get(roomCode);
          if (!relayRoom) return;

          // List of system message types to NOT relay
          const systemTypes = [
            'create_room', 'join_room', 'rejoin_room', 'player_joined', 'game_joined',
            'player_selected', 'playerSelected', 'player_ready', 'scenario_selected',
            'game_start', 'game_action', 'room_rejoined'
          ];
          if (!systemTypes.includes(data.type)) {
            const senderIndex = isHost ? 0 : 1;
            const opponentIndex = isHost ? 1 : 0;
            // The host is the only one who may end the match.
            if (data.type === 'game_over' && !isHost) return;
            // Movement and attacks always belong to the socket that sent them.
            if (['attack', 'special', 'block', 'jump', 'move', 'position_update'].includes(data.type)) {
              data.playerIndex = senderIndex;
            }
            // Health reports describe the opponent, not the sender's own bar.
            if (data.type === 'health_update' && data.playerIndex !== opponentIndex) return;

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

    if (!roomCode) return;
    const room = gameRooms.get(roomCode);
    if (!room) return;

    // Drop only this socket so the other player can wait for a rejoin.
    if (isHost && room.host === ws) room.host = null;
    if (!isHost && room.client === ws) room.client = null;

    const otherPlayer = isHost ? room.client : room.host;
    if (socketOpen(otherPlayer)) {
      otherPlayer.send(JSON.stringify({ type: 'player_disconnected' }));
    }

    if (!socketOpen(room.host) && !socketOpen(room.client)) {
      gameRooms.delete(roomCode);
    }
  });
});

console.log('WebSocket server running on ws://localhost:8081');
