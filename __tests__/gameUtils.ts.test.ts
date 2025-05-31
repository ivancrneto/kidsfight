import { updateSceneLayout } from '../gameUtils';
import Phaser from 'phaser';

// Mock Phaser objects
jest.mock('phaser', () => {
  const mockPhaser = {
    GameObjects: {
      GameObject: jest.fn(),
    },
    Scene: jest.fn(),
    Scale: {
      ScaleManager: jest.fn(),
    }
  };
  
  return mockPhaser;
});

describe('gameUtils.ts', () => {
  describe('updateSceneLayout', () => {
    let mockScene: any;
    let mockPlayers: any[];
    let mockPlatform: any;
    
    beforeEach(() => {
      // Mock players
      mockPlayers = [
        {
          setPosition: jest.fn(),
          setOrigin: jest.fn(),
          setScale: jest.fn(),
          health: 100,
          special: 50
        },
        {
          setPosition: jest.fn(),
          setOrigin: jest.fn(),
          setScale: jest.fn(),
          health: 100,
          special: 50
        }
      ];
      
      // Mock platform
      mockPlatform = {
        setPosition: jest.fn(),
        setSize: jest.fn()
      };
      
      // Mock background
      const mockBackground = {
        setPosition: jest.fn(),
        setScale: jest.fn()
      };
      
      // Mock health and special bars
      const mockHealthBar1 = { setPosition: jest.fn(), setSize: jest.fn() };
      const mockHealthBar2 = { setPosition: jest.fn(), setSize: jest.fn() };
      const mockHealthBarBg1 = { setPosition: jest.fn(), setSize: jest.fn() };
      const mockHealthBarBg2 = { setPosition: jest.fn(), setSize: jest.fn() };
      const mockSpecialBar1 = { setPosition: jest.fn(), setSize: jest.fn() };
      const mockSpecialBar2 = { setPosition: jest.fn(), setSize: jest.fn() };
      const mockSpecialBarBg1 = { setPosition: jest.fn(), setSize: jest.fn() };
      const mockSpecialBarBg2 = { setPosition: jest.fn(), setSize: jest.fn() };
      
      // Create mock scene
      mockScene = {
        scale: { width: 800, height: 600 },
        isReady: true,
        players: mockPlayers,
        platform: mockPlatform,
        background: mockBackground,
        healthBar1: mockHealthBar1,
        healthBar2: mockHealthBar2,
        healthBarBg1: mockHealthBarBg1,
        healthBarBg2: mockHealthBarBg2,
        specialBar1: mockSpecialBar1,
        specialBar2: mockSpecialBar2,
        specialBarBg1: mockSpecialBarBg1,
        specialBarBg2: mockSpecialBarBg2
      };
    });
    
    it('positions players at the correct x and y coordinates', () => {
      // Act
      updateSceneLayout(mockScene);
      
      // Assert
      const expectedPlayerY = mockScene.scale.height * 0.45;
      expect(mockScene.players[0].setPosition).toHaveBeenCalledWith(
        mockScene.scale.width * 0.3, 
        expectedPlayerY
      );
      expect(mockScene.players[1].setPosition).toHaveBeenCalledWith(
        mockScene.scale.width * 0.7, 
        expectedPlayerY
      );
    });
    
    it('positions platform correctly relative to player position', () => {
      // Act
      updateSceneLayout(mockScene);
      
      // Assert
      const playerY = mockScene.scale.height * 0.45;
      const platformHeight = mockScene.scale.height * 0.045;
      const expectedPlatformY = playerY + platformHeight / 2;
      
      expect(mockScene.platform.setPosition).toHaveBeenCalledWith(
        mockScene.scale.width / 2, 
        expectedPlatformY
      );
      expect(mockScene.platform.setSize).toHaveBeenCalledWith(
        mockScene.scale.width, 
        platformHeight
      );
    });
    
    it('positions and sizes health bars correctly', () => {
      // Act
      updateSceneLayout(mockScene);
      
      // Assert
      const barWidth = Math.min(mockScene.scale.width * 0.25, 200);
      const barHeight = Math.min(mockScene.scale.height * 0.03, 20);
      const barY = mockScene.scale.height * 0.1;
      const p1X = mockScene.scale.width * 0.25;
      const p2X = mockScene.scale.width * 0.75;
      
      // Health bar backgrounds
      expect(mockScene.healthBarBg1.setPosition).toHaveBeenCalledWith(p1X, barY);
      expect(mockScene.healthBarBg1.setSize).toHaveBeenCalledWith(barWidth, barHeight);
      expect(mockScene.healthBarBg2.setPosition).toHaveBeenCalledWith(p2X, barY);
      expect(mockScene.healthBarBg2.setSize).toHaveBeenCalledWith(barWidth, barHeight);
      
      // Health bars
      const healthBar1Width = barWidth * mockScene.players[0].health / 100;
      const healthBar2Width = barWidth * mockScene.players[1].health / 100;
      
      expect(mockScene.healthBar1.setSize).toHaveBeenCalledWith(healthBar1Width, barHeight);
      expect(mockScene.healthBar2.setSize).toHaveBeenCalledWith(healthBar2Width, barHeight);
    });
    
    it('positions and sizes special bars correctly', () => {
      // Act
      updateSceneLayout(mockScene);
      
      // Assert
      const barWidth = Math.min(mockScene.scale.width * 0.25, 200);
      const barHeight = Math.min(mockScene.scale.height * 0.03, 20);
      const barY = mockScene.scale.height * 0.1;
      const specialBarY = barY + barHeight + 10;
      const p1X = mockScene.scale.width * 0.25;
      const p2X = mockScene.scale.width * 0.75;
      
      // Special bar backgrounds
      expect(mockScene.specialBarBg1.setPosition).toHaveBeenCalledWith(p1X, specialBarY);
      expect(mockScene.specialBarBg1.setSize).toHaveBeenCalledWith(barWidth, barHeight/2);
      expect(mockScene.specialBarBg2.setPosition).toHaveBeenCalledWith(p2X, specialBarY);
      expect(mockScene.specialBarBg2.setSize).toHaveBeenCalledWith(barWidth, barHeight/2);
      
      // Special bars
      const specialBar1Width = barWidth * mockScene.players[0].special / 100;
      const specialBar2Width = barWidth * mockScene.players[1].special / 100;
      
      expect(mockScene.specialBar1.setSize).toHaveBeenCalledWith(specialBar1Width, barHeight/2);
      expect(mockScene.specialBar2.setSize).toHaveBeenCalledWith(specialBar2Width, barHeight/2);
    });
    
    it('positions background at center of screen with appropriate scaling', () => {
      // Act
      updateSceneLayout(mockScene);
      
      // Assert
      expect(mockScene.background.setPosition).toHaveBeenCalledWith(
        mockScene.scale.width / 2, 
        mockScene.scale.height / 2
      );
      
      const expectedBgScale = Math.max(
        mockScene.scale.width / 800, 
        mockScene.scale.height / 600
      );
      expect(mockScene.background.setScale).toHaveBeenCalledWith(expectedBgScale);
    });
  });
});
