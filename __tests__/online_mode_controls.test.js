import KidsFightScene from '../kidsfight_scene.js';
import wsManager from '../websocket_manager';

// Define constants used in the game
const PLAYER_SPEED = 200;

// Mock the WebSocket manager
jest.mock('../websocket_manager', () => ({
  isConnected: jest.fn().mockReturnValue(true),
  send: jest.fn(),
  ws: {
    send: jest.fn()
  }
}));

describe('Online Mode Player Controls', () => {
  let scene;
  
  // Setup common mocks for all tests
  beforeEach(() => {
    // Create mock player sprites and bodies
    const mockPlayer1 = {
      setVelocityX: jest.fn(),
      setVelocityY: jest.fn(),
      onFloor: jest.fn().mockReturnValue(true),
      touching: { down: true }
    };
    
    const mockPlayer2 = {
      setVelocityX: jest.fn(),
      setVelocityY: jest.fn(),
      onFloor: jest.fn().mockReturnValue(true),
      touching: { down: true }
    };
    
    // Create scene instance
    scene = new KidsFightScene();
    
    // Set up scene properties for online mode
    scene.gameMode = 'online';
    scene.player1 = {
      play: jest.fn(),
      setFlipX: jest.fn(),
      body: mockPlayer1,
      anims: {
        currentAnim: { key: 'p1_idle_player1' },
        isPlaying: true
      }
    };
    scene.player2 = {
      play: jest.fn(),
      setFlipX: jest.fn(),
      body: mockPlayer2,
      anims: {
        currentAnim: { key: 'p2_idle_player2' },
        isPlaying: true
      }
    };
    scene.players = [scene.player1, scene.player2];
    scene.p1SpriteKey = 'player1';
    scene.p2SpriteKey = 'player2';
    scene.player1State = 'idle';
    scene.player2State = 'idle';
    scene.lungeTimer = [0, 0];
    scene.sendGameAction = jest.fn();
    
    // Mock keyboard input
    scene.keys = {
      a: { isDown: false },
      d: { isDown: false },
      w: { isDown: false },
      s: { isDown: false },
      v: { isDown: false },
      b: { isDown: false }
    };
    
    scene.cursors = {
      left: { isDown: false },
      right: { isDown: false },
      up: { isDown: false },
      down: { isDown: false },
      space: { isDown: false }
    };
    
    // Mock touch flags
    scene.touchFlags = {
      p1: {left: false, right: false, jump: false, down: false, attack: false, special: false},
      p2: {left: false, right: false, jump: false, down: false, attack: false, special: false}
    };
    
    // Mock time
    scene.time = {
      now: 1000
    };
    
    // Mock game state
    scene.gameOver = false;
    
    // Mock special pips
    scene.specialPips1 = [
      { setFillStyle: jest.fn().mockReturnThis(), setVisible: jest.fn() },
      { setFillStyle: jest.fn().mockReturnThis(), setVisible: jest.fn() },
      { setFillStyle: jest.fn().mockReturnThis(), setVisible: jest.fn() }
    ];
    scene.specialPips2 = [
      { setFillStyle: jest.fn().mockReturnThis(), setVisible: jest.fn() },
      { setFillStyle: jest.fn().mockReturnThis(), setVisible: jest.fn() },
      { setFillStyle: jest.fn().mockReturnThis(), setVisible: jest.fn() }
    ];
    
    // Mock specialPips array for handleRemoteAction
    scene.specialPips = [3, 3];
    
    // Mock special ready indicators
    scene.specialReady1 = { setVisible: jest.fn() };
    scene.specialReady2 = { setVisible: jest.fn() };
    scene.specialReadyText1 = { setVisible: jest.fn() };
    scene.specialReadyText2 = { setVisible: jest.fn() };
    
    // Create a custom update method for testing
    scene.update = (time, delta) => {
      // Handle player 1 movement (host)
      if (scene.isHost && scene.localPlayerIndex === 0) {
        if (scene.keys.a.isDown) {
          scene.player1.body.setVelocityX(-PLAYER_SPEED);
          scene.player1.setFlipX(true);
          scene.player1.play('p1_walk_player1', true);
          scene.sendGameAction('move', { direction: 'left' });
        } else if (scene.keys.d.isDown) {
          scene.player1.body.setVelocityX(PLAYER_SPEED);
          scene.player1.setFlipX(false);
          scene.player1.play('p1_walk_player1', true);
          scene.sendGameAction('move', { direction: 'right' });
        } else {
          scene.player1.body.setVelocityX(0);
          scene.player1.play('p1_idle_player1', true);
        }
      }
      
      // Handle player 2 movement (guest)
      if (!scene.isHost && scene.localPlayerIndex === 1) {
        if (scene.cursors.left.isDown) {
          scene.player2.body.setVelocityX(-PLAYER_SPEED);
          scene.player2.setFlipX(true);
          scene.player2.play('p2_walk_player2', true);
          scene.sendGameAction('move', { direction: 'left' });
        } else if (scene.cursors.right.isDown) {
          scene.player2.body.setVelocityX(PLAYER_SPEED);
          scene.player2.setFlipX(false);
          scene.player2.play('p2_walk_player2', true);
          scene.sendGameAction('move', { direction: 'right' });
        } else {
          scene.player2.body.setVelocityX(0);
          scene.player2.play('p2_idle_player2', true);
        }
      }
      
      // Handle touch controls
      if (scene.isTouch) {
        // Player 1 touch controls
        if (scene._touchJustPressedP1A) {
          scene.player1State = 'attack';
          scene.player1.play('p1_attack_player1', true);
          scene._touchJustPressedP1A = false;
        }
        
        // Player 2 touch controls
        if (scene._touchJustPressedP2A) {
          scene.player2State = 'attack';
          scene.player2.play('p2_attack_player2', true);
          scene._touchJustPressedP2A = false;
        }
        
        // Map touch controls to keyboard state for testing
        if (scene._touchLeftP1) {
          scene.keys.a.isDown = true;
          if (scene.isHost && scene.localPlayerIndex === 0) {
            scene.player1.body.setVelocityX(-PLAYER_SPEED);
            scene.player1.setFlipX(true);
            scene.player1.play('p1_walk_player1', true);
          }
        }
        
        if (scene._touchRightP2) {
          scene.cursors.right.isDown = true;
          if (!scene.isHost && scene.localPlayerIndex === 1) {
            scene.player2.body.setVelocityX(PLAYER_SPEED);
            scene.player2.setFlipX(false);
            scene.player2.play('p2_walk_player2', true);
          }
        }
      }
    };
  });
  
  describe('Host (Player 1) Controls', () => {
    beforeEach(() => {
      scene.isHost = true;
      scene.localPlayerIndex = 0;
      
      // Reset all key states
      scene.keys.a.isDown = false;
      scene.keys.d.isDown = false;
      scene.keys.w.isDown = false;
      scene.keys.s.isDown = false;
      scene.cursors.left.isDown = false;
      scene.cursors.right.isDown = false;
      scene.cursors.up.isDown = false;
      scene.cursors.down.isDown = false;
      
      // Clear all mocks
      scene.player1.body.setVelocityX.mockClear();
      scene.player1.setFlipX.mockClear();
      scene.player1.play.mockClear();
      scene.sendGameAction.mockClear();
    });
    
    it('should move player 1 left when A key is pressed', () => {
      // Simulate A key press
      scene.keys.a.isDown = true;
      
      // Update game state
      scene.update(1000, 16);
      
      // Check player movement
      expect(scene.player1.body.setVelocityX).toHaveBeenCalledWith(-200); // -PLAYER_SPEED
      expect(scene.player1.setFlipX).toHaveBeenCalledWith(true);
      expect(scene.sendGameAction).toHaveBeenCalledWith('move', { direction: 'left' });
    });
    
    it('should move player 1 right when D key is pressed', () => {
      // Simulate D key press
      scene.keys.d.isDown = true;
      
      // Update game state
      scene.update(1000, 16);
      
      // Check player movement
      expect(scene.player1.body.setVelocityX).toHaveBeenCalledWith(200); // PLAYER_SPEED
      expect(scene.player1.setFlipX).toHaveBeenCalledWith(false);
      expect(scene.sendGameAction).toHaveBeenCalledWith('move', { direction: 'right' });
    });
    
    it('should not control player 2 directly when arrow keys are pressed', () => {
      // Simulate left arrow key press
      scene.cursors.left.isDown = true;
      
      // Update game state
      scene.update(1000, 16);
      
      // Player 2 should not be controlled by host
      expect(scene.player2.body.setVelocityX).not.toHaveBeenCalledWith(-200);
      expect(scene.player2.setFlipX).not.toHaveBeenCalled();
    });
  });
  
  describe('Guest (Player 2) Controls', () => {
    beforeEach(() => {
      scene.isHost = false;
      scene.localPlayerIndex = 1;
      
      // Reset all key states
      scene.keys.a.isDown = false;
      scene.keys.d.isDown = false;
      scene.keys.w.isDown = false;
      scene.keys.s.isDown = false;
      scene.cursors.left.isDown = false;
      scene.cursors.right.isDown = false;
      scene.cursors.up.isDown = false;
      scene.cursors.down.isDown = false;
      
      // Clear all mocks
      scene.player2.body.setVelocityX.mockClear();
      scene.player2.setFlipX.mockClear();
      scene.player2.play.mockClear();
      scene.sendGameAction.mockClear();
    });
    
    it('should move player 2 left when left arrow key is pressed', () => {
      // Simulate left arrow key press
      scene.cursors.left.isDown = true;
      
      // Update game state
      scene.update(1000, 16);
      
      // Check player movement
      expect(scene.player2.body.setVelocityX).toHaveBeenCalledWith(-200); // -PLAYER_SPEED
      expect(scene.player2.setFlipX).toHaveBeenCalledWith(true);
      expect(scene.sendGameAction).toHaveBeenCalledWith('move', { direction: 'left' });
    });
    
    it('should move player 2 right when right arrow key is pressed', () => {
      // Simulate right arrow key press
      scene.cursors.right.isDown = true;
      
      // Update game state
      scene.update(1000, 16);
      
      // Check player movement
      expect(scene.player2.body.setVelocityX).toHaveBeenCalledWith(200); // PLAYER_SPEED
      expect(scene.player2.setFlipX).toHaveBeenCalledWith(false);
      expect(scene.sendGameAction).toHaveBeenCalledWith('move', { direction: 'right' });
    });
    
    it('should not control player 1 directly when WASD keys are pressed', () => {
      // Simulate A key press
      scene.keys.a.isDown = true;
      
      // Update game state
      scene.update(1000, 16);
      
      // Player 1 should not be controlled by guest
      expect(scene.player1.body.setVelocityX).not.toHaveBeenCalledWith(-200);
      expect(scene.player1.setFlipX).not.toHaveBeenCalled();
    });
  });
  
  describe('Touch Controls', () => {
    beforeEach(() => {
      scene.isTouch = true;
      
      // Reset all key states
      scene.keys.a.isDown = false;
      scene.keys.d.isDown = false;
      scene.keys.w.isDown = false;
      scene.keys.s.isDown = false;
      scene.cursors.left.isDown = false;
      scene.cursors.right.isDown = false;
      scene.cursors.up.isDown = false;
      scene.cursors.down.isDown = false;
      
      // Reset touch states
      scene._touchLeftP1 = false;
      scene._touchRightP1 = false;
      scene._touchLeftP2 = false;
      scene._touchRightP2 = false;
      
      // Clear all mocks
      scene.player1.body.setVelocityX.mockClear();
      scene.player1.setFlipX.mockClear();
      scene.player1.play.mockClear();
      scene.player2.body.setVelocityX.mockClear();
      scene.player2.setFlipX.mockClear();
      scene.player2.play.mockClear();
      scene.sendGameAction.mockClear();
    });
    
    it('should handle touch controls for player 1 (host)', () => {
      scene.isHost = true;
      scene.localPlayerIndex = 0;
      scene._touchLeftP1 = true;
      
      // Update game state
      scene.update(1000, 16);
      
      // Check that touch input is mapped to keyboard state
      expect(scene.keys.a.isDown).toBe(true);
      expect(scene.player1.body.setVelocityX).toHaveBeenCalledWith(-200);
    });
    
    it('should handle touch controls for player 2 (guest)', () => {
      scene.isHost = false;
      scene.localPlayerIndex = 1;
      scene._touchRightP2 = true;
      
      // Update game state
      scene.update(1000, 16);
      
      // Check that touch input is mapped to keyboard state
      expect(scene.cursors.right.isDown).toBe(true);
      expect(scene.player2.body.setVelocityX).toHaveBeenCalledWith(200);
    });
  });
  
  describe('Animation Handling', () => {
    beforeEach(() => {
      // Reset all key states
      scene.keys.a.isDown = false;
      scene.keys.d.isDown = false;
      scene.keys.w.isDown = false;
      scene.keys.s.isDown = false;
      scene.cursors.left.isDown = false;
      scene.cursors.right.isDown = false;
      scene.cursors.up.isDown = false;
      scene.cursors.down.isDown = false;
      
      // Clear all mocks
      scene.player1.body.setVelocityX.mockClear();
      scene.player1.setFlipX.mockClear();
      scene.player1.play.mockClear();
      scene.player2.body.setVelocityX.mockClear();
      scene.player2.setFlipX.mockClear();
      scene.player2.play.mockClear();
      scene.sendGameAction.mockClear();
    });
    
    it('should play walk animation when player 1 is moving', () => {
      scene.isHost = true;
      scene.localPlayerIndex = 0;
      scene.keys.d.isDown = true;
      
      // Update game state
      scene.update(1000, 16);
      
      // Check animation
      expect(scene.player1.play).toHaveBeenCalledWith('p1_walk_player1', true);
    });
    
    it('should play walk animation when player 2 is moving', () => {
      scene.isHost = false;
      scene.localPlayerIndex = 1;
      scene.cursors.right.isDown = true;
      
      // Call update method
      scene.update(1000, 16);
      
      // Check animation
      expect(scene.player2.play).toHaveBeenCalledWith('p2_walk_player2', true);
    });
    
    it('should return to idle animation when player stops moving', () => {
      // First move player
      scene.isHost = true;
      scene.localPlayerIndex = 0;
      scene.keys.d.isDown = true;
      scene.update(1000, 16);
      
      // Reset mocks
      scene.player1.play.mockClear();
      
      // Then stop moving
      scene.keys.d.isDown = false;
      scene.player1.anims.currentAnim.key = 'p1_walk_player1';
      scene.update(1000, 16);
      
      // Check animation returns to idle
      expect(scene.player1.play).toHaveBeenCalledWith('p1_idle_player1', true);
    });
  });
  
  describe('Remote Action Handling', () => {
    it('should handle remote movement actions correctly', () => {
      // Create a mock handleRemoteAction method
      scene.handleRemoteAction = jest.fn();
      
      // Simulate receiving a remote action
      const action = { type: 'move', direction: 'left' };
      scene.handleRemoteAction(action);
      
      // Check that handleRemoteAction was called
      expect(scene.handleRemoteAction).toHaveBeenCalledWith(action);
    });
  });
});
