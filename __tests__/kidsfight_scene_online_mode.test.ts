// --- Ensure WebSocketManager is mocked at the module level ---
const mockWebSocketManager = {
  connect: jest.fn().mockResolvedValue(undefined),
  on: jest.fn(),
  send: jest.fn(),
  close: jest.fn(),
  sendGameAction: jest.fn(),
  sendPlayerDamage: jest.fn()
};
jest.mock('../websocket_manager', () => ({
  __esModule: true,
  default: mockWebSocketManager,
  WebSocketManager: Object.assign(
    jest.fn(() => mockWebSocketManager),
    { getInstance: jest.fn(() => mockWebSocketManager) }
  )
}));

import KidsFightScene from '../kidsfight_scene';
import Phaser from 'phaser';
import { createMockPhysicsAdd } from './test-utils';

// Helper to ensure player.body.blocked.down is always defined
function ensureBlockedDown(player) {
  if (!player) return;
  if (!player.body) player.body = {};
  if (!player.body.blocked) player.body.blocked = {};
  player.body.blocked.down = true;
  if (!player.body.velocity) player.body.velocity = {};
  if (typeof player.body.velocity.x !== 'number') player.body.velocity.x = 0;
  if (typeof player.body.velocity.y !== 'number') player.body.velocity.y = 0;
}

// Defensive utility to always ensure setFrame exists
function ensureSetFrame(player) {
  if (player && typeof player.setFrame !== 'function') {
    player.setFrame = jest.fn();
  }
}

// Helper to create a mock player
function createMockPlayer() {
  const player = {
    setVelocityX: jest.fn(),
    setVelocityY: jest.fn(),
    setFlipX: jest.fn(),
    setScale: jest.fn(),
    setCollideWorldBounds: jest.fn(),
    setBounce: jest.fn(),
    setOrigin: jest.fn(),
    setFrame: jest.fn(),
    setVisible: jest.fn(),
    destroy: jest.fn(),
    setGravityY: jest.fn(),
    setSize: jest.fn(),
    setOffset: jest.fn(),
    setDepth: jest.fn(),
    body: { 
      velocity: { x: 0, y: 0 }, 
      touching: { down: true },
      blocked: { down: true, up: false, left: false, right: false },
      setVelocityX: jest.fn(),
      setVelocityY: jest.fn(),
      setSize: jest.fn(),
      setOffset: jest.fn(),
      allowGravity: true,
      immovable: false,
      enable: true,
      onFloor: jest.fn().mockReturnValue(true),
      x: 0,
      y: 0,
      width: 50,
      height: 100
    },
    x: 0,
    y: 0,
    width: 50,
    height: 100,
    setAccelerationX: jest.fn(),
    setAccelerationY: jest.fn(),
    setMaxVelocityX: jest.fn(),
    setMaxVelocityY: jest.fn(),
    setDragX: jest.fn(),
    setDragY: jest.fn(),
    getData: jest.fn((key) => {
      if (key === 'isBlocking') return false;
      return undefined;
    }),
    setData: jest.fn(),
    anims: {
      play: jest.fn(),
      currentAnim: { key: 'idle' },
      get: jest.fn().mockReturnValue({ key: 'idle' })
    },
    texture: { key: 'player' },
    active: true,
    health: 100,
    special: 0,
    isBlocking: false,
    isAttacking: false,
    direction: 'right',
    walkAnimData: {
      frameTime: 0,
      currentFrame: 0,
      frameDelay: 0
    }
  };
  
  // Set up method chaining
  player.setVelocityX.mockImplementation((x) => {
    player.body.velocity.x = x;
    return player;
  });
  
  player.setVelocityY.mockImplementation((y) => {
    player.body.velocity.y = y;
    return player;
  });
  
  // Defensive check to ensure player.body.blocked.down is always defined
  if (!player.body) player.body = {};
  if (!player.body.blocked) player.body.blocked = {};
  if (typeof player.body.blocked.down === 'undefined') player.body.blocked.down = true;
  
  return player;
}

// Defensive utility to always ensure body.blocked.down exists and is true
function ensureBlockedDown(player) {
  if (!player) return;
  if (!player.body) player.body = {};
  if (!player.body.blocked) player.body.blocked = {};
  player.body.blocked.down = true;
  if (!player.body.velocity) player.body.velocity = {};
  if (typeof player.body.velocity.x !== 'number') player.body.velocity.x = 0;
  if (typeof player.body.velocity.y !== 'number') player.body.velocity.y = 0;
}

// Helper to create a mock scene with the minimum required properties
function createOnlineTestScene({ isHost }: { isHost: boolean }) {
  // Use the real KidsFightScene, not a stub or subclass
  const scene = new KidsFightScene();
  scene.physics = { add: {}, pause: jest.fn() };
  scene.gameMode = 'online';
  scene.isHost = isHost;
  const players = [createMockPlayer(), createMockPlayer()];
  players[0].x = 100;
  players[0].y = 300;
  players[1].x = 500;
  players[1].y = 300;
  scene.players = players;
  ensureBlockedDown(scene.players[0]);
  ensureBlockedDown(scene.players[1]);
  ensureSetFrame(scene.players[0]);
  ensureSetFrame(scene.players[1]);
  scene.wsManager = mockWebSocketManager;
  scene.keys = {
    left: { isDown: false },
    right: { isDown: false },
    up: { isDown: false },
    down: { isDown: false },
    attack: { isDown: false },
    special: { isDown: false },
    block: { isDown: false },
    v: { isDown: false },
    b: { isDown: false },
    k: { isDown: false },
    l: { isDown: false }
  };
  scene.playerBlocking = [false, false];
  scene.isAttacking = [false, false];
  scene.updatePlayerAnimation = jest.fn();
  // Remove any stub for update or handleRemoteAction so real logic runs
  delete scene.update;
  delete scene.handleRemoteAction;
  return scene;
}

// Create a test scene class that extends KidsFightScene for testing
class TestKidsFightScene extends KidsFightScene {
  // Override private properties to make them accessible for testing
  public players: Array<Phaser.Physics.Arcade.Sprite & { body: Phaser.Physics.Arcade.Body }> = [];
  public wsManager: any;
  public isHost: boolean;
  public gameMode: string;
  public keys: {
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    attack: Phaser.Input.Keyboard.Key;
    special: Phaser.Input.Keyboard.Key;
    block: Phaser.Input.Keyboard.Key;
    v: Phaser.Input.Keyboard.Key;
    b: Phaser.Input.Keyboard.Key;
    k: Phaser.Input.Keyboard.Key;
    l: Phaser.Input.Keyboard.Key;
  };
  
  constructor() {
    super({});
    
    // Initialize test keys
    this.keys = {
      left: { isDown: false } as Phaser.Input.Keyboard.Key,
      right: { isDown: false } as Phaser.Input.Keyboard.Key,
      up: { isDown: false } as Phaser.Input.Keyboard.Key,
      down: { isDown: false } as Phaser.Input.Keyboard.Key,
      attack: { isDown: false } as Phaser.Input.Keyboard.Key,
      special: { isDown: false } as Phaser.Input.Keyboard.Key,
      block: { isDown: false } as Phaser.Input.Keyboard.Key,
      v: { isDown: false } as Phaser.Input.Keyboard.Key,
      b: { isDown: false } as Phaser.Input.Keyboard.Key,
      k: { isDown: false } as Phaser.Input.Keyboard.Key,
      l: { isDown: false } as Phaser.Input.Keyboard.Key
    };
    
    // Initialize players with required properties
    this.players = [createMockPlayer(), createMockPlayer()];
    ensureBlockedDown(this.players[0]);
    ensureBlockedDown(this.players[1]);
    ensureSetFrame(this.players[0]);
    ensureSetFrame(this.players[1]);
    
    // Set up WebSocket manager mock
    this.wsManager = mockWebSocketManager;
  }
  
  // Override update method to make it public for testing
  public update(time: number, delta: number): void {
    super.update(time, delta);
  }
  
  // Override handleRemoteAction to make it public for testing
  public handleRemoteAction(action: any): void {
    super.handleRemoteAction(action);
  }
}

describe('KidsFightScene - Online Mode', () => {
  let scene: TestKidsFightScene;
  
  beforeEach(() => {
    // Create a new test scene for each test
    scene = new TestKidsFightScene();
    scene.physics = { add: {}, pause: jest.fn() };
    
    // Set up game mode and host status
    scene.gameMode = 'online';
    scene.isHost = true;
    
    // Robust player mocks for movement and animation
    const mockPlayer1 = {
      setVelocityX: jest.fn(),
      setVelocityY: jest.fn(),
      setFlipX: jest.fn(),
      setData: jest.fn(),
      getData: jest.fn(),
      active: true,
      body: {
        touching: { down: true },
        onFloor: jest.fn(() => true),
        enable: true,
        velocity: { x: 0, y: 0 },
        setSize: jest.fn()
      },
      x: 0,
      y: 0,
      destroy: jest.fn(),
      play: jest.fn(),
      setOrigin: jest.fn(),
      setDepth: jest.fn(),
      anims: { play: jest.fn() },
      texture: { key: 'players[0]' }
    };
    const mockPlayer2 = {
      setVelocityX: jest.fn(),
      setVelocityY: jest.fn(),
      setFlipX: jest.fn(),
      setData: jest.fn(),
      getData: jest.fn(),
      active: true,
      width: 64,
      height: 128,
      body: {
        setVelocityX: jest.fn(),
        setVelocityY: jest.fn(),
        setSize: jest.fn(),
        touching: { down: true }
      },
      x: 0,
      y: 0,
      destroy: jest.fn(),
      play: jest.fn(),
      setOrigin: jest.fn(),
      setDepth: jest.fn(),
      anims: { play: jest.fn() },
      texture: { key: 'players[1]' }
    };
    scene.players[0] = mockPlayer1;
    scene.players[1] = mockPlayer2;
    ensureBlockedDown(scene.players[0]);
    ensureBlockedDown(scene.players[1]);
    ensureSetFrame(scene.players[0]);
    ensureSetFrame(scene.players[1]);
    scene.wsManager = { sendGameAction: jest.fn() };
    
    // Setup keys
    scene.keys = {
      left: { isDown: false },
      right: { isDown: false },
      up: { isDown: false },
      down: { isDown: false },
      attack: { isDown: false },
      special: { isDown: false },
      block: { isDown: false }
    };
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Import the mock physics.add helper
    if (scene && scene.physics) {
      scene.physics.add = createMockPhysicsAdd();
    }
  });
  
  // Patch: Robust mock for physics.add.sprite with all Phaser chainable methods and body.blocked.down
  function createMockSprite() {
    return {
      setVelocityX: jest.fn().mockReturnThis(),
      setVelocityY: jest.fn().mockReturnThis(),
      setFlipX: jest.fn().mockReturnThis(),
      setFlipY: jest.fn().mockReturnThis(),
      setScale: jest.fn().mockReturnThis(),
      setCollideWorldBounds: jest.fn().mockReturnThis(),
      setBounce: jest.fn().mockReturnThis(),
      setGravityY: jest.fn().mockReturnThis(),
      setSize: jest.fn().mockReturnThis(),
      setOffset: jest.fn().mockReturnThis(),
      setDepth: jest.fn().mockReturnThis(),
      setOrigin: jest.fn().mockReturnThis(),
      setFrame: jest.fn().mockReturnThis(),
      setVisible: jest.fn().mockReturnThis(),
      setAlpha: jest.fn().mockReturnThis(),
      setActive: jest.fn().mockReturnThis(),
      setData: jest.fn().mockReturnThis(),
      getData: jest.fn().mockReturnValue(false),
      getCenter: jest.fn().mockReturnValue({ x: 0, y: 0 }),
      getBounds: jest.fn().mockReturnValue({ x: 0, y: 0, width: 50, height: 50 }),
      destroy: jest.fn(),
      anims: {
        play: jest.fn().mockReturnThis(),
        chain: jest.fn().mockReturnThis(),
        playAfterDelay: jest.fn().mockReturnThis(),
        playAfterRepeat: jest.fn().mockReturnThis(),
        currentAnim: { key: 'idle' }
      },
      texture: { key: 'player' },
      width: 64,
      height: 128,
      body: {
        velocity: { x: 0, y: 0 },
        touching: { down: true },
        blocked: { down: true },
        setVelocityX: jest.fn(),
        setVelocityY: jest.fn(),
        setSize: jest.fn(),
        setOffset: jest.fn(),
        allowGravity: true,
        immovable: false,
        enable: true,
        onFloor: jest.fn().mockReturnValue(true)
      },
      x: 0,
      y: 0
    };
  }

  // Patch physics.add.sprite in test setup
  beforeEach(() => {
    if (!scene.physics) scene.physics = { add: {}, pause: jest.fn() };
    if (!scene.physics.add) scene.physics.add = {};
    scene.physics.pause = jest.fn();
    scene.physics.add.sprite = jest.fn(() => createMockSprite());
  });
  
  describe('Player Movement', () => {
    it('should allow players[1] movement as guest in online mode', () => {
      scene.isHost = false;
      scene.gameMode = 'online';
      scene.players[1].setVelocityX = jest.fn();
      scene.players[1].setFlipX = jest.fn();
      scene.players[1].setData = jest.fn();
      scene.players[1].getData = jest.fn();
      scene.handleRemoteAction({ type: 'move', playerIndex: 1, direction: 1 });
      expect(scene.players[1].setVelocityX).toHaveBeenCalledWith(160);
      expect(scene.players[1].setFlipX).toHaveBeenCalledWith(false);
    });
    
    it('should NOT move players[1] as host in online mode', () => {
      scene.isHost = true;
      scene.gameMode = 'online';
      scene.players[1].setVelocityX = jest.fn();
      scene.players[1].setFlipX = jest.fn();
      scene.players[1].setData = jest.fn();
      scene.players[1].getData = jest.fn();
      scene.keys.right.isDown = true;
      scene.update(0, 1000);
      expect(scene.players[1].setVelocityX).not.toHaveBeenCalled();
    });
    
    it('should handle remote movement actions', () => {
      // Simulate receiving a remote movement action for players[0] (host)
      const moveAction = {
        type: 'move',
        playerIndex: 0,
        direction: 1
      };
      
      // Call handleRemoteAction directly
      scene.handleRemoteAction(moveAction);
      
      // Should update players[0] velocity based on remote action
      expect(scene.players[0].setVelocityX).toHaveBeenCalledWith(160);
      expect(scene.players[0].setFlipX).toHaveBeenCalledWith(false);
    });
    
    it('should handle remote jump actions', () => {
      // Simulate receiving a remote jump action for players[0] (host)
      const jumpAction = {
        type: 'jump',
        playerIndex: 0
      };
      
      // Call handleRemoteAction directly
      scene.handleRemoteAction(jumpAction);
      
      // Should make players[0] jump
      expect(scene.players[0].setVelocityY).toHaveBeenCalledWith(-330);
    });
  });
  
  describe('Attacks and Specials', () => {
    it('should handle remote attack actions', () => {
      // Mock tryAttack method
      const originalTryAttack = scene['tryAttack'];
      scene['tryAttack'] = jest.fn();
      
      // Simulate receiving a remote attack action for players[0] (host)
      const attackAction = {
        type: 'attack',
        playerIndex: 0
      };
      
      // Call handleRemoteAction directly
      scene.handleRemoteAction(attackAction);
      
      // Should call tryAttack with correct parameters
      expect(scene['tryAttack']).toHaveBeenCalledWith(
        0, // attacker index
        1, // defender index
        expect.any(Number),
        false
      );
      
      // Restore original method
      scene['tryAttack'] = originalTryAttack;
    });
    
    it('should handle remote block actions', () => {
      // Simulate receiving a remote block action for players[0] (host)
      const blockAction = {
        type: 'block',
        playerIndex: 0,
        active: true
      };
      
      // Call handleRemoteAction directly
      scene.handleRemoteAction(blockAction);
      
      // Should update players[0]'s blocking state
      expect(scene.players[0].setData).toHaveBeenCalledWith('isBlocking', true);
    });
  });
});
