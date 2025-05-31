const { updateSceneLayout, KidsFightScene } = require('../gameUtils.cjs');

describe('gameUtils.cjs', () => {
  describe('updateSceneLayout', () => {
    let mockScene;
    let consoleSpy;
    
    beforeEach(() => {
      // Spy on console.log to avoid cluttering test output
      consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      // Create mock players
      const mockPlayer1 = { 
        setPosition: jest.fn(),
        setOrigin: jest.fn(),
        setScale: jest.fn()
      };
      
      const mockPlayer2 = { 
        setPosition: jest.fn(),
        setOrigin: jest.fn(),
        setScale: jest.fn()
      };
      
      // Create mock platform
      const mockPlatform = {
        setPosition: jest.fn(),
        setSize: jest.fn()
      };
      
      // Create mock special pips
      const createMockPip = () => ({
        setPosition: jest.fn(),
        setRadius: jest.fn(),
        setFillStyle: jest.fn(),
        setAlpha: jest.fn(),
        setVisible: jest.fn()
      });
      
      const mockSpecialPips1 = [
        createMockPip(),
        createMockPip(),
        createMockPip()
      ];
      
      const mockSpecialPips2 = [
        createMockPip(),
        createMockPip(),
        createMockPip()
      ];
      
      // Mock scene with essential components
      mockScene = {
        scale: { width: 800, height: 600 },
        isReady: true,
        player1: mockPlayer1,
        player2: mockPlayer2,
        platform: mockPlatform,
        specialPips1: mockSpecialPips1,
        specialPips2: mockSpecialPips2,
        healthBar1: { setPosition: jest.fn(), setSize: jest.fn() },
        healthBar2: { setPosition: jest.fn(), setSize: jest.fn() },
        timerText: { setPosition: jest.fn() },
        children: {
          list: [
            { 
              texture: { key: 'scenario1' },
              setPosition: jest.fn(),
              displayWidth: 0,
              displayHeight: 0
            }
          ]
        }
      };
    });
    
    afterEach(() => {
      consoleSpy.mockRestore();
    });
    
    it('positions players at 30% and 70% of screen width and at 45% screen height', () => {
      // Act
      updateSceneLayout(mockScene);
      
      // Assert
      const expectedP1X = mockScene.scale.width * 0.3;
      const expectedP2X = mockScene.scale.width * 0.7;
      const expectedPlayerY = mockScene.scale.height * 0.45;
      
      expect(mockScene.player1.setPosition).toHaveBeenCalledWith(expectedP1X, expectedPlayerY);
      expect(mockScene.player2.setPosition).toHaveBeenCalledWith(expectedP2X, expectedPlayerY);
    });
    
    it('positions platform directly below players at the correct height', () => {
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
    
    it('correctly positions special pips for player 1', () => {
      // Act
      updateSceneLayout(mockScene);
      
      // Assert
      const barY = mockScene.scale.height * 0.07;
      const pipY = barY - mockScene.scale.height * 0.035; // slightly above health bar
      const pipR = Math.max(10, mockScene.scale.height * 0.018);
      
      // Check all three pips for player 1
      for (let i = 0; i < 3; i++) {
        const expectedPip1X = mockScene.scale.width * 0.25 - pipR * 3 + i * pipR * 3;
        expect(mockScene.specialPips1[i].setPosition).toHaveBeenCalledWith(expectedPip1X, pipY);
        expect(mockScene.specialPips1[i].setRadius).toHaveBeenCalledWith(pipR);
      }
    });
    
    it('correctly positions special pips for player 2', () => {
      // Act
      updateSceneLayout(mockScene);
      
      // Assert
      const barY = mockScene.scale.height * 0.07;
      const pipY = barY - mockScene.scale.height * 0.035; // slightly above health bar
      const pipR = Math.max(10, mockScene.scale.height * 0.018);
      
      // Check all three pips for player 2
      for (let i = 0; i < 3; i++) {
        const expectedPip2X = mockScene.scale.width * 0.75 - pipR * 3 + i * pipR * 3;
        expect(mockScene.specialPips2[i].setPosition).toHaveBeenCalledWith(expectedPip2X, pipY);
        expect(mockScene.specialPips2[i].setRadius).toHaveBeenCalledWith(pipR);
      }
    });
    
    it('positions timer text in the center of screen at the correct height', () => {
      // Act
      updateSceneLayout(mockScene);
      
      // Assert
      expect(mockScene.timerText.setPosition).toHaveBeenCalledWith(
        mockScene.scale.width / 2, 
        mockScene.scale.height * 0.07
      );
    });
    
    it('sets background to cover the entire screen', () => {
      // Act
      updateSceneLayout(mockScene);
      
      // Assert
      const bg = mockScene.children.list[0];
      expect(bg.setPosition).toHaveBeenCalledWith(
        mockScene.scale.width / 2, 
        mockScene.scale.height / 2
      );
      expect(bg.displayWidth).toBe(mockScene.scale.width);
      expect(bg.displayHeight).toBe(mockScene.scale.height);
    });
  });
  
  describe('KidsFightScene', () => {
    it('creates a mock scene with the correct default properties', () => {
      // Act
      const scene = new KidsFightScene();
      
      // Assert
      expect(scene.gameOver).toBe(false);
      expect(scene.playerHealth).toEqual([100, 100]);
      expect(scene.p1SpriteKey).toBe('player1');
      expect(scene.p2SpriteKey).toBe('player2');
      expect(scene.timeLeft).toBe(60);
      expect(scene.isReady).toBe(true);
      expect(scene.scale).toEqual({ width: 800, height: 600 });
    });
    
    it('getCharacterName returns the correct name based on spriteKey', () => {
      // Arrange
      const scene = new KidsFightScene();
      
      // Act & Assert
      expect(scene.getCharacterName('player1')).toBe('Bento');
      expect(scene.getCharacterName('player2')).toBe('Davi R');
      expect(scene.getCharacterName('custom_key')).toBe('Jogador');
    });
    
    it('checkWinner returns false when no winner determined', () => {
      // Arrange
      const scene = new KidsFightScene();
      scene.gameOver = false;
      scene.playerHealth = [50, 50];
      scene.timeLeft = 30;
      
      // Act & Assert
      expect(scene.checkWinner()).toBe(false);
    });
    
    it('checkWinner returns true when player 2 health is 0', () => {
      // Arrange
      const scene = new KidsFightScene();
      scene.gameOver = false;
      scene.playerHealth = [50, 0];
      
      // Act
      const result = scene.checkWinner();
      
      // Assert
      expect(result).toBe(true);
    });
    
    it('checkWinner returns true when player 1 health is 0', () => {
      // Arrange
      const scene = new KidsFightScene();
      scene.gameOver = false;
      scene.playerHealth = [0, 50];
      
      // Act
      const result = scene.checkWinner();
      
      // Assert
      expect(result).toBe(true);
    });
  });
});
