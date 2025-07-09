import 'phaser';
import KidsFightScene from '../kidsfight_scene';
import { WebSocketManager } from '../websocket_manager';
import { setupPhaserMocks } from './test_helpers/mock_phaser';
// Don't import Graphics directly, we'll mock it instead

// Use a plain object as the mock WebSocket
const wsFactory = () => ({
  send: jest.fn(),
  close: jest.fn(),
  readyState: 1,
  addEventListener: jest.fn(),
  resetMocks: jest.fn()
});

// Mock Phaser and WebSocketManager
jest.mock('phaser');
jest.mock('../websocket_manager');

describe('KidsFightScene - Special Attack', () => {
  let scene: KidsFightScene;
  let mockPlayer: any;
  let mockWsManager: jest.Mocked<WebSocketManager>;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Create a mock player
    mockPlayer = {
      setData: jest.fn(),
      x: 100,
      y: 300,
      flipX: false,
      body: {
        velocity: { x: 0, y: 0 },
        blocked: { down: true },
        touching: { down: true }
      },
      anims: {
        getFrameName: jest.fn().mockReturnValue('idle')
      }
    };

    // Create a test scene instance
    scene = new KidsFightScene();
    
    // Setup Phaser mocks before init/create
    setupPhaserMocks(scene);
    scene.playersReady = true;
    // Mock sys.game.canvas for updateSpecialPips
    scene.sys = {
      ...scene.sys,
      game: {
        ...((scene.sys && scene.sys.game) || {}),
        canvas: { width: 800, height: 480 }
      }
    } as any;
    
    // Mock Phaser time
    scene.time = {
      addEvent: jest.fn().mockImplementation((config) => {
        if (config.delay === 300 && config.callback) {
          // Store the callback to be called manually
          (scene as any).specialAttackCallback = config.callback;
        }
        return { remove: jest.fn() };
      })
    };
    
    // Initialize scene properties needed for testing
    // Always use valid mock players for both slots
    scene.players = [mockPlayer, { ...mockPlayer }];
    scene.localPlayerIndex = 0;
    scene.gameMode = 'single';
    (scene as any).playerSpecial = [3, 0]; // Start with 3 pips for player 1
    scene.playerHealth = [100, 100];
    scene.isAttacking = [false, false];

    scene.updateHealthBar = jest.fn();
    scene.checkWinner = jest.fn();
    scene.playerBlocking = [false, false];
    scene.lastAttackTime = [0, 0];
    (scene as any).lastSpecialTime = [0, 0];
    
    // Mock WebSocketManager
    // Use getInstance method instead of direct constructor
    mockWsManager = WebSocketManager.getInstance(wsFactory) as jest.Mocked<WebSocketManager>;
    mockWsManager.send = jest.fn();
    jest.spyOn(WebSocketManager, 'getInstance').mockReturnValue(mockWsManager);
    scene['wsManager'] = mockWsManager;
    
    // Mock scene.physics.pause and scene.sys.game.canvas
    scene.physics = { pause: jest.fn() };
    scene.sys = { game: { canvas: { width: 800, height: 480 } } };
  });

  describe('handleSpecial', () => {
    beforeEach(() => {
      // Mock setTimeout and clearTimeout before each test
      jest.useFakeTimers();
      jest.spyOn(global, 'setTimeout');
      jest.spyOn(global, 'clearTimeout');
    });

    afterEach(() => {
      // Restore real timers after each test
      jest.useRealTimers();
    });

    it('should consume all special pips when performing a special attack', () => {
      // Arrange
      // Set up initial state
      (scene as any).playerSpecial = [3, 0]; // Full special meter
      
      // Act - Perform the special attack
      scene['handleSpecial']();
      
      // Assert - Check initial state
      expect((scene as any).playerSpecial[0]).toBe(0); // Should consume all pips
      
      // Verify the special attack state is set to true during attack
      expect(mockPlayer.setData).toHaveBeenCalledWith('isSpecialAttacking', true);
      
      // Verify setTimeout was called with the correct delay
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 300);
      
      // Get the callback passed to setTimeout
      const setTimeoutCall = (setTimeout as jest.Mock).mock.calls[0];
      const timerCallback = setTimeoutCall[0];
      
      // Clear the mock to track the next call
      (mockPlayer.setData as jest.Mock).mockClear();
      
      // Act - Simulate the timer completing
      timerCallback();
      
      // Assert - Verify the special attack state is reset to false after animation
      expect(mockPlayer.setData).toHaveBeenCalledWith('isSpecialAttacking', false);
    });

    it('should not perform special attack if not enough pips', () => {
      // Arrange
      (scene as any).playerSpecial[0] = 2; // Not enough pips
      
      // Act
      scene['handleSpecial']();

      // Assert
      expect((scene as any).playerSpecial[0]).toBe(2); // Pips should remain unchanged
      expect(mockPlayer.setData).not.toHaveBeenCalled();
    });

    it('should send special attack message in online mode', () => {
      // Arrange
      scene.gameMode = 'online';
      
      // Act
      scene['handleSpecial']();

      // Assert
      expect(mockWsManager.send).toHaveBeenCalledWith({
        type: 'special',
        playerIndex: 0
      });
    });
  });

  describe('tryAction with special attack', () => {
    it('should apply special damage to opponent', () => {
      // Arrange
      // Initialize players with proper health and mock methods
      const mockPlayer1 = { 
        health: 100, 
        setData: jest.fn(),
        body: { blocked: { down: true } },
        setVelocityX: jest.fn(),
        setVelocityY: jest.fn(),
        x: 100
      };
      const mockPlayer2 = { 
        health: 100, 
        setData: jest.fn(),
        body: { blocked: { down: true } },
        setVelocityX: jest.fn(),
        setVelocityY: jest.fn(),
        x: 150 // 50px apart, within special attack range
      };
      
      // Set up scene state
      scene.players = [mockPlayer1, mockPlayer2];
      scene.playerHealth = [100, 100];
      (scene as any).playerSpecial = [3, 0]; // Full special meter
      (scene as any).playersReady = true; // Ensure players are ready
      scene.gameOver = false; // Ensure game is not over
      
      // Mock getTime to control timing
      const now = Date.now();
      const spy = jest.spyOn(scene, 'tryAttack').mockImplementation(function (...args) {
        // @ts-ignore
        return Object.getPrototypeOf(scene).tryAttack.apply(this, args);
      });
      jest.spyOn(scene, 'getTime').mockReturnValue(now);
      
      const initialHealth = scene.playerHealth[1];
      
      // Act
      scene['tryAction'](0, 'special', true);
      
      // Assert - Verify damage was applied
      expect(scene.playerHealth[1]).toBe(initialHealth - 10);
      // Verify special pips were consumed
      expect((scene as any).playerSpecial[0]).toBe(0);
    });
  });

  describe('updateSpecialPips', () => {
    it('should update special pips UI correctly', () => {
      // Create mock graphics objects for special pips
      const createMockGraphics = () => ({
        clear: jest.fn(),
        fillStyle: jest.fn(),
        fillCircle: jest.fn(),
        displayOriginX: 0,
        displayOriginY: 0,
        commandBuffer: [],
        defaultFillColor: 0,
        defaultFillAlpha: 1,
        defaultStrokeWidth: 1,
        defaultStrokeColor: 0,
        defaultStrokeAlpha: 1,
        setDefaultStyles: jest.fn(),
        destroy: jest.fn(),
        setVisible: jest.fn(),
        setPosition: jest.fn(),
        setDepth: jest.fn(),
        // Add additional methods needed for Graphics
        lineStyle: jest.fn(),
        fillGradientStyle: jest.fn(),
        lineGradientStyle: jest.fn(),
        beginPath: jest.fn(),
        closePath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn()
      });

      // Setup mock special pip graphics for both players - use 'as any' to bypass type checking
      scene['specialPips1'] = [createMockGraphics(), createMockGraphics(), createMockGraphics()].map(g => g as any);
      scene['specialPips2'] = [createMockGraphics(), createMockGraphics(), createMockGraphics()].map(g => g as any);
      
      // Test with 2 pips
      (scene as any).playerSpecial = [2, 1];
      
      // Act
      scene['updateSpecialPips']();
      
      // Assert
      // Should set fillStyle with full opacity for first 2 pips, and 30% for the last one
      // Check that fillStyle was called appropriately on the pip graphics
      expect(scene['specialPips1'][0].fillStyle).toHaveBeenCalledWith(0xffe066, 1); // First pip filled
      expect(scene['specialPips1'][1].fillStyle).toHaveBeenCalledWith(0xffe066, 1); // Second pip filled
      expect(scene['specialPips1'][2].fillStyle).toHaveBeenCalledWith(0x888888, 0.3); // Last pip empty
    });
  });
});
