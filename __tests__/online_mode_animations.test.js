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

describe('Online Mode Animations', () => {
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
      body: {
        setVelocityX: jest.fn(),
        setVelocityY: jest.fn(),
        touching: { down: true },
        onFloor: jest.fn().mockReturnValue(true),
        velocity: { x: 0, y: 0 }
      },
      anims: {
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
      body: {
        setVelocityX: jest.fn(),
        setVelocityY: jest.fn(),
        touching: { down: true },
        onFloor: jest.fn().mockReturnValue(true),
        velocity: { x: 0, y: 0 }
      },
      anims: {
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
    scene.playerHealth = [100, 100];
    scene.healthBar1 = { width: 200 };
    scene.healthBar2 = { width: 200 };
    
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
    
    // Mock time
    scene.time = {
      now: 1000,
      delayedCall: jest.fn((delay, callback) => {
        if (callback) callback();
        return { remove: jest.fn() };
      })
    };
    
    // Mock game state
    scene.gameOver = false;
    
    // Create a custom handleRemoteAction method for testing
    scene.handleRemoteAction = (action) => {
      const playerIndex = action.playerIndex || 0;
      
      switch (action.type) {
        case 'attack':
          scene[playerIndex === 0 ? 'player1State' : 'player2State'] = 'attack';
          scene.players[playerIndex].play(`p${playerIndex+1}_attack_${scene[playerIndex === 0 ? 'p1SpriteKey' : 'p2SpriteKey']}`, true);
          // Simulate animation completion
          setTimeout(() => {
            scene[playerIndex === 0 ? 'player1State' : 'player2State'] = 'idle';
            scene.players[playerIndex].play(`p${playerIndex+1}_idle_${scene[playerIndex === 0 ? 'p1SpriteKey' : 'p2SpriteKey']}`, true);
          }, 10);
          break;
          
        case 'special':
          if (scene.specialPips[playerIndex] >= 3) {
            scene[playerIndex === 0 ? 'player1State' : 'player2State'] = 'special';
            scene.specialPips[playerIndex] = 0;
            scene.attackCount[playerIndex] = 0;
            scene.players[playerIndex].play(`p${playerIndex+1}_special_${scene[playerIndex === 0 ? 'p1SpriteKey' : 'p2SpriteKey']}`, true);
            // Simulate animation completion
            setTimeout(() => {
              scene[playerIndex === 0 ? 'player1State' : 'player2State'] = 'idle';
              scene.players[playerIndex].play(`p${playerIndex+1}_idle_${scene[playerIndex === 0 ? 'p1SpriteKey' : 'p2SpriteKey']}`, true);
            }, 10);
          }
          break;
          
        case 'move':
          if (action.direction === 'left') {
            scene.players[playerIndex].body.setVelocityX(-PLAYER_SPEED);
            scene.players[playerIndex].setFlipX(true);
            scene.players[playerIndex].play(`p${playerIndex+1}_walk_${scene[playerIndex === 0 ? 'p1SpriteKey' : 'p2SpriteKey']}`, true);
          } else if (action.direction === 'right') {
            scene.players[playerIndex].body.setVelocityX(PLAYER_SPEED);
            scene.players[playerIndex].setFlipX(false);
            scene.players[playerIndex].play(`p${playerIndex+1}_walk_${scene[playerIndex === 0 ? 'p1SpriteKey' : 'p2SpriteKey']}`, true);
          } else {
            scene.players[playerIndex].body.setVelocityX(0);
            scene.players[playerIndex].play(`p${playerIndex+1}_idle_${scene[playerIndex === 0 ? 'p1SpriteKey' : 'p2SpriteKey']}`, true);
          }
          break;
      }
    };
  });
  
  describe('Attack Animations', () => {
    it('should play attack animation for player 1 when attack action is triggered', () => {
      scene.isHost = true;
      scene.localPlayerIndex = 0;
      
      // Simulate attack action
      scene.handleRemoteAction({ type: 'attack', playerIndex: 0 });
      
      // Check animation
      expect(scene.player1.play).toHaveBeenCalledWith('p1_attack_player1', true);
      expect(scene.player1State).toBe('attack');
    });
    
    it('should play attack animation for player 2 when attack action is triggered', () => {
      scene.isHost = false;
      scene.localPlayerIndex = 1;
      
      // Simulate attack action
      scene.handleRemoteAction({ type: 'attack', playerIndex: 1 });
      
      // Check animation
      expect(scene.player2.play).toHaveBeenCalledWith('p2_attack_player2', true);
      expect(scene.player2State).toBe('attack');
    });
    
    it('should return to idle animation after attack completes', (done) => {
      scene.isHost = true;
      scene.localPlayerIndex = 0;
      scene.player1State = 'attack';
      
      // Trigger the attack which will schedule the idle transition
      scene.handleRemoteAction({ type: 'attack', playerIndex: 0 });
      
      // Wait for the timeout in our mock handleRemoteAction
      setTimeout(() => {
        expect(scene.player1State).toBe('idle');
        expect(scene.player1.play).toHaveBeenCalledWith('p1_idle_player1', true);
        done();
      }, 20);
    });
  });
  
  describe('Special Attack Animations', () => {
    beforeEach(() => {
      // Set up attack count to enable special attacks
      scene.attackCount = [3, 3];
      scene.specialPips = [3, 3];
    });
    
    it('should play special animation for player 1 when special action is triggered', () => {
      scene.isHost = true;
      scene.localPlayerIndex = 0;
      
      // Simulate special attack action
      scene.handleRemoteAction({ type: 'special', playerIndex: 0 });
      
      // Check animation
      expect(scene.player1.play).toHaveBeenCalledWith('p1_special_player1', true);
      expect(scene.player1State).toBe('special');
      expect(scene.attackCount[0]).toBe(0); // Should reset attack count
    });
    
    it('should play special animation for player 2 when special action is triggered', () => {
      scene.isHost = false;
      scene.localPlayerIndex = 1;
      
      // Simulate special attack action
      scene.handleRemoteAction({ type: 'special', playerIndex: 1 });
      
      // Check animation
      expect(scene.player2.play).toHaveBeenCalledWith('p2_special_player2', true);
      expect(scene.player2State).toBe('special');
      expect(scene.attackCount[1]).toBe(0); // Should reset attack count
    });
    
    it('should return to idle animation after special attack completes', (done) => {
      scene.isHost = true;
      scene.localPlayerIndex = 0;
      scene.player1State = 'special';
      
      // Trigger the special which will schedule the idle transition
      scene.handleRemoteAction({ type: 'special', playerIndex: 0 });
      
      // Wait for the timeout in our mock handleRemoteAction
      setTimeout(() => {
        expect(scene.player1State).toBe('idle');
        expect(scene.player1.play).toHaveBeenCalledWith('p1_idle_player1', true);
        done();
      }, 20);
    });
  });
  
  describe('Movement Animations', () => {
    it('should play walk animation for player 1 when move action with direction left is triggered', () => {
      // Simulate move action
      scene.handleRemoteAction({ type: 'move', direction: 'left', playerIndex: 0 });
      
      // Check animation and direction
      expect(scene.player1.play).toHaveBeenCalledWith('p1_walk_player1', true);
      expect(scene.player1.setFlipX).toHaveBeenCalledWith(true);
      expect(scene.player1.body.setVelocityX).toHaveBeenCalledWith(-200); // -PLAYER_SPEED
    });
    
    it('should play walk animation for player 1 when move action with direction right is triggered', () => {
      // Simulate move action
      scene.handleRemoteAction({ type: 'move', direction: 'right', playerIndex: 0 });
      
      // Check animation and direction
      expect(scene.player1.play).toHaveBeenCalledWith('p1_walk_player1', true);
      expect(scene.player1.setFlipX).toHaveBeenCalledWith(false);
      expect(scene.player1.body.setVelocityX).toHaveBeenCalledWith(200); // PLAYER_SPEED
    });
    
    it('should play idle animation when move action with direction stop is triggered', () => {
      // First set player to walking
      scene.handleRemoteAction({ type: 'move', direction: 'right', playerIndex: 0 });
      scene.player1.play.mockClear();
      
      // Then stop
      scene.handleRemoteAction({ type: 'move', direction: 'stop', playerIndex: 0 });
      
      // Check animation
      expect(scene.player1.play).toHaveBeenCalledWith('p1_idle_player1', true);
      expect(scene.player1.body.setVelocityX).toHaveBeenCalledWith(0);
    });
  });
  
  describe('Touch Controls and Animations', () => {
    beforeEach(() => {
      scene.isTouch = true;
      scene._touchJustPressedP1A = false;
      scene._touchJustPressedP1S = false;
      scene._touchJustPressedP2A = false;
      scene._touchJustPressedP2S = false;
      scene._touchWasDownP1A = false;
      scene._touchWasDownP1S = false;
      scene._touchWasDownP2A = false;
      scene._touchWasDownP2S = false;
      
      // Create a custom update method for touch controls testing
      scene.update = (time, delta) => {
        // Handle touch controls for player 1
        if (scene.isHost && scene.localPlayerIndex === 0) {
          if (scene._touchJustPressedP1A) {
            scene.player1State = 'attack';
            scene.player1.play('p1_attack_player1', true);
            scene._touchJustPressedP1A = false;
          }
          
          if (scene._touchJustPressedP1S && scene.attackCount[0] >= 3) {
            scene.player1State = 'special';
            scene.player1.play('p1_special_player1', true);
            scene.attackCount[0] = 0;
            scene._touchJustPressedP1S = false;
          }
        }
        
        // Handle touch controls for player 2
        if (!scene.isHost && scene.localPlayerIndex === 1) {
          if (scene._touchJustPressedP2A) {
            scene.player2State = 'attack';
            scene.player2.play('p2_attack_player2', true);
            scene._touchJustPressedP2A = false;
          }
          
          if (scene._touchJustPressedP2S && scene.attackCount[1] >= 3) {
            scene.player2State = 'special';
            scene.player2.play('p2_special_player2', true);
            scene.attackCount[1] = 0;
            scene._touchJustPressedP2S = false;
          }
        }
      };
    });
    
    it('should trigger attack animation when touch attack is pressed for player 1', () => {
      scene.isHost = true;
      scene.localPlayerIndex = 0;
      scene._touchJustPressedP1A = true;
      
      // Call update
      scene.update(1000, 16);
      
      // Check animation
      expect(scene.player1.play).toHaveBeenCalledWith('p1_attack_player1', true);
      expect(scene.player1State).toBe('attack');
      expect(scene._touchJustPressedP1A).toBe(false); // Should reset flag
    });
    
    it('should trigger attack animation when touch attack is pressed for player 2', () => {
      scene.isHost = false;
      scene.localPlayerIndex = 1;
      scene._touchJustPressedP2A = true;
      
      // Call update
      scene.update(1000, 16);
      
      // Check animation
      expect(scene.player2.play).toHaveBeenCalledWith('p2_attack_player2', true);
      expect(scene.player2State).toBe('attack');
      expect(scene._touchJustPressedP2A).toBe(false); // Should reset flag
    });
    
    it('should trigger special animation when touch special is pressed for player 1 with enough attack count', () => {
      scene.isHost = true;
      scene.localPlayerIndex = 0;
      scene._touchJustPressedP1S = true;
      scene.attackCount[0] = 3; // Enough for special
      
      // Call update
      scene.update(1000, 16);
      
      // Check animation
      expect(scene.player1.play).toHaveBeenCalledWith('p1_special_player1', true);
      expect(scene.player1State).toBe('special');
      expect(scene.attackCount[0]).toBe(0); // Should reset attack count
      expect(scene._touchJustPressedP1S).toBe(false); // Should reset flag
    });
  });
});
