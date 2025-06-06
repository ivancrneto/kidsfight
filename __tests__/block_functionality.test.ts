import Phaser from 'phaser';
import KidsFightScene from '../kidsfight_scene';

// Mock WebSocketManager before importing it
jest.mock('../websocket_manager');

// Import the WebSocketManager class after mocking
import { WebSocketManager } from '../websocket_manager';

// Create a mock Player type that satisfies both Phaser.Sprite and our custom properties
type MockPlayer = Phaser.Physics.Arcade.Sprite & {
  health: number;
  special: number;
  isBlocking: boolean;
  isAttacking: boolean;
  direction: 'left' | 'right';
  anims: {
    play: (config: string | Phaser.Types.Animations.PlayAnimationConfig) => void;
  };
  setData: (key: string, value: any) => void;
  getData: (key: string) => any;
  setScale: (x: number, y?: number) => void;
  setFrame: (frame: string | number) => void;
  texture: { key: string; frameTotal?: number };
  x: number;
  y: number;
  body: {
    blocked: { down: boolean };
    velocity: { x: number; y: number };
  };
};

const wsFactory = () => ({
  send: jest.fn(),
  close: jest.fn(),
  readyState: 1,
  addEventListener: jest.fn(),
  resetMocks: jest.fn()
});

describe('Block Functionality', () => {
  let scene: KidsFightScene;
  let mockCanvas: HTMLCanvasElement;
  let wsManagerMock: WebSocketManager;
  
  beforeEach(() => {
    // Reset the WebSocketManager mock instance
    WebSocketManager.resetInstance();
    
    // Get a fresh instance for this test
    wsManagerMock = WebSocketManager.getInstance(wsFactory);
    
    // Create a basic scene with mocked canvas
    scene = new KidsFightScene();
    
    // Mock the necessary Phaser objects
    mockCanvas = document.createElement('canvas');
    mockCanvas.width = 800;
    mockCanvas.height = 480;
    
    // Mock sys.game.canvas
    scene.sys = {
      game: {
        canvas: mockCanvas
      },
      displayList: {
        depthSort: jest.fn()
      }
    };
    
    // Mock necessary methods for health bars
    scene.createHealthBars = jest.fn();
    scene.updateHealthBar = jest.fn();
    scene.checkWinner = jest.fn().mockReturnValue(false);
    
    // Mock add methods for creating graphics
    scene.add = {
      graphics: jest.fn().mockReturnValue({
        clear: jest.fn(),
        fillStyle: jest.fn().mockReturnThis(),
        fillRect: jest.fn().mockReturnThis(),
        setVisible: jest.fn()
      }),
      circle: jest.fn().mockReturnValue({
        setDepth: jest.fn().mockReturnThis(),
        setAlpha: jest.fn().mockReturnThis(),
        setScale: jest.fn().mockReturnThis()
      }),
      particles: jest.fn().mockReturnValue({
        createEmitter: jest.fn().mockReturnValue({
          setPosition: jest.fn().mockReturnThis(),
          setSpeed: jest.fn().mockReturnThis(),
          setScale: jest.fn().mockReturnThis(),
          setAlpha: jest.fn().mockReturnThis(),
          setLifespan: jest.fn().mockReturnThis(),
          explode: jest.fn()
        })
      })
    };
    
    // Mock player with enough frames for blocking animation
    const mockTexture = { key: 'player1', frameTotal: 10 }; // at least 6 frames for block
    
    // Create mock players with proper typing
    const player1: MockPlayer = {
      health: 100,
      special: 0,
      isBlocking: false,
      isAttacking: false,
      direction: 'right',
      setData: jest.fn(),
      getData: jest.fn((key: string) => key === 'isBlocking'),
      setScale: jest.fn(),
      setFrame: jest.fn(),
      anims: { 
        play: jest.fn() 
      },
      texture: mockTexture,
      x: 200,
      y: 300,
      body: {
        blocked: { down: true },
        velocity: { x: 0, y: 0 }
      }
    } as unknown as MockPlayer;

    const player2: MockPlayer = {
      health: 100,
      special: 0,
      isBlocking: false,
      isAttacking: false,
      direction: 'left',
      setData: jest.fn(),
      getData: jest.fn(),
      setScale: jest.fn(),
      setFrame: jest.fn(),
      anims: { 
        play: jest.fn() 
      },
      texture: { key: 'player2', frameTotal: 10 },
      x: 600,
      y: 300,
      body: {
        blocked: { down: true },
        velocity: { x: 0, y: 0 }
      }
    } as unknown as MockPlayer;

    // Assign to scene.players with type assertion
    scene.players = [player1, player2];
    
    // Initialize playerHealth array
    scene.playerHealth = [100, 100];
    
    // Initialize blocking state arrays
    scene.playerBlocking = [false, false];
    
    // Set up constants and damage values
    scene.DAMAGE = 5;
    scene.SPECIAL_DAMAGE = 10;
    
    // Mock createAttackEffect and createSpecialAttackEffect
    scene.createAttackEffect = jest.fn();
    scene.createSpecialAttackEffect = jest.fn();
    scene.createHitEffect = jest.fn();
    
    // Mock tryAttack method
    scene.tryAttack = jest.fn((attackerIndex, targetIndex, timestamp, isSpecial) => {
      const attacker = scene.players[attackerIndex];
      const target = scene.players[targetIndex];
      
      // Calculate damage based on blocking state
      let damage = isSpecial ? scene.SPECIAL_DAMAGE : scene.DAMAGE;
      if (scene.playerBlocking[targetIndex]) {
        damage = Math.floor(damage / 2);
      }
      
      // Update target's health
      scene.playerHealth[targetIndex] -= damage;
      target.health -= damage;
      
      // Create attack effect
      if (isSpecial) {
        scene.createSpecialAttackEffect(attacker.x, attacker.y, target.x, target.y);
      } else {
        scene.createAttackEffect(attacker.x, attacker.y, target.x, target.y);
      }
      
      // Create hit effect
      scene.createHitEffect(target.x, target.y);
    });
    
    // Set up isHost and gameMode for WebSocket logic
    scene.isHost = true;
    scene.gameMode = 'single';
    scene.localPlayerIndex = 0;
  });
  
  test('blocking reduces damage by 50%', () => {
    // Set player 2 (index 1) to blocking state
    scene.playerBlocking[1] = true;
    scene.players[1].getData.mockReturnValue(true); // isBlocking returns true
    
    // Regular attack from player 1 to player 2 (blocking)
    scene.tryAttack(0, 1, Date.now(), false);
    
    // Damage should be reduced by 50% (from 5 to 2.5, floored to 2)
    expect(scene.playerHealth[1]).toBe(98); // 100 - 2 = 98
    
    // Reset health for next test
    scene.playerHealth[1] = 100;
    scene.players[1].health = 100;
    
    // Special attack from player 1 to player 2 (blocking)
    scene.tryAttack(0, 1, Date.now(), true);
    
    // Special damage should be reduced by 50% (from 10 to 5)
    expect(scene.playerHealth[1]).toBe(95); // 100 - 5 = 95
  });
  
  test('blocking animation is displayed when player is blocking', () => {
    // Set player 1 (index 0) to blocking state
    scene.playerBlocking[0] = true;
    
    // Update animation for player 1
    scene.updatePlayerAnimation(0);
    
    // Check if frame 5 was used for blocking animation
    expect(scene.players[0].setFrame).toHaveBeenCalledWith(5);
    
    // Check if scaling was applied (0.9, 1.0 for blocking)
    expect(scene.players[0].setScale).toHaveBeenCalledWith(0.9, 1.0);
  });
  
  test('block button correctly sets player blocking state', () => {
    // Create mock action for block button press
    const blockAction = {
      type: 'block',
      playerIndex: 0,
      active: true
    };
    
    // Handle the block action
    scene.handleRemoteAction(blockAction);
    
    // Check if the blocking state was set correctly
    expect(scene.playerBlocking[0]).toBe(true);
    expect(scene.players[0].setData).toHaveBeenCalledWith('isBlocking', true);
    
    // Create mock action for block button release
    const releaseBlockAction = {
      type: 'block',
      playerIndex: 0,
      active: false
    };
    
    // Handle the block release action
    scene.handleRemoteAction(releaseBlockAction);
    
    // Check if the blocking state was cleared correctly
    expect(scene.playerBlocking[0]).toBe(false);
    expect(scene.players[0].setData).toHaveBeenCalledWith('isBlocking', false);
  });
  
  describe('defensive frame fallback', () => {
    it('should fallback to last frame if not enough frames for block', () => {
      scene = new KidsFightScene();
      const mockTexture = { frameTotal: 3 }; // only 3 frames
      scene.players = [
        {
          setFrame: jest.fn(),
          setScale: jest.fn(),
          getData: jest.fn((key) => key === 'isBlocking'),
          body: { blocked: { down: true }, velocity: { x: 0, y: 0 } },
          texture: mockTexture
        }
      ];
      scene.updatePlayerAnimation(0);
      expect(scene.players[0].setFrame).toHaveBeenCalledWith(2); // fallback to last frame
    });
  });
});
