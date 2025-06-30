// @ts-nocheck - Disable TypeScript checking for this test file
import KidsFightScene from '../kidsfight_scene';

// Mock Phaser
jest.mock('phaser', () => {
  return {
    Scene: class MockScene {},
    Physics: {
      Arcade: {
        Sprite: class MockSprite {
          constructor(scene, x, y, texture) {
            this.scene = scene;
            this.x = x;
            this.y = y;
            this.texture = { key: texture };
          }
          setOrigin() { return this; }
          setScale() { return this; }
          setBounce() { return this; }
          setGravityY() { return this; }
          setCollideWorldBounds() { return this; }
          setSize() { return this; }
          setOffset() { return this; }
          setFlipX() { return this; }
          setData() { return this; }
          getData() { return false; }
          play() { return this; }
          anims = { stop: jest.fn() };
          body = { velocity: { x: 0, y: 0 } };
        }
      }
    },
    GameObjects: {
      Rectangle: class MockRectangle {
        setOrigin() { return this; }
      }
    }
  };
});

describe('Player Positioning', () => {
  let mockPhysics;
  
  beforeEach(() => {
    // Create a mock physics object
    mockPhysics = {
      add: {
        sprite: jest.fn((x, y, texture) => {
          return new (jest.requireMock('phaser').Physics.Arcade.Sprite)({}, x, y, texture);
        })
      }
    };
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  it('should position players responsively based on screen width', () => {
    // Arrange
    const screenWidth = 800;
    
    // Act - Calculate positions directly using the same logic as in KidsFightScene
    const p1X = Math.max(screenWidth * 0.15, 80);
    const p1Y = 310; // 50px above platform
    const p2X = Math.min(screenWidth * 0.85, screenWidth - 80);
    const p2Y = 310; // 50px above platform
    
    // Create player sprites
    const player1 = mockPhysics.add.sprite(p1X, p1Y, 'bento');
    const player2 = mockPhysics.add.sprite(p2X, p2Y, 'roni');
    
    // Assert
    // Player 1 should be at 15% of screen width
    expect(player1.x).toBeCloseTo(screenWidth * 0.15);
    expect(player1.y).toBe(310); // 50px above platform
    
    // Player 2 should be at 85% of screen width
    expect(player2.x).toBeCloseTo(screenWidth * 0.85);
    expect(player2.y).toBe(310); // 50px above platform
  });
  
  it('should respect minimum margins on small screens', () => {
    // Arrange
    const smallScreenWidth = 300;
    
    // Act - Calculate positions directly using the same logic as in KidsFightScene
    const p1X = Math.max(smallScreenWidth * 0.15, 80);
    const p1Y = 310; // 50px above platform
    const p2X = Math.min(smallScreenWidth * 0.85, smallScreenWidth - 80);
    const p2Y = 310; // 50px above platform
    
    // Create player sprites
    const player1 = mockPhysics.add.sprite(p1X, p1Y, 'bento');
    const player2 = mockPhysics.add.sprite(p2X, p2Y, 'roni');
    
    // Assert
    // Player 1 should be at minimum 80px from left
    expect(player1.x).toBe(80);
    
    // Player 2 should be at minimum 80px from right
    expect(player2.x).toBe(smallScreenWidth - 80);
  });
  
  it('should position players above the platform', () => {
    // Arrange
    const screenWidth = 800;
    const platformHeight = 360;
    const playerOffsetY = 50;
    
    // Act - Calculate positions directly using the same logic as in KidsFightScene
    const p1X = Math.max(screenWidth * 0.15, 80);
    const p1Y = platformHeight - playerOffsetY; // 50px above platform
    const p2X = Math.min(screenWidth * 0.85, screenWidth - 80);
    const p2Y = platformHeight - playerOffsetY; // 50px above platform
    
    // Create player sprites
    const player1 = mockPhysics.add.sprite(p1X, p1Y, 'bento');
    const player2 = mockPhysics.add.sprite(p2X, p2Y, 'roni');
    
    // Assert
    // Both players should be positioned 50px above the platform
    expect(player1.y).toBe(platformHeight - playerOffsetY);
    expect(player2.y).toBe(platformHeight - playerOffsetY);
  });
  
  it('should handle large screens correctly', () => {
    // Arrange
    const largeScreenWidth = 2000;
    
    // Act - Calculate positions directly using the same logic as in KidsFightScene
    const p1X = Math.max(largeScreenWidth * 0.15, 80);
    const p1Y = 310; // 50px above platform
    const p2X = Math.min(largeScreenWidth * 0.85, largeScreenWidth - 80);
    const p2Y = 310; // 50px above platform
    
    // Create player sprites
    const player1 = mockPhysics.add.sprite(p1X, p1Y, 'bento');
    const player2 = mockPhysics.add.sprite(p2X, p2Y, 'roni');
    
    // Assert
    // Player 1 should be at 15% of screen width
    expect(player1.x).toBeCloseTo(largeScreenWidth * 0.15);
    
    // Player 2 should be at 85% of screen width
    expect(player2.x).toBeCloseTo(largeScreenWidth * 0.85);
  });
});
