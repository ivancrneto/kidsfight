const WebSocket = require('ws');
const server = new WebSocket.Server({ port: 8081 });

// Store active game rooms
const gameRooms = new Map();

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
          roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
          while (gameRooms.has(roomCode)) {
            roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
          }
          
          // Create new room
          gameRooms.set(roomCode, {
            host: ws,
            client: null,
            gameState: {
              p1: { character: 'player1' }, // Default character
              p2: { character: 'player2' }  // Default character
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
            roomCode: roomCode
          }));

          console.log(`Player joined room: ${roomCode}`);
          break;

        case 'player_selected':
          const selRoom = gameRooms.get(roomCode);
          if (!selRoom) return;
          // Forward selection to the other player
          const selTarget = isHost ? selRoom.client : selRoom.host;
          if (selTarget) {
            selTarget.send(JSON.stringify({
            type: 'player_selected',
              data: data.data // forward the player and character fields as-is
            }));
          }
          break;
        // case 'player_selected':
        //   const charRoom = gameRooms.get(roomCode);
        //   if (!charRoom) return;
        //
        //   // Convert character index to key
        //   const CHARACTER_KEYS = ['player1', 'player2', 'player3', 'player4', 'player5', 'player6', 'player7', 'player8'];
        //   const characterKey = CHARACTER_KEYS[parseInt(data.character)];
        //   if (isHost) {
        //     charRoom.gameState.p1.character = characterKey;
        //   } else {
        //     charRoom.gameState.p2.character = characterKey;
        //   }
        //
        //   // Forward character selection to the other player
        //   const charTarget = isHost ? charRoom.client : charRoom.host;
        //   if (charTarget) {
        //     charTarget.send(JSON.stringify({
        //       type: 'playerer_selected',
        //       character: data.character,
        //       playerNum: isHost ? 1 : 2
        //     }));
        //   }
        //   break;
          
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
              roomCode: data.roomCode
            }));
          }
          
          if (room.client) {
            console.log('[Server] Forwarding game_start to guest');
            room.client.send(JSON.stringify({
              type: 'game_start',
              p1Char: data.p1Char,
              p2Char: data.p2Char,
              scenario: data.scenario,
              roomCode: data.roomCode
            }));
          }
          
          console.log('[Server] game_start message handling complete');
        }
        break;

        case 'game_action':
          const currentRoom = gameRooms.get(roomCode);
          if (!currentRoom) return;

          // Forward the action to the other player
          const target = isHost ? currentRoom.client : currentRoom.host;
          if (target) {
            target.send(JSON.stringify({
              type: 'game_action',
              action: data.action
            }));
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
