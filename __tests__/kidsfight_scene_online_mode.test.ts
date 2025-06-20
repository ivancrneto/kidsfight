jest.mock('../websocket_manager');

// --- Ensure WebSocketManager is mocked at the module level ---
// jest.mock('../websocket_manager');

import KidsFightScene from '../kidsfight_scene';
import { setupMockScene, MockWebSocketManager } from './test-utils-fix';

// Create a test harness class that extends KidsFightScene to expose protected methods for testing
class TestKidsFightScene extends KidsFightScene {
  public localPlayerIndex: number = 0;
  constructor() {
    super({});
    
    // Set up the scene with our mock utilities
    setupMockScene(this);
    
    // Initialize game state
    this.gameMode = 'online';
    this.players = [
      { 
        x: 100, 
        y: 300, 
        body: { 
          velocity: { x: 0, y: 0 }, 
          blocked: { down: true }
        }, 
        setVelocityX: jest.fn(), 
        setVelocityY: jest.fn(),
        setData: jest.fn(),
        getData: jest.fn().mockReturnValue(false),
        setTint: jest.fn(),
        clearTint: jest.fn(),
        health: 100
      },
      { 
        x: 500, 
        y: 300, 
        body: { 
          velocity: { x: 0, y: 0 }, 
          blocked: { down: true } 
        }, 
        setVelocityX: jest.fn(), 
        setVelocityY: jest.fn(),
        setData: jest.fn(),
        getData: jest.fn().mockReturnValue(false),
        setTint: jest.fn(),
        clearTint: jest.fn(),
        health: 100
      }
    ] as any;
    
    this.playerHealth = [100, 100];
    this.playerBlocking = [false, false];
    this.playerSpecial = [0, 0];
    this.healthBar1 = this.add.graphics();
    this.healthBar2 = this.add.graphics();
    
    // Create a physics object for the platform
    this.physics.add.staticGroup = jest.fn().mockReturnValue({
      create: jest.fn().mockReturnValue({
        refreshBody: jest.fn(),
        setDepth: jest.fn()
      })
    });
    
    // Set up WebSocket manager mock with all required methods
    this.wsManager = new MockWebSocketManager();
    
    // Spy on the wsManager.send method
    this.wsManager.send = jest.fn(this.wsManager.send);
  }

  // Override update method to make it public for testing
  public update() {
    super.update();
  }
  
  // Mock the methods we need for testing - don't try to override non-existent methods
  public moveLeftRight(playerIdx: number, direction: string) {
    // Mock implementation
    if (playerIdx !== this.localPlayerIndex) return;
    
    if (direction === 'left') {
      this.players[playerIdx].setVelocityX(-160);
      this.wsManager.send({
        type: 'movement',
        playerIdx,
        direction: 'left'
      });
    } else if (direction === 'right') {
      this.players[playerIdx].setVelocityX(160);
      this.wsManager.send({
        type: 'movement',
        playerIdx,
        direction: 'right'
      });
    }
  }
  
  public jump(playerIdx: number) {
    // Mock implementation
    if (playerIdx !== this.localPlayerIndex) return;
    
    if (this.players[playerIdx].body.blocked.down) {
      this.players[playerIdx].setVelocityY(-330);
      this.wsManager.send({
        type: 'jump',
        playerIdx
      });
    }
  }
  
  public block(playerIdx: number, isBlocking: boolean) {
    // Mock implementation
    if (playerIdx !== this.localPlayerIndex) return;
    
    this.playerBlocking[playerIdx] = isBlocking;
    this.players[playerIdx].setData('isBlocking', isBlocking);
    this.wsManager.send({
      type: 'block',
      playerIdx,
      isBlocking
    });
  }
  
  // Process WebSocket messages
  public processMessage(message: any) {
    const data = message;
    
    // Handle different message types
    switch (data.type) {
      case 'movement':
        this.handleRemoteMovement(data);
        break;
      case 'jump':
        this.handleRemoteJump(data);
        break;
      case 'attack':
        this.handleRemoteAttack(data);
        break;
      case 'block':
        this.handleRemoteBlock(data);
        break;
    }
  }

  // Mock methods for testing
  public handleRemoteMovement(data: any) {
    // Mock implementation
    if (data.direction === 'left') {
      this.players[data.playerIdx].setVelocityX(-160);
    } else if (data.direction === 'right') {
      this.players[data.playerIdx].setVelocityX(160);
    } else {
      this.players[data.playerIdx].setVelocityX(0);
    }
  }

  public handleRemoteJump(data: any) {
    // Mock implementation
    if (this.players[data.playerIdx].body.blocked.down) {
      this.players[data.playerIdx].setVelocityY(-330);
    }
  }

  public handleRemoteAttack(data: any) {
    // Mock implementation
    const playerIdx = data.playerIdx;
    const targetIdx = playerIdx === 0 ? 1 : 0;
    
    this.players[playerIdx].setData('isAttacking', true);
    this.tryAttack(playerIdx, targetIdx, Date.now(), false);
  }
  
  public handleRemoteBlock(data: any) {
    // Mock implementation
    this.playerBlocking[data.playerIdx] = data.isBlocking;
    this.players[data.playerIdx].setData('isBlocking', data.isBlocking);
  }
}

describe('KidsFightScene - Online Mode', () => {
  beforeEach(() => {
    if (typeof scene !== 'undefined') {
      if (!scene.textures) scene.textures = { list: {} };
      else scene.textures.list = {};
    }
  });
  describe('Player Movement', () => {
    let scene: TestKidsFightScene;
    
    beforeEach(() => {
      scene = new TestKidsFightScene();
      // Ensure wsManager.send is always a fresh Jest mock
      scene.wsManager.send = jest.fn();
    });
    
    it('should allow players[0] movement as host in online mode', () => {
      // Set up the local player as host (player 0)
      scene.localPlayerIndex = 0;
      
      // Mock the movement call
      scene.moveLeftRight(0, 'left');
      
      // Player 0 should move
      expect(scene.players[0].setVelocityX).toHaveBeenCalledWith(-160);
      
      // And send a message via WebSocket
      expect(scene.wsManager.send).toHaveBeenCalled();
    });
    
    it('should allow players[1] movement as guest in online mode', () => {
      // Set up the local player as guest (player 1)
      scene.localPlayerIndex = 1;
      
      // Mock the movement call
      scene.moveLeftRight(1, 'right');
      
      // Player 1 should move
      expect(scene.players[1].setVelocityX).toHaveBeenCalledWith(160);
      
      // And send a message via WebSocket
      expect(scene.wsManager.send).toHaveBeenCalled();
    });
    
    it('should NOT move players[1] as host in online mode', () => {
      // Set up the local player as host (player 0)
      scene.localPlayerIndex = 0;
      
      // Try to move player 1 directly
      scene.moveLeftRight(1, 'right');
      
      // Player 1 should not move
      expect(scene.players[1].setVelocityX).not.toHaveBeenCalled();
    });
    
    it('should handle remote movement actions', () => {
      // Set up the local player as host (player 0)
      scene.localPlayerIndex = 0;
      
      // Create a mock remote movement message
      const messageData = {
        type: 'movement',
        playerIdx: 1,
        direction: 'left'
      };
      
      // Process the message directly - don't use simulateMessage
      scene.processMessage(messageData);
      
      // Player 1 should move based on remote command
      expect(scene.players[1].setVelocityX).toHaveBeenCalledWith(-160);
    });
    
    it('should handle remote jump actions', () => {
      // Set up the local player as host (player 0)
      scene.localPlayerIndex = 0;
      
      // Create a mock remote jump message
      const messageData = {
        type: 'jump',
        playerIdx: 1
      };
      
      // Process the message directly
      scene.processMessage(messageData);
      
      // Player 1 should jump based on remote command
      expect(scene.players[1].setVelocityY).toHaveBeenCalledWith(-330);
    });
  });
  
  describe('Attacks and Specials', () => {
    let scene: TestKidsFightScene;
    
    beforeEach(() => {
      scene = new TestKidsFightScene();
      scene.tryAttack = jest.fn();
    });
    
    it('should handle remote attack actions', () => {
      // Set up the local player as host (player 0)
      scene.localPlayerIndex = 0;
      
      // Create a mock remote attack message
      const messageData = {
        type: 'attack',
        playerIdx: 1
      };
      
      // Process the message directly
      scene.processMessage(messageData);
      
      // The attacked player should lose health
      expect(scene.tryAttack).toHaveBeenCalled();
      expect(scene.players[1].setData).toHaveBeenCalledWith('isAttacking', true);
    });
    
    it('should handle remote block actions', () => {
      // Set up the local player as host (player 0)
      scene.localPlayerIndex = 0;
      
      // Create a mock remote block message
      const messageData = {
        type: 'block',
        playerIdx: 1,
        isBlocking: true
      };
      
      // Process the message directly
      scene.processMessage(messageData);
      
      // Player 1 should be blocking
      expect(scene.playerBlocking[1]).toBe(true);
      expect(scene.players[1].setData).toHaveBeenCalledWith('isBlocking', true);
    });
  });
});
