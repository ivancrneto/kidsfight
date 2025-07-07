import KidsFightScene from '../kidsfight_scene';

describe('KidsFightScene updatePlayerAnimation', () => {
  let scene: any;
  let mockPlayer: any;
  let originalY: number;

  beforeEach(() => {
    scene = new KidsFightScene();
    scene.setSafeFrame = jest.fn();
    scene.updateWalkingAnimation = jest.fn();
    scene.stopWalkingAnimation = jest.fn();
    scene.time = { delayedCall: jest.fn() };
    
    originalY = 300;
    mockPlayer = {
      y: originalY,
      body: { velocity: { x: 0, y: 0 } },
      isAttacking: false,
      isSpecialAttacking: false,
      isBlocking: false,
      direction: 'right',
      setFrame: jest.fn(),
      getData: jest.fn(() => false),
      setData: jest.fn(),
      anims: { stop: jest.fn() }
    };
    
    // Mock players array
    scene.players = [mockPlayer];
  });

  describe('blocking animation', () => {
    it('should set frame 5 when player is blocking', () => {
      mockPlayer.isBlocking = true;
      
      scene.updatePlayerAnimation(0);
      
      expect(scene.setSafeFrame).toHaveBeenCalledWith(mockPlayer, 5);
    });

    it('should set frame 5 when getData returns true for isBlocking', () => {
      mockPlayer.getData.mockImplementation((key: string) => key === 'isBlocking');
      
      scene.updatePlayerAnimation(0);
      
      expect(scene.setSafeFrame).toHaveBeenCalledWith(mockPlayer, 5);
    });

    it('should preserve Y position when blocking', () => {
      mockPlayer.isBlocking = true;
      
      scene.updatePlayerAnimation(0);
      
      expect(mockPlayer.y).toBe(originalY);
    });
  });

  describe('victory animation', () => {
    it('should handle game over state gracefully', () => {
      scene.gameOver = true;
      scene.winner = 0; // Player 0 wins
      
      scene.updatePlayerAnimation(0);
      
      // When game is over, normal animation logic still applies (no special victory frame)
      expect(scene.stopWalkingAnimation).toHaveBeenCalledWith(mockPlayer);
    });

    it('should not crash for losing player', () => {
      scene.gameOver = true;
      scene.winner = 1; // Player 1 wins, player 0 loses
      
      scene.updatePlayerAnimation(0);
      
      // Should handle normally without errors
      expect(scene.stopWalkingAnimation).toHaveBeenCalledWith(mockPlayer);
    });

    it('should preserve Y position when celebrating victory', () => {
      scene.gameOver = true;
      scene.winner = 0;
      
      scene.updatePlayerAnimation(0);
      
      expect(mockPlayer.y).toBe(originalY);
    });
  });

  describe('movement animation integration', () => {
    it('should call updateWalkingAnimation when player is moving', () => {
      mockPlayer.body.velocity.x = 100; // Moving
      
      scene.updatePlayerAnimation(0);
      
      expect(scene.updateWalkingAnimation).toHaveBeenCalledWith(mockPlayer);
      expect(scene.stopWalkingAnimation).not.toHaveBeenCalled();
    });

    it('should call stopWalkingAnimation when player is not moving', () => {
      mockPlayer.body.velocity.x = 0; // Not moving
      
      scene.updatePlayerAnimation(0);
      
      expect(scene.stopWalkingAnimation).toHaveBeenCalledWith(mockPlayer);
      expect(scene.updateWalkingAnimation).not.toHaveBeenCalled();
    });

    it('should prioritize blocking over movement', () => {
      mockPlayer.isBlocking = true;
      mockPlayer.body.velocity.x = 100; // Moving but blocking
      
      scene.updatePlayerAnimation(0);
      
      expect(scene.setSafeFrame).toHaveBeenCalledWith(mockPlayer, 5);
      expect(scene.updateWalkingAnimation).not.toHaveBeenCalled();
    });

    it('should prioritize blocking over movement when game is over', () => {
      scene.gameOver = true;
      scene.winner = 0;
      mockPlayer.isBlocking = true;
      mockPlayer.body.velocity.x = 100;
      
      scene.updatePlayerAnimation(0);
      
      expect(scene.setSafeFrame).toHaveBeenCalledWith(mockPlayer, 5);
      expect(scene.updateWalkingAnimation).not.toHaveBeenCalled();
    });
  });

  describe('attack animation handling', () => {
    it('should handle regular attack with frame 4 and 200ms timeout', () => {
      mockPlayer.isAttacking = true;
      
      scene.updatePlayerAnimation(0);
      
      expect(scene.setSafeFrame).toHaveBeenCalledWith(mockPlayer, 4);
      expect(scene.time.delayedCall).toHaveBeenCalledWith(200, expect.any(Function));
    });

    it('should handle special attack with frame 6', () => {
      mockPlayer.isSpecialAttacking = true;
      
      scene.updatePlayerAnimation(0);
      
      expect(scene.setSafeFrame).toHaveBeenCalledWith(mockPlayer, 6);
    });

    it('should reset attack state after timeout', () => {
      mockPlayer.isAttacking = true;
      
      scene.updatePlayerAnimation(0);
      
      // Get the callback function from delayedCall
      const timeoutCallback = scene.time.delayedCall.mock.calls[0][1];
      
      // Execute the callback
      timeoutCallback();
      
      expect(scene.setSafeFrame).toHaveBeenCalledWith(mockPlayer, 0);
      expect(mockPlayer.isAttacking).toBe(false);
      expect(mockPlayer.setData).toHaveBeenCalledWith('isAttacking', false);
      expect(mockPlayer.anims.stop).toHaveBeenCalled();
    });
  });

  describe('animation priority order', () => {
    it('should prioritize attack over all other states when attacking', () => {
      scene.gameOver = true;
      scene.winner = 0;
      mockPlayer.isAttacking = true;
      mockPlayer.isBlocking = true;
      mockPlayer.body.velocity.x = 100;
      
      scene.updatePlayerAnimation(0);
      
      expect(scene.setSafeFrame).toHaveBeenCalledWith(mockPlayer, 4);
    });

    it('should prioritize attack over blocking and movement', () => {
      mockPlayer.isAttacking = true;
      mockPlayer.isBlocking = true;
      mockPlayer.body.velocity.x = 100;
      
      scene.updatePlayerAnimation(0);
      
      expect(scene.setSafeFrame).toHaveBeenCalledWith(mockPlayer, 4);
    });

    it('should prioritize regular attack when both attack types are active', () => {
      mockPlayer.isAttacking = true;
      mockPlayer.isSpecialAttacking = true;
      
      scene.updatePlayerAnimation(0);
      
      // Regular attack has higher priority in the implementation
      expect(scene.setSafeFrame).toHaveBeenCalledWith(mockPlayer, 4);
    });

    it('should prioritize blocking over movement', () => {
      mockPlayer.isBlocking = true;
      mockPlayer.body.velocity.x = 100;
      
      scene.updatePlayerAnimation(0);
      
      expect(scene.setSafeFrame).toHaveBeenCalledWith(mockPlayer, 5);
      expect(scene.updateWalkingAnimation).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle missing player gracefully', () => {
      expect(() => scene.updatePlayerAnimation(99)).not.toThrow();
    });

    it('should handle player without body', () => {
      delete mockPlayer.body;
      
      expect(() => scene.updatePlayerAnimation(0)).not.toThrow();
    });

    it('should handle player without getData method', () => {
      delete mockPlayer.getData;
      
      expect(() => scene.updatePlayerAnimation(0)).not.toThrow();
    });

    it('should always preserve Y position regardless of animation state', () => {
      const testCases = [
        { setup: () => { mockPlayer.isAttacking = true; } },
        { setup: () => { mockPlayer.isBlocking = true; } },
        { setup: () => { mockPlayer.body.velocity.x = 100; } },
        { setup: () => { scene.gameOver = true; scene.winner = 0; } }
      ];
      
      testCases.forEach(({ setup }, index) => {
        // Reset
        mockPlayer.y = originalY;
        mockPlayer.isAttacking = false;
        mockPlayer.isBlocking = false;
        mockPlayer.body.velocity.x = 0;
        scene.gameOver = false;
        scene.winner = undefined;
        
        // Setup test case
        setup();
        
        // Run animation
        scene.updatePlayerAnimation(0);
        
        // Verify Y position preserved
        expect(mockPlayer.y).toBe(originalY);
      });
    });
  });
});