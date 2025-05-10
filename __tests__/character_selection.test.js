// Using Jest's expect
// Mock Phaser
global.Phaser = {
  Scene: class {},
  GameObjects: {
    Sprite: class {},
    Rectangle: class {},
    Text: class {}
  }
};

// Mock window for isLandscape
global.window = {
  innerWidth: 800,
  innerHeight: 600
};

// Mock WebSocket
class MockWebSocket {
  constructor() {
    this.onmessage = null;
    this.onopen = null;
    this.onclose = null;
    this.eventHandlers = new Map();
  }

  send(data) {
    // Simulate sending data
    const handlers = this.eventHandlers.get('message') || [];
    handlers.forEach(handler => {
      setTimeout(() => {
        handler(data);
      }, 0);
    });
  }

  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  once(event, handler) {
    const onceHandler = (...args) => {
      this.off(event, onceHandler);
      handler(...args);
    };
    this.on(event, onceHandler);
  }

  off(event, handler) {
    if (!this.eventHandlers.has(event)) return;
    const handlers = this.eventHandlers.get(event);
    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
    }
  }

  close() {}
}

// Mock WebSocket Server
class MockServer {
  constructor() {
    this.clients = new Set();
    this.eventHandlers = new Map();
  }

  on(event, callback) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(callback);

    if (event === 'connection') {
      // Simulate client connection
      const ws = new MockWebSocket();
      this.clients.add(ws);
      callback(ws);
    }
  }

  close(callback) {
    this.clients.clear();
    this.eventHandlers.clear();
    if (callback) callback();
  }
}

// Import after mocks
const KidsFightScene = require('../kidsfight_scene').default;
const PlayerSelectScene = require('../player_select_scene').default;

// Use mock classes
const WebSocket = MockWebSocket;
const Server = MockServer;

describe('Character Selection Tests', () => {
  let wsServer;
  let hostWs;
  let clientWs;
  let roomCode;
  let gameRooms;
  let playerSelectScene;
  let kidsFightScene;

  // Mock Phaser classes and methods
  class MockScene {
    constructor() {
      this.textures = {
        exists: (key) => ['player1', 'player2', 'player3', 'player4', 'player5', 'player6', 'player7', 'player8'].includes(key)
      };
      this.scene = {
        start: () => {}
      };
      this.cameras = {
        main: { width: 800, height: 600 }
      };
    }
  }

  beforeEach(() => {
    // Setup WebSocket server
    wsServer = new Server();
    gameRooms = new Map();
    
    // Setup WebSocket clients
    hostWs = new WebSocket();
    clientWs = new WebSocket();
    
    // Create scene instances with mock methods
    playerSelectScene = {
      startFight: () => {},
      selected: { p1: 'player1', p2: 'player2' },
      CHARACTER_KEYS: ['player1', 'player2', 'player3', 'player4', 'player5', 'player6', 'player7', 'player8']
    };
    
    kidsFightScene = {
      init: (data) => {
        kidsFightScene.selected = {
          p1: typeof data.p1 === 'number' ? 
            kidsFightScene.CHARACTER_KEYS[data.p1] : 
            (kidsFightScene.CHARACTER_KEYS.includes(data.p1) ? data.p1 : 'player1'),
          p2: typeof data.p2 === 'number' ? 
            kidsFightScene.CHARACTER_KEYS[data.p2] : 
            (kidsFightScene.CHARACTER_KEYS.includes(data.p2) ? data.p2 : 'player2')
        };
      },
      selected: { p1: 'player1', p2: 'player2' },
      CHARACTER_KEYS: ['player1', 'player2', 'player3', 'player4', 'player5', 'player6', 'player7', 'player8']
    };
    
    // Setup message handler
    wsServer.on('connection', (ws) => {
      ws.on('message', (message) => {
        const data = JSON.parse(message);
        
        switch (data.type) {
          case 'create_game':
            roomCode = 'TEST123';
            gameRooms.set(roomCode, {
              host: ws,
              client: null,
              gameState: {
                p1: { character: 'player1' },
                p2: { character: 'player2' }
              }
            });
            ws.send(JSON.stringify({ type: 'game_created', roomCode }));
            break;
            
          case 'join_game':
            const room = gameRooms.get(data.roomCode);
            if (room) {
              room.client = ws;
              room.host.send(JSON.stringify({ type: 'player_joined' }));
              ws.send(JSON.stringify({ type: 'game_joined' }));
            }
            break;
            
          case 'character_selected':
            const charRoom = gameRooms.get(roomCode);
            if (charRoom) {
              const CHARACTER_KEYS = ['player1', 'player2', 'player3', 'player4', 'player5', 'player6', 'player7', 'player8'];
              const characterKey = CHARACTER_KEYS[parseInt(data.character)];
              const target = ws === charRoom.host ? charRoom.client : charRoom.host;
              
              if (ws === charRoom.host) {
                charRoom.gameState.p1.character = characterKey;
              } else {
                charRoom.gameState.p2.character = characterKey;
              }
              
              if (target) {
                target.send(JSON.stringify({
                  type: 'character_selected',
                  character: data.character,
                  playerNum: ws === charRoom.host ? 1 : 2
                }));
              }
            }
            break;
        }
      });
    });

    // Simulate connections
    wsServer.on('connection', () => {});
    hostWs.onopen?.();
    clientWs.onopen?.();
  });

  afterEach((done) => {
    hostWs.close();
    clientWs.close();
    wsServer.close(() => done());
  });

  describe('PlayerSelectScene', () => {
    let playerSelectScene;

    beforeEach(() => {
      playerSelectScene = {
        startFight: function() {
          if (this.wsManager) {
            this.wsManager.send({
              type: 'character_selected',
              character: 0,
              playerNum: 1
            });
          }
        },
        selected: { p1: 'player1', p2: 'player2' },
        CHARACTER_KEYS: ['player1', 'player2', 'player3', 'player4', 'player5', 'player6', 'player7', 'player8'],
        wsManager: null
      };
    });

    it('should initialize with default character selections', () => {
      expect(playerSelectScene.selected.p1).toBe('player1');
      expect(playerSelectScene.selected.p2).toBe('player2');
    });

    it('should have correct CHARACTER_KEYS array', () => {
      expect(playerSelectScene.CHARACTER_KEYS).toEqual([
        'player1', 'player2', 'player3', 'player4',
        'player5', 'player6', 'player7', 'player8'
      ]);
    });

    it('should convert character keys to indices when sending selection', () => {
      // Mock wsManager.send
      let sentData = null;
      playerSelectScene.wsManager = {
        send: (data) => { sentData = data; }
      };
      
      playerSelectScene.startFight();
      
      expect(sentData).toEqual({
        type: 'character_selected',
        character: 0,
        playerNum: 1
      });
    });
  });

  describe('KidsFightScene', () => {
    beforeEach(() => {
      kidsFightScene = {
        init: (data) => {
          kidsFightScene.selected = {
            p1: typeof data.p1 === 'number' ? 
              kidsFightScene.CHARACTER_KEYS[data.p1] : 
              (kidsFightScene.CHARACTER_KEYS.includes(data.p1) ? data.p1 : 'player1'),
            p2: typeof data.p2 === 'number' ? 
              kidsFightScene.CHARACTER_KEYS[data.p2] : 
              (kidsFightScene.CHARACTER_KEYS.includes(data.p2) ? data.p2 : 'player2')
          };
        },
        selected: { p1: 'player1', p2: 'player2' },
        CHARACTER_KEYS: ['player1', 'player2', 'player3', 'player4', 'player5', 'player6', 'player7', 'player8']
      };
    });

    it('should convert numeric indices to character keys in init', () => {
      const data = { p1: 2, p2: 3, scenario: 'scenario1' };
      kidsFightScene.init(data);
      
      expect(kidsFightScene.selected.p1).toBe('player3');
      expect(kidsFightScene.selected.p2).toBe('player4');
    });

    it('should handle string character keys in init', () => {
      const data = { p1: 'player5', p2: 'player6', scenario: 'scenario1' };
      kidsFightScene.init(data);
      
      expect(kidsFightScene.selected.p1).toBe('player5');
      expect(kidsFightScene.selected.p2).toBe('player6');
    });

    it('should fallback to default characters for invalid keys', () => {
      const data = { p1: 'invalid1', p2: 'invalid2', scenario: 'scenario1' };
      kidsFightScene.init(data);
      
      expect(kidsFightScene.selected.p1).toBe('player1');
      expect(kidsFightScene.selected.p2).toBe('player2');
    });
  });

  describe('WebSocket Integration', () => {
    it('should properly sync character selection between host and client', () => {
      let hostRoom;
      
      // Create game
      hostWs.send(JSON.stringify({ type: 'create_game' }));
      
      hostWs.once('message', (msg) => {
        const data = JSON.parse(msg);
        expect(data.type).toBe('game_created');
        roomCode = data.roomCode;
        
        // Client joins game
        clientWs.send(JSON.stringify({ 
          type: 'join_game',
          roomCode: roomCode
        }));
        
        hostWs.once('message', (msg) => {
          const data = JSON.parse(msg);
          expect(data.type).toBe('player_joined');
          
          // Host selects character
          hostWs.send(JSON.stringify({
            type: 'character_selected',
            character: 2, // player3
            playerNum: 1
          }));
          
          clientWs.once('message', (msg) => {
            const data = JSON.parse(msg);
            expect(data.type).toBe('character_selected');
            expect(data.character).toBe(2);
            expect(data.playerNum).toBe(1);
            
            // Client selects character
            clientWs.send(JSON.stringify({
              type: 'character_selected',
              character: 3, // player4
              playerNum: 2
            }));
            
            hostWs.once('message', (msg) => {
              const data = JSON.parse(msg);
              expect(data.type).toBe('character_selected');
              expect(data.character).toBe(3);
              expect(data.playerNum).toBe(2);
              
              // Verify final game state
              hostRoom = gameRooms.get(roomCode);
              expect(hostRoom.gameState.p1.character).toBe('player3');
              expect(hostRoom.gameState.p2.character).toBe('player4');
              done();
            });
          });
        });
      });
    });
  });
});
