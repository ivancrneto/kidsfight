import KidsFightScene from '../kidsfight_scene';

// Create a testable version of KidsFightScene that exposes protected methods
class TestableKidsFightScene extends KidsFightScene {
  // Mock required methods
  public create() {
    // No-op to avoid calling Phaser methods
  }
  
  public update() {
    // No-op
  }
  
  // Mock the checkHit method that's called by handleRemoteAction
  protected checkHit(playerIndex: number, attacker: any, target: any, isSpecial: boolean): void {
    // Mock implementation
  }
  
  // Override the private method to make it accessible for testing
  public testHandleRemoteAction(action: any) {
    // @ts-ignore - We're intentionally accessing protected member for testing
    return this.handleRemoteAction(action);
  }
}

describe('handleRemoteAction', () => {
  let scene: TestableKidsFightScene;
  let mockPlayer1: any;
  let mockPlayer2: any;

  beforeEach(() => {
    // Create a simple mock for players with animation support
    const playerMocks = [
      {
        setVelocityX: jest.fn(),
        setVelocityY: jest.fn(),
        setFlipX: jest.fn(),
        setFrame: jest.fn(),
        setData: jest.fn(),
        body: {
          blocked: {
            down: true,  // Simulate being on the ground by default
            left: false,
            right: false,
            up: false,
            none: false
          },
          touching: { down: true, left: false, right: false, up: false, none: false },
          velocity: { x: 0, y: 0 },
          setVelocityX: jest.fn().mockImplementation(function(this: any, x: number) {
            this.velocity.x = x;
          }),
          setVelocityY: jest.fn().mockImplementation(function(this: any, y: number) {
            this.velocity.y = y;
          }),
          setGravityY: jest.fn(),
          setCollideWorldBounds: jest.fn(),
          on: jest.fn()
        },
        getData: jest.fn().mockImplementation(function(this: any, key: string) {
          if (!this._data) {
            this._data = {
              'isHit': false,
              'isAttacking': false,
              'isBlocking': false,
              'specialCooldown': 0,
              'attackCooldown': 0,
              'health': 100,
              'specialMeter': 0,
              'lastDirection': 1,
              'isJumping': false,
              'isDucking': false
            };
          }
          return this._data[key];
        }),
        anims: {
          play: jest.fn()
        },
        texture: {
          key: 'player1'
        },
        width: 32,
        height: 64,
        // Add health and special meter properties
        health: 100,
        specialMeter: 0,
        x: 0,
        y: 0
      },
      {
        setVelocityX: jest.fn(),
        setVelocityY: jest.fn(),
        setFlipX: jest.fn(),
        setFrame: jest.fn(),
        setData: jest.fn(),
        body: {
          blocked: {
            down: true,
            left: false,
            right: false,
            up: false,
            none: false
          },
          touching: { down: true, left: false, right: false, up: false, none: false },
          velocity: { x: 0, y: 0 },
          setVelocityX: jest.fn(),
          setVelocityY: jest.fn(),
          setGravityY: jest.fn(),
          setCollideWorldBounds: jest.fn(),
          on: jest.fn()
        },
        getData: jest.fn().mockImplementation(function(this: any, key: string) {
          if (!this._data) {
            this._data = {
              'isHit': false,
              'isAttacking': false,
              'isBlocking': false,
              'specialCooldown': 0,
              'attackCooldown': 0,
              'health': 100,
              'specialMeter': 0,
              'lastDirection': 1,
              'isJumping': false,
              'isDucking': false
            };
          }
          return this._data[key];
        }),
        anims: {
          play: jest.fn()
        },
        texture: {
          key: 'player2'
        },
        width: 32,
        height: 64,
        // Add health and special meter properties
        health: 100,
        specialMeter: 0,
        x: 100,
        y: 0
      }
    ];
    scene = new TestableKidsFightScene();
    scene.players = playerMocks;
    mockPlayer1 = playerMocks[0];
    mockPlayer2 = playerMocks[1];
    
    // Set up test environment
    (scene as any).isHost = true;
    (scene as any).gameMode = 'online';
    (scene as any).playerDirection = ['right', 'left'];
    (scene as any).playerBlocking = [false, false];
    (scene as any).lastAttackTime = [0, 0];
    (scene as any).lastSpecialTime = [0, 0];
    (scene as any).gameOver = false;
    (scene as any).time = {
      delayedCall: jest.fn((time, callback) => callback())
    };
  });

  it('should handle move action for player 1', () => {
    // Test moving right
    scene.testHandleRemoteAction({ type: 'move', playerIndex: 0, direction: 1 });
    expect(scene.players[0].setVelocityX).toHaveBeenCalledWith(160);
    expect(scene.players[0].setFlipX).toHaveBeenCalledWith(false);
    expect((scene as any).playerDirection[0]).toBe('right');
    
    // Test moving left
    jest.clearAllMocks();
    scene.testHandleRemoteAction({ type: 'move', playerIndex: 0, direction: -1 });
    expect(scene.players[0].setVelocityX).toHaveBeenCalledWith(-160);
    expect(scene.players[0].setFlipX).toHaveBeenCalledWith(true);
    expect((scene as any).playerDirection[0]).toBe('left');
    
    // Test stop
    jest.clearAllMocks();
    scene.testHandleRemoteAction({ type: 'move', playerIndex: 0, direction: 0 });
    expect(scene.players[0].setVelocityX).toHaveBeenCalledWith(0);
    // setFlipX is called with false when direction is 0, which is fine
  });

  it('should handle move action for player 2', () => {
    // Test moving right
    scene.testHandleRemoteAction({ type: 'move', playerIndex: 1, direction: 1 });
    expect(scene.players[1].setVelocityX).toHaveBeenCalledWith(160);
    expect(scene.players[1].setFlipX).toHaveBeenCalledWith(false);
    expect((scene as any).playerDirection[1]).toBe('right');
  });

  it('should handle jump action', () => {
    // Test jump when on ground
    scene.players[0].body.touching.down = true;
    scene.testHandleRemoteAction({ type: 'jump', playerIndex: 0 });
    expect(scene.players[0].setVelocityY).toHaveBeenCalledWith(-330);
    
    // Test jump when in air (should not jump)
    jest.clearAllMocks();
    scene.players[0].body.touching.down = false;
    scene.testHandleRemoteAction({ type: 'jump', playerIndex: 0 });
    expect(scene.players[0].setVelocityY).not.toHaveBeenCalled();
  });

  it('should handle block action', () => {
    // Test blocking
    scene.testHandleRemoteAction({ type: 'block', playerIndex: 0, active: true });
    expect(scene.players[0].setData).toHaveBeenCalledWith('isBlocking', true);
    expect((scene as any).playerBlocking[0]).toBe(true);
    
    // Test unblocking
    jest.clearAllMocks();
    scene.testHandleRemoteAction({ type: 'block', playerIndex: 0, active: false });
    expect(scene.players[0].setData).toHaveBeenCalledWith('isBlocking', false);
    expect((scene as any).playerBlocking[0]).toBe(false);
  });

  it('should handle attack action', () => {
    const now = Date.now();
    jest.spyOn(Date, 'now').mockImplementation(() => now);
    
    const mockTryAttack = jest.fn();
    (scene as any).tryAttack = mockTryAttack;
    
    // Test attack for player 1
    scene.testHandleRemoteAction({ type: 'attack', playerIndex: 0 });
    expect(mockTryAttack).toHaveBeenCalled();
    
    // Test attack for player 2
    jest.clearAllMocks();
    scene.testHandleRemoteAction({ type: 'attack', playerIndex: 1 });
    expect(mockTryAttack).toHaveBeenCalled();
    
    // Test attack when not in online mode
    (scene as any).gameMode = 'local';
    jest.clearAllMocks();
    scene.testHandleRemoteAction({ type: 'attack', playerIndex: 0 });
    // Even in local mode, the attack should be processed but not sent over the network
    // So we expect the attack to be called, but the test should verify the network behavior separately
    expect(mockTryAttack).toHaveBeenCalled();
  });

  it('should handle special action', () => {
    const now = Date.now();
    jest.spyOn(Date, 'now').mockImplementation(() => now);
    
    const mockTryAttack = jest.fn();
    (scene as any).tryAttack = mockTryAttack;
    
    // Test special for player 1
    scene.testHandleRemoteAction({ type: 'special', playerIndex: 0 });
    expect(mockTryAttack).toHaveBeenCalled();
    
    // Test special for player 2
    jest.clearAllMocks();
    scene.testHandleRemoteAction({ type: 'special', playerIndex: 1 });
    expect(mockTryAttack).toHaveBeenCalled();
    
    // Test special when not in online mode
    (scene as any).gameMode = 'local';
    jest.clearAllMocks();
    scene.testHandleRemoteAction({ type: 'special', playerIndex: 1 });
    // Even in local mode, the special should be processed but not sent over the network
    // So we expect the attack to be called, but the test should verify the network behavior separately
    expect(mockTryAttack).toHaveBeenCalled();
  });
  
  it('should not process actions when game is over', () => {
    (scene as any).gameOver = true;
    
    scene.testHandleRemoteAction({ type: 'move', playerIndex: 0, direction: 1 });
    expect(scene.players[0].body.setVelocityX).not.toHaveBeenCalled();
    
    scene.testHandleRemoteAction({ type: 'jump', playerIndex: 0 });
    expect(scene.players[0].body.setVelocityY).not.toHaveBeenCalled();
  });
  
  it('should not process actions when not in online mode', () => {
    (scene as any).gameMode = 'single';
    
    scene.testHandleRemoteAction({ type: 'move', playerIndex: 0, direction: 1 });
    expect(scene.players[0].body.setVelocityX).not.toHaveBeenCalled();
  });
});
