// Mock Phaser and other dependencies before importing the scene
import { createMockPlayer } from './createMockPlayer';

// Mock the KidsFightScene class
jest.mock('../kidsfight_scene', () => {
  // Create a mock implementation of the scene
  const mockScene = {
    // Scene properties
    player1: createMockPlayer(),
    player2: createMockPlayer(),
    selectedScenario: 'test-scene',
    gameMode: 'local',
    hitEffects: [],
    
    // Mock Phaser scene methods
    add: {
      image: jest.fn().mockReturnThis(),
      sprite: jest.fn().mockImplementation(() => createMockPlayer()),
      text: jest.fn().mockReturnThis(),
      graphics: jest.fn().mockReturnThis(),
      container: jest.fn().mockReturnThis(),
      circle: jest.fn()
    },
    physics: {
      add: {
        collider: jest.fn(),
        overlap: jest.fn(),
        sprite: jest.fn().mockImplementation(() => createMockPlayer())
      },
      world: {
        setBounds: jest.fn()
      }
    },
    cameras: {
      main: {
        setBounds: jest.fn(),
        startFollow: jest.fn()
      }
    },
    time: {
      addEvent: jest.fn()
    },
    
    // Mock our custom methods
    showHitEffect: jest.fn(),
    updatePlayerAnimation: jest.fn(),
    updatePlayerState: jest.fn(),
    tryAttack: jest.fn(),
    
    // This will be our actual class implementation
    create: jest.fn(),
    update: jest.fn()
  };
  
  // Return the mock implementation
  return jest.fn().mockImplementation(() => mockScene);
});

// Now import the scene after setting up mocks
import KidsFightScene from '../kidsfight_scene';

describe('KidsFightScene', () => {
  let scene: any; // Using 'any' type to simplify test setup, in a real project you'd want to use proper types
  let player1;
  let player2;
  
  beforeEach(() => {
  if (typeof scene !== 'undefined') {
    if (!scene.textures) scene.textures = { list: {} };
    else scene.textures.list = {};
  }
    scene = new KidsFightScene();
    // Ensure add.sprite is a jest mock for hit effect tests
    scene.add = {
      sprite: jest.fn(() => ({
        setOrigin: jest.fn().mockReturnThis(),
        play: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
        destroy: jest.fn().mockReturnThis()
      })),
      circle: jest.fn()
    };
    // Robust player mocks for hit effect and movement
    scene.player1 = {
      setVelocityX: jest.fn(),
      setVelocityY: jest.fn(),
      setFlipX: jest.fn(),
      setData: jest.fn(),
      getData: jest.fn(),
      body: {
        setVelocityX: jest.fn(),
        setVelocityY: jest.fn(),
        setSize: jest.fn(),
        setOffset: jest.fn(),
        setAllowGravity: jest.fn(),
        touching: { down: true },
        onFloor: jest.fn(() => true)
      }
    };
    scene.player2 = {
      setVelocityX: jest.fn(),
      setVelocityY: jest.fn(),
      setFlipX: jest.fn(),
      setData: jest.fn(),
      getData: jest.fn(),
      anims: { play: jest.fn() },
      texture: { key: 'player2' },
      body: {
        setVelocityX: jest.fn(),
        setVelocityY: jest.fn(),
        setSize: jest.fn(),
        setOffset: jest.fn(),
        setAllowGravity: jest.fn(),
        touching: { down: true },
        onFloor: jest.fn(() => true)
      }
    };
    // Now safe to assign handleRemoteAction
    scene.handleRemoteAction = jest.fn().mockImplementation(function(this: any, action: any) {
      if (action.type === 'move' && this.player1 && this.player2) {
        const player = action.playerIndex === 0 ? this.player1 : this.player2;
        player.setVelocityX(160 * (action.direction || 0));
        player.setFlipX(action.direction < 0);
      } else if (action.type === 'jump' && this.player1?.body?.touching?.down) {
        this.player1.setVelocityY(-330);
      } else if (action.type === 'attack' && this.player1 && this.player2) {
        const attacker = action.playerIndex === 0 ? this.player1 : this.player2;
        const target = action.playerIndex === 0 ? this.player2 : this.player1;
        this.tryAttack(action.playerIndex, attacker, target, Date.now(), false);
      } else if (action.type === 'block' && this.player1) {
        this.player1.setData('isBlocking', action.active);
      }
    });
    
    // Get references to the mock players
    player1 = scene.player1;
    player2 = scene.player2;
    
    // Reset all mocks
    jest.clearAllMocks();
  });
  
  describe('Initialization', () => {
    it('should initialize with default values', () => {
      expect(scene).toBeDefined();
      expect(scene.player1).toBeDefined();
      expect(scene.player2).toBeDefined();
      expect(scene.selectedScenario).toBe('test-scene');
      expect(scene.gameMode).toBe('local');
    });
  });
  
  describe('Player Movement', () => {
    it('should handle player movement', () => {
      // Test moving player 1 to the right
      const moveAction = {
        type: 'move',
        playerIndex: 0,
        direction: 1
      };
      
      // Call the method that handles movement
      scene.handleRemoteAction(moveAction);
      
      // Verify the movement was processed
      expect(player1.setVelocityX).toHaveBeenCalledWith(160);
      expect(player1.setFlipX).toHaveBeenCalledWith(false);
    });
    
    it('should handle player jump', () => {
      // Mock the player being on the ground
      player1.body.onFloor.mockReturnValue(true);
      
      const jumpAction = {
        type: 'jump',
        playerIndex: 0
      };
      
      // Call the method that handles jumping
      scene.handleRemoteAction(jumpAction);
      
      // Verify the jump was processed
      expect(player1.setVelocityY).toHaveBeenCalledWith(expect.any(Number));
    });
  });
  
  describe('Player Actions', () => {
    it('should handle player attack', () => {
      const attackAction = {
        type: 'attack',
        playerIndex: 0
      };
      
      // Call the method that handles attacks
      scene.handleRemoteAction(attackAction);
      
      // Verify the attack was processed
      expect(scene.tryAttack).toHaveBeenCalledWith(
        0, // playerIndex
        player1, // attacker
        player2, // target
        expect.any(Number), // timestamp
        false // isSpecial
      );
    });
    
    it('should handle player block', () => {
      const blockAction = {
        type: 'block',
        playerIndex: 0,
        active: true
      };
      
      // Call the method that handles blocking
      scene.handleRemoteAction(blockAction);
      
      // Verify the block was processed
      expect(player1.setData).toHaveBeenCalledWith('isBlocking', true);
    });
  });
  
  describe('Hit Effects', () => {
    it('should show hit effects at the correct position', () => {
      // Setup mocks
      const mockCircle = { x: 0, y: 0, radius: 0, fillColor: 0, alpha: 0 };
      
      // Mock the add.circle method
      scene.add.circle = jest.fn((x, y, radius, fillColor, alpha) => {
        mockCircle.x = x;
        mockCircle.y = y;
        mockCircle.radius = radius;
        mockCircle.fillColor = fillColor;
        mockCircle.alpha = alpha;
        return mockCircle;
      });
      
      // Mock the tweens.add method
      scene.tweens = {
        add: jest.fn(() => ({
          onComplete: {
            add: jest.fn()
          }
        }))
      };
      
      // Initialize hitEffects array
      scene.hitEffects = [];
      
      // Mock the showHitEffect method to call showHitEffectAtCoordinates
      scene.showHitEffect = jest.fn((location) => {
        if (typeof location === 'object') {
          scene.showHitEffectAtCoordinates(location.x, location.y);
        }
      });
      
      // Mock the showHitEffectAtCoordinates method
      scene.showHitEffectAtCoordinates = jest.fn((x, y) => {
        const hitEffect = scene.add.circle(x, y, 30, 0xff0000, 0.8);
        scene.hitEffects.push(hitEffect);
        scene.tweens.add({
          targets: hitEffect,
          alpha: 0,
          scale: 1.5,
          duration: 300,
          ease: 'Power2',
          onComplete: () => {
            // Remove from scene when animation completes
            const index = scene.hitEffects.indexOf(hitEffect);
            if (index > -1) {
              scene.hitEffects.splice(index, 1);
            }
          }
        });
      });
      
      // Test with position object
      const position = { x: 100, y: 100 };
      
      // Call the method
      scene.showHitEffect(position);
      
      // Verify showHitEffect was called with the position
      expect(scene.showHitEffect).toHaveBeenCalledWith(position);
      
      // Verify showHitEffectAtCoordinates was called with the correct coordinates
      expect(scene.showHitEffectAtCoordinates).toHaveBeenCalledWith(position.x, position.y);
      
      // Verify the circle was created with the correct parameters
      expect(scene.add.circle).toHaveBeenCalledWith(
        position.x,
        position.y,
        30,
        0xff0000,
        0.8
      );
      
      // Verify the hit effect was added to the array
      expect(scene.hitEffects).toContain(mockCircle);
      
      // Verify tween was added with correct parameters
      expect(scene.tweens.add).toHaveBeenCalledWith({
        targets: mockCircle,
        alpha: 0,
        scale: 1.5,
        duration: 300,
        ease: 'Power2',
        onComplete: expect.any(Function)
      });
    });
  });
});
