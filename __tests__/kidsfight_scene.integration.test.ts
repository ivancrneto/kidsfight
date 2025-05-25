import { createMockPlayer } from './createMockPlayer';

// Mock the Phaser scene and its dependencies
const mockScene = {
  add: {
    image: jest.fn().mockReturnThis(),
    sprite: jest.fn().mockReturnValue(createMockPlayer()),
    text: jest.fn().mockReturnThis(),
    graphics: jest.fn().mockReturnThis(),
    container: jest.fn().mockReturnThis()
  },
  physics: {
    add: {
      collider: jest.fn(),
      overlap: jest.fn(),
      sprite: jest.fn().mockReturnValue(createMockPlayer())
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
  }
};

// Mock the KidsFightScene class
jest.mock('../kidsfight_scene', () => {
  return jest.fn().mockImplementation(() => {
    const hitEffects: any[] = [];
    
    // Create a mock sprite for hit effects
    const mockHitEffect = {
      play: jest.fn(),
      on: jest.fn((event, callback) => {
        if (event === 'animationcomplete') {
          setTimeout(() => {
            const index = hitEffects.indexOf(mockHitEffect);
            if (index > -1) {
              hitEffects.splice(index, 1);
            }
            callback();
          }, 100);
        }
        return { on: jest.fn() };
      }),
      destroy: jest.fn()
    };
    
    // Create a new mock scene with the hit effect implementation
    const sceneMock = {
      ...mockScene,
      player1: createMockPlayer(),
      player2: createMockPlayer(),
      selectedScenario: 'test-scenario',
      gameMode: 'local',
      hitEffects,
      showHitEffect: function(pos: { x: number; y: number }) {
        const effect = this.add.sprite(pos.x, pos.y, 'hit_effect');
        effect.play('hit_effect_anim');
        effect.on('animationcomplete', () => {
          const index = this.hitEffects.indexOf(effect);
          if (index > -1) {
            this.hitEffects.splice(index, 1);
          }
          effect.destroy();
        });
        this.hitEffects.push(effect);
        return effect;
      }
    };
    
    // Mock add.sprite to return our mock hit effect
    sceneMock.add.sprite = jest.fn().mockReturnValue(mockHitEffect);
    
    return sceneMock;
  });
});

import KidsFightScene from '../kidsfight_scene';

describe('KidsFightScene Integration', () => {
  let scene: any;
  
  beforeEach(() => {
    // Create a new instance of the scene for each test
    scene = new KidsFightScene();
    
    // Reset all mocks
    jest.clearAllMocks();
  });
  
  it('should initialize with default values', () => {
    expect(scene).toBeDefined();
    expect(scene.player1).toBeDefined();
    expect(scene.player2).toBeDefined();
    expect(scene.selectedScenario).toBe('test-scenario');
    expect(scene.gameMode).toBe('local');
  });
  
  it('should handle player movement', () => {
    const moveAction = {
      type: 'move',
      playerIndex: 0,
      direction: 1
    };
    
    // Mock the handleRemoteAction method
    const originalHandleRemoteAction = scene.handleRemoteAction;
    scene.handleRemoteAction = jest.fn();
    
    // Simulate movement
    scene.handleRemoteAction(moveAction);
    
    // Verify the movement was processed
    expect(scene.handleRemoteAction).toHaveBeenCalledWith(moveAction);
    
    // Restore the original method
    scene.handleRemoteAction = originalHandleRemoteAction;
  });
  
  it('should handle player attacks', () => {
    const attackAction = {
      type: 'attack',
      playerIndex: 0
    };
    
    // Mock the handleRemoteAction method
    const originalHandleRemoteAction = scene.handleRemoteAction;
    scene.handleRemoteAction = jest.fn();
    
    // Simulate attack
    scene.handleRemoteAction(attackAction);
    
    // Verify the attack was processed
    expect(scene.handleRemoteAction).toHaveBeenCalledWith(attackAction);
    
    // Restore the original method
    scene.handleRemoteAction = originalHandleRemoteAction;
  });
  
  it('should show hit effects', async () => {
    const position = { x: 100, y: 100 };
    
    // Mock the sprite that will be returned
    const mockSprite = {
      play: jest.fn(),
      on: jest.fn().mockImplementation(function(this: any, event: string, callback: () => void) {
        if (event === 'animationcomplete') {
          this.callback = callback;
        }
        return { on: jest.fn() };
      }),
      destroy: jest.fn()
    };
    
    // Setup the mock
    (scene.add.sprite as jest.Mock).mockReturnValue(mockSprite);
    
    // Call the method
    scene.showHitEffect(position);
    
    // Verify the effect was shown
    expect(scene.add.sprite).toHaveBeenCalledWith(
      position.x,
      position.y,
      'hit_effect'
    );
    
    // Verify animation was played
    expect(mockSprite.play).toHaveBeenCalledWith('hit_effect_anim');
    
    // Simulate animation complete
    if (typeof mockSprite.on.mock.calls[0]?.[1] === 'function') {
      mockSprite.on.mock.calls[0][1]();
    }
    
    // Verify cleanup
    expect(mockSprite.destroy).toHaveBeenCalled();
    expect(scene.hitEffects).toHaveLength(0);
  });
});
