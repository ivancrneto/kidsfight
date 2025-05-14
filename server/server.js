const WebSocket = require('ws');
const http = require('http');
const PORT = process.env.PORT || 8081;

// Create HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('WebSocket server for Kids Fight game');
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Store active game rooms
const gameRooms = new Map();

// Create a new room with the provided code
function createRoom(roomCode, host, character) {
  if (gameRooms.has(roomCode)) {
    return false; // Room already exists
  }
  
  gameRooms.set(roomCode, {
    host,
    client: null,
    hostReady: false,
    clientReady: false,
    hostReplayRequest: null,
    clientReplayRequest: null,
    gameState: {
      p1: { character: character, ready: false },
      p2: { character: null, ready: false }
    }
  });
  
  return true;
}

// Generate a random room code
function generateRoomCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// WebSocket server connection handler
wss.on('connection', (ws) => {
  console.log('Client connected');
  let roomCode = null;
  let isHost = false;
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received:', data);
      
      switch (data.type) {
        case 'create_game':
          // Generate a unique room code
          roomCode = generateRoomCode();
          while (gameRooms.has(roomCode)) {
            roomCode = generateRoomCode();
          }
          
          // Create a new game room with ready states
          if (!createRoom(roomCode, ws, data.character)) {
            console.error(`[ERROR] Failed to create room ${roomCode}`);
            return;
          }
          
          isHost = true;
          
          // Send room code to host
          ws.send(JSON.stringify({ 
            type: 'game_created',
            roomCode: roomCode
          }));
          
          console.log(`Game created with room code: ${roomCode}`);
          break;
          
        case 'join_game':
          // Check if room exists
          const room = gameRooms.get(data.roomCode);
          if (!room) {
            console.log(`[ERROR] Room ${data.roomCode} not found`);
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: `Room '${data.roomCode}' not found.` 
            }));
            return;
          }
          
          if (room.client) {
            console.log(`[ERROR] Room ${data.roomCode} is full`);
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: `Room '${data.roomCode}' is already full.` 
            }));
            return;
          }
          
          console.log(`[SUCCESS] Client joining room: ${data.roomCode}`);
          // Log all active rooms for debugging
          console.log(`[ROOMS] Active rooms after join: ${Array.from(gameRooms.keys()).join(', ')}`);
          console.log(`[ROOM STATE] Room ${data.roomCode} state:`, gameRooms.get(data.roomCode));

          // Join the room
          room.client = ws;
          roomCode = data.roomCode;
          isHost = false;

          // Notify both players
          room.host.send(JSON.stringify({ 
            type: 'player_joined',
            roomCode: roomCode // Send room code to host
          }));
          
          ws.send(JSON.stringify({ 
            type: 'game_joined',
            roomCode: roomCode // Send room code to client
          }));

          console.log(`Player joined room: ${roomCode}`);
          break;

        case 'character_selected':
          const charRoom = gameRooms.get(roomCode);
          if (!charRoom) return;
          
          // Convert character index to key
          const CHARACTER_KEYS = ['player1', 'player2', 'player3', 'player4', 'player5', 'player6', 'player7', 'player8'];
          const characterKey = CHARACTER_KEYS[parseInt(data.character)];
          if (isHost) {
            charRoom.gameState.p1.character = characterKey;
          } else {
            charRoom.gameState.p2.character = characterKey;
          }
          
          // Forward character selection to the other player
          const charTarget = isHost ? charRoom.client : charRoom.host;
          if (charTarget) {
            charTarget.send(JSON.stringify({
              type: 'character_selected',
              character: data.character,
              playerNum: isHost ? 1 : 2
            }));
          }
          break;
          
        case 'scenario_selected':
          const scenarioRoom = gameRooms.get(roomCode);
          if (!scenarioRoom) {
            console.error(`[ERROR] Room ${roomCode} not found for scenario_selected message`);
            return;
          }
          
          // Only the host can select the scenario
          if (!isHost) {
            console.error(`[ERROR] Non-host client tried to select scenario in room ${roomCode}`);
            return;
          }
          
          console.log(`[SCENARIO] Host selected scenario: ${data.scenario} in room ${roomCode}`);
          
          // Store the selected scenario in the game state
          if (!scenarioRoom.gameState.scenario) {
            scenarioRoom.gameState.scenario = {};
          }
          scenarioRoom.gameState.scenario.key = data.scenario;
          
          // Forward scenario selection to the client
          if (scenarioRoom.client) {
            console.log(`[SCENARIO] Forwarding scenario selection to client in room ${roomCode}`);
            scenarioRoom.client.send(JSON.stringify({
              type: 'scenario_selected',
              scenario: data.scenario
            }));
          } else {
            console.error(`[ERROR] Cannot forward scenario selection - client not connected in room ${roomCode}`);
          }
          break;
        
        case 'player_ready':
          const readyRoom = gameRooms.get(roomCode);
          if (!readyRoom) {
            console.error(`[ERROR] Room ${roomCode} not found for player_ready message`);
            return;
          }
          
          console.log(`[PLAYER READY] Received player_ready from ${isHost ? 'Host' : 'Guest'} in room ${roomCode}`);
          console.log(`[PLAYER READY] Current room state before update:`, JSON.stringify(readyRoom.gameState));
          
          // Update player ready state
          if (isHost) {
            readyRoom.gameState.p1.ready = true;
            readyRoom.gameState.p1.character = data.character;
            console.log(`[PLAYER READY] Host is ready with character ${data.character}`);
          } else {
            readyRoom.gameState.p2.character = data.character;
            readyRoom.gameState.p2.ready = true;
            console.log(`[PLAYER READY] Guest is ready with character ${data.character}`);
          }
          
          console.log(`[PLAYER READY] Room: ${roomCode}, Player: ${isHost ? 'Host' : 'Guest'}`);
          console.log(`[ROOM STATE] Updated state: P1 ready: ${readyRoom.gameState.p1.ready}, P2 ready: ${readyRoom.gameState.p2.ready}`);
          console.log(`[ROOM STATE] Full state after update:`, JSON.stringify(readyRoom.gameState));
          
          // Notify the other player about ready state
          const readyTarget = isHost ? readyRoom.client : readyRoom.host;
          if (readyTarget) {
            console.log(`[PLAYER READY] Notifying ${isHost ? 'Guest' : 'Host'} that ${isHost ? 'Host' : 'Guest'} is ready`);
            readyTarget.send(JSON.stringify({
              type: 'player_ready',
              player: isHost ? 1 : 2
            }));
          } else {
            console.error(`[ERROR] Cannot notify other player - ${isHost ? 'Guest' : 'Host'} not connected`);
          }
          
          // Check if both players are ready
          if (readyRoom.gameState.p1.ready && readyRoom.gameState.p2.ready) {
            console.log(`[GAME START] Both players ready in room ${roomCode}! Sending start_game messages.`);
            
            // Send start game message to both players with the selected scenario
            try {
              // Get the selected scenario if it exists
              const selectedScenario = readyRoom.gameState.scenario?.key || 'scenario1';
              console.log(`[GAME START] Using scenario: ${selectedScenario}`);
              
              if (readyRoom.host) {
                console.log(`[GAME START] Sending start_game to Host`);
                readyRoom.host.send(JSON.stringify({
                  type: 'start_game',
                  scenario: selectedScenario,
                  health: [100, 100]
                }));
              } else {
                console.error(`[ERROR] Cannot send start_game to Host - not connected`);
              }
              
              if (readyRoom.client) {
                console.log(`[GAME START] Sending start_game to Guest`);
                readyRoom.client.send(JSON.stringify({
                  type: 'start_game',
                  scenario: selectedScenario,
                  health: [100, 100]
                }));
              } else {
                console.error(`[ERROR] Cannot send start_game to Guest - not connected`);
              }
            } catch (error) {
              console.error(`[ERROR] Error sending start_game messages:`, error);
            }
          } else {
            console.log(`[GAME START] Not starting game yet - waiting for both players to be ready`);
          }
          break;
        
        case 'replay_request':
          const replayRoom = gameRooms.get(roomCode);
          if (!replayRoom) {
            console.error(`[ERROR] Room ${roomCode} not found for replay_request message`);
            return;
          }
          
          console.log(`[REPLAY REQUEST] Received from ${isHost ? 'Host' : 'Guest'} in room ${roomCode}: ${data.action}`);
          
          // Check if the other player has already requested the same action
          const otherPlayerRequest = isHost ? replayRoom.clientReplayRequest : replayRoom.hostReplayRequest;
          if (otherPlayerRequest && otherPlayerRequest.action === data.action) {
            console.log(`[REPLAY REQUEST] Both players requested ${data.action} - auto-accepting`);
            
            // Send auto-accept responses to both players
            const responseData = {
              type: 'replay_response',
              accepted: true,
              action: data.action,
              autoAccepted: true
            };
            
            // Send to requesting player
            ws.send(JSON.stringify(responseData));
            
            // Send to other player
            const replayTarget = isHost ? replayRoom.client : replayRoom.host;
            if (replayTarget) {
              replayTarget.send(JSON.stringify(responseData));
            }
            
            // Clear the request flags
            replayRoom.hostReplayRequest = null;
            replayRoom.clientReplayRequest = null;
          } else {
            // Store this request
            if (isHost) {
              replayRoom.hostReplayRequest = data;
            } else {
              replayRoom.clientReplayRequest = data;
            }
            
            // Forward the replay request to the other player
            const replayTarget = isHost ? replayRoom.client : replayRoom.host;
            if (replayTarget) {
              console.log(`[REPLAY REQUEST] Forwarding to ${isHost ? 'Guest' : 'Host'} in room ${roomCode}`);
              replayTarget.send(JSON.stringify(data));
            } else {
              console.error(`[ERROR] Cannot forward replay request - other player not connected`);
              // Send rejection response back to requester
              ws.send(JSON.stringify({
                type: 'replay_response',
                accepted: false,
                action: data.action,
                message: 'Other player is not connected'
              }));
            }
          }
          break;
          
        case 'replay_response':
          const responseRoom = gameRooms.get(roomCode);
          if (!responseRoom) {
            console.error(`[ERROR] Room ${roomCode} not found for replay_response message`);
            return;
          }
          
          console.log(`[REPLAY RESPONSE] Received from ${isHost ? 'Host' : 'Guest'} in room ${roomCode}: ${data.accepted ? 'ACCEPTED' : 'REJECTED'} for ${data.action}`);
          
          // Forward the replay response to the other player
          const responseTarget = isHost ? responseRoom.client : responseRoom.host;
          if (responseTarget) {
            console.log(`[REPLAY RESPONSE] Forwarding to ${isHost ? 'Guest' : 'Host'} in room ${roomCode}`);
            responseTarget.send(JSON.stringify(data));
          } else {
            console.error(`[ERROR] Cannot forward replay response - other player not connected`);
          }
          break;
          
        case 'game_action':
          const currentRoom = gameRooms.get(roomCode);
          if (!currentRoom) {
            console.error(`Room ${roomCode} not found for game action`);
            return;
          }

          // Enhanced logging for game actions
          console.log(`[GAME ACTION] Room: ${roomCode}, From: ${isHost ? 'Host' : 'Guest'}, Action: ${JSON.stringify(data.action)}`);

          // Forward the action to the other player
          const target = isHost ? currentRoom.client : currentRoom.host;
          if (target) {
            console.log(`[FORWARDING] To: ${isHost ? 'Guest' : 'Host'}, Action: ${JSON.stringify(data.action)}`);
            target.send(JSON.stringify({
              type: 'game_action',
              action: data.action
            }));
          } else {
            console.error(`[ERROR] Cannot forward action - ${isHost ? 'Guest' : 'Host'} not connected`);
          }
          break;
        
        case 'health_update':
          const healthRoom = gameRooms.get(roomCode);
          if (!healthRoom) {
            console.error(`Room ${roomCode} not found for health update`);
            return;
          }

          // CRITICAL: Need to identify the affected player in a way the receiver understands
          // For online play between two players, we'll use a simple rule:
          // When host attacks guest, playerIndex is 1 (guest's health)
          // When guest attacks host, playerIndex is 0 (host's health)
          
          // Determine which player was attacked
          const senderIsHost = isHost;
          const attackedPlayerIndex = data.playerIndex;
          
          // Enhanced logging to diagnose the health update message
          console.log(`[HEALTH SERVER] RECEIVED HEALTH UPDATE:`, {
            roomCode, 
            senderIsHost,
            message: `${senderIsHost ? 'Host' : 'Guest'} reports that Player ${attackedPlayerIndex}'s health is now ${data.health}`,
            rawMessage: data
          });

          // Forward the health update to the other player with clear identification
          const healthTarget = isHost ? healthRoom.client : healthRoom.host;
          if (healthTarget) {
            console.log(`[HEALTH SERVER] FORWARDING to ${isHost ? 'Guest' : 'Host'}`, {
              playerIndex: attackedPlayerIndex,
              health: data.health,
              message: `Your health is now ${data.health}`
            });
            
            healthTarget.send(JSON.stringify({
              type: 'health_update',
              playerIndex: attackedPlayerIndex,
              health: data.health
            }));
          } else {
            console.error(`[HEALTH SERVER] ERROR: Cannot forward health update - ${isHost ? 'Guest' : 'Host'} not connected`);
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
        
        // Remove the room if the host disconnects, or clear the client if the client disconnects
        if (isHost) {
          gameRooms.delete(roomCode);
          console.log(`Room ${roomCode} deleted because host disconnected`);
        } else {
          room.client = null;
          console.log(`Client removed from room ${roomCode}`);
        }
      }
    }
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`WebSocket server is running on port ${PORT}`);
});
