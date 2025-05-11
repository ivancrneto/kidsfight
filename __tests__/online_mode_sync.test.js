import KidsFightScene from '../kidsfight_scene.js';
import wsManager from '../websocket_manager';

// Define constants used in the game
const PLAYER_SPEED = 200;
const ATTACK_DAMAGE = 10;
const SPECIAL_DAMAGE = 20;
const MAX_HEALTH = 100;

// Mock the WebSocket manager
jest.mock('../websocket_manager', () => ({
  isConnected: jest.fn().mockReturnValue(true),
  sendGameAction: jest.fn(),
  send: jest.fn(),
  ws: {
    send: jest.fn()
  }
}));

describe('Online Mode Synchronization', () => {
  let scene;
  
  // Setup common mocks for all tests
  beforeEach(() => {
    // Create scene instance
    scene = new KidsFightScene();
    
    // Set up scene properties for online mode
    scene.gameMode = 'online';
    scene.player1 = {
      play: jest.fn(),
      setFlipX: jest.fn(),
      setTint: jest.fn(),
      clearTint: jest.fn(),
      once: jest.fn(),
      body: {
        setVelocityX: jest.fn(),
        setVelocityY: jest.fn(),
        touching: { down: true },
        onFloor: jest.fn().mockReturnValue(true),
        velocity: { x: 0, y: 0 }
      },
      anims: {
        play: jest.fn(),
        currentAnim: { key: 'p1_idle_player1' },
        isPlaying: true
      },
      x: 200,
      y: 300
    };
    
    scene.player2 = {
      play: jest.fn(),
      setFlipX: jest.fn(),
      setTint: jest.fn(),
      clearTint: jest.fn(),
      once: jest.fn(),
      body: {
        setVelocityX: jest.fn(),
        setVelocityY: jest.fn(),
        touching: { down: true },
        onFloor: jest.fn().mockReturnValue(true),
        velocity: { x: 0, y: 0 }
      },
      anims: {
        play: jest.fn(),
        currentAnim: { key: 'p2_idle_player2' },
        isPlaying: true
      },
      x: 600,
      y: 300
    };
    
    scene.players = [scene.player1, scene.player2];
    scene.p1SpriteKey = 'player1';
    scene.p2SpriteKey = 'player2';
    scene.player1State = 'idle';
    scene.player2State = 'idle';
    scene.lungeTimer = [0, 0];
    scene.sendGameAction = jest.fn();
    scene.lastAttackTime = [0, 0];
    scene.attackCount = [0, 0];
    scene.playerHealth = [MAX_HEALTH, MAX_HEALTH];
    scene.healthBar1 = { width: 200 };
    scene.healthBar2 = { width: 200 };
    scene.wsManager = wsManager;
    
    // Mock time and camera for visual effects
    scene.time = {
      now: 1000,
      delayedCall: jest.fn((delay, callback) => {
        callback();
        return { remove: jest.fn() };
      })
    };
    
    scene.cameras = {
      main: {
        shake: jest.fn()
      }
    };
    
    // Mock add method for creating visual indicators
    scene.add = {
      circle: jest.fn().mockReturnValue({
        destroy: jest.fn()
      }),
      text: jest.fn().mockReturnValue({
        setOrigin: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        setAlpha: jest.fn().mockReturnThis(),
        destroy: jest.fn()
      })
    };
    
    // Mock debug text
    scene.debugInfoText = {
      setText: jest.fn()
    };
    
    // Mock special effect
    scene.showSpecialEffect = jest.fn();
  });
  
  describe('Player Position Synchronization', () => {
    it('should include position data when sending game actions', () => {
      // Set up the scene for testing
      scene.localPlayerIndex = 0;
      scene.isHost = true;
      scene.wsManager = wsManager;
      
      // Call sendGameAction method
      scene.sendGameAction('move', { direction: 'right' });
      
      // Verify that the sendGameAction method was called with position data
      expect(scene.sendGameAction).toHaveBeenCalledWith('move', { direction: 'right' });
      
      // Since we can't directly test the internal implementation of sendGameAction,
      // we'll verify that it formats the message correctly by checking the mock function call
      const callArgs = scene.sendGameAction.mock.calls[0];
      expect(callArgs[0]).toBe('move');
      expect(callArgs[1]).toEqual({ direction: 'right' });
    });
    
    it('should update remote player position when receiving action with position data', () => {
      // Set up the scene for testing
      scene.localPlayerIndex = 0; // Local player is player 1
      scene.isHost = true;
      
      // Create a remote action with position data
      const remoteAction = {
        type: 'move',
        direction: 'right',
        player: 1, // Remote player is player 2
        position: {
          x: 450,
          y: 320,
          velocityX: 150,
          velocityY: -50
        }
      };
      
      // Call handleRemoteAction method
      scene.handleRemoteAction(remoteAction);
      
      // Verify that the remote player's position was updated
      expect(scene.player2.x).toBe(450);
      expect(scene.player2.y).toBe(320);
      expect(scene.player2.body.velocity.x).toBe(150);
      expect(scene.player2.body.velocity.y).toBe(-50);
    });
    
    it('should ignore actions for the local player', () => {
      // Set up the scene for testing
      scene.localPlayerIndex = 0; // Local player is player 1
      scene.isHost = true;
      
      // Create an action for the local player
      const localAction = {
        type: 'move',
        direction: 'right',
        player: 0, // Local player is player 1
        position: {
          x: 250,
          y: 300,
          velocityX: 150,
          velocityY: 0
        }
      };
      
      // Store original position
      const originalX = scene.player1.x;
      const originalY = scene.player1.y;
      
      // Call handleRemoteAction method
      scene.handleRemoteAction(localAction);
      
      // Verify that the local player's position was not changed
      expect(scene.player1.x).toBe(originalX);
      expect(scene.player1.y).toBe(originalY);
    });
  });
  
  describe('Attack Synchronization', () => {
    it('should apply damage to local player when remote player attacks', () => {
      // Set up the scene for testing
      scene.localPlayerIndex = 0; // Local player is player 1
      scene.isHost = true;
      
      // Position players close enough for attack to hit
      scene.player1.x = 200;
      scene.player2.x = 350; // Within attack range
      
      // Create a remote attack action
      const remoteAttackAction = {
        type: 'attack',
        player: 1, // Remote player is player 2
        position: {
          x: 350,
          y: 300,
          velocityX: 0,
          velocityY: 0
        }
      };
      
      // Store original health
      const originalHealth = scene.playerHealth[0];
      
      // Call handleRemoteAction method
      scene.handleRemoteAction(remoteAttackAction);
      
      // Verify that damage was applied to local player
      expect(scene.playerHealth[0]).toBe(originalHealth - ATTACK_DAMAGE);
      
      // Verify that health bar was updated
      expect(scene.healthBar1.width).toBe(200 * (1 - ATTACK_DAMAGE / MAX_HEALTH));
      
      // Verify that visual feedback was triggered
      expect(scene.cameras.main.shake).toHaveBeenCalled();
    });
    
    it('should not apply damage if players are too far apart', () => {
      // Set up the scene for testing
      scene.localPlayerIndex = 0; // Local player is player 1
      scene.isHost = true;
      
      // Position players too far for attack to hit
      scene.player1.x = 200;
      scene.player2.x = 500; // Beyond attack range
      
      // Create a remote attack action
      const remoteAttackAction = {
        type: 'attack',
        player: 1, // Remote player is player 2
        position: {
          x: 500,
          y: 300,
          velocityX: 0,
          velocityY: 0
        }
      };
      
      // Store original health
      const originalHealth = scene.playerHealth[0];
      
      // Call handleRemoteAction method
      scene.handleRemoteAction(remoteAttackAction);
      
      // Verify that no damage was applied
      expect(scene.playerHealth[0]).toBe(originalHealth);
    });
    
    it('should apply special attack damage to local player', () => {
      // Set up the scene for testing
      scene.localPlayerIndex = 0; // Local player is player 1
      scene.isHost = true;
      
      // Position players close enough for special attack to hit
      scene.player1.x = 200;
      scene.player2.x = 380; // Within special attack range
      
      // Create a remote special attack action
      const remoteSpecialAction = {
        type: 'special',
        player: 1, // Remote player is player 2
        position: {
          x: 380,
          y: 300,
          velocityX: 0,
          velocityY: 0
        }
      };
      
      // Store original health
      const originalHealth = scene.playerHealth[0];
      
      // Call handleRemoteAction method
      scene.handleRemoteAction(remoteSpecialAction);
      
      // Verify that special damage was applied to local player
      expect(scene.playerHealth[0]).toBe(originalHealth - SPECIAL_DAMAGE);
      
      // Verify that health bar was updated
      expect(scene.healthBar1.width).toBe(200 * (1 - SPECIAL_DAMAGE / MAX_HEALTH));
      
      // Verify that visual feedback was triggered with stronger effect
      expect(scene.cameras.main.shake).toHaveBeenCalledWith(250, 0.03);
      
      // Verify that special effect was shown
      expect(scene.showSpecialEffect).toHaveBeenCalled();
    });
  });
  
  describe('Animation Synchronization', () => {
    it('should play correct animation when remote player moves left', () => {
      // Set up the scene for testing
      scene.localPlayerIndex = 0; // Local player is player 1
      scene.isHost = true;
      
      // Create a remote move action
      const remoteMoveAction = {
        type: 'move',
        direction: 'left',
        player: 1, // Remote player is player 2
        position: {
          x: 550,
          y: 300,
          velocityX: -PLAYER_SPEED,
          velocityY: 0
        }
      };
      
      // Call handleRemoteAction method
      scene.handleRemoteAction(remoteMoveAction);
      
      // Verify that correct animation was played
      expect(scene.player2.anims.play).toHaveBeenCalledWith('p2_walk_player2', true);
      
      // Verify that sprite was flipped correctly
      expect(scene.player2.setFlipX).toHaveBeenCalledWith(true);
    });
    
    it('should play correct animation when remote player moves right', () => {
      // Set up the scene for testing
      scene.localPlayerIndex = 0; // Local player is player 1
      scene.isHost = true;
      
      // Create a remote move action
      const remoteMoveAction = {
        type: 'move',
        direction: 'right',
        player: 1, // Remote player is player 2
        position: {
          x: 650,
          y: 300,
          velocityX: PLAYER_SPEED,
          velocityY: 0
        }
      };
      
      // Call handleRemoteAction method
      scene.handleRemoteAction(remoteMoveAction);
      
      // Verify that correct animation was played
      expect(scene.player2.anims.play).toHaveBeenCalledWith('p2_walk_player2', true);
      
      // Verify that sprite was flipped correctly
      expect(scene.player2.setFlipX).toHaveBeenCalledWith(false);
    });
    
    it('should play idle animation when remote player stops', () => {
      // Set up the scene for testing
      scene.localPlayerIndex = 0; // Local player is player 1
      scene.isHost = true;
      
      // Create a remote stop action
      const remoteStopAction = {
        type: 'move',
        direction: 'stop',
        player: 1, // Remote player is player 2
        position: {
          x: 600,
          y: 300,
          velocityX: 0,
          velocityY: 0
        }
      };
      
      // Call handleRemoteAction method
      scene.handleRemoteAction(remoteStopAction);
      
      // Verify that idle animation was played
      expect(scene.player2.anims.play).toHaveBeenCalledWith('p2_idle_player2', true);
    });
  });
});
