import KidsFightScene from '../kidsfight_scene';

// Mock Phaser globally for this test file
const mockAdd = {
  rectangle: jest.fn().mockImplementation(() => ({
    setDepth: jest.fn().mockReturnThis(),
    destroy: jest.fn()
  })),
  text: jest.fn().mockImplementation(() => ({
    setOrigin: jest.fn().mockReturnThis(),
    setInteractive: jest.fn().mockReturnThis(),
    setDepth: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    destroy: jest.fn()
  })),
  graphics: jest.fn().mockReturnValue({
    fillStyle: jest.fn().mockReturnThis(),
    fillRect: jest.fn().mockReturnThis(),
    clear: jest.fn().mockReturnThis(),
    setDepth: jest.fn().mockReturnThis(),
    destroy: jest.fn()
  })
};

const mockCameras = {
  main: {
    width: 800,
    height: 600
  }
};

describe('KidsFightScene - Rematch Popup Z-Index', () => {
  let scene: KidsFightScene;
  let mockRectangle: any;
  let mockText: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create fresh mock objects for each test
    mockRectangle = {
      setDepth: jest.fn().mockReturnThis(),
      destroy: jest.fn()
    };
    
    mockText = {
      setOrigin: jest.fn().mockReturnThis(),
      setInteractive: jest.fn().mockReturnThis(),
      setDepth: jest.fn().mockReturnThis(),
      on: jest.fn().mockReturnThis(),
      destroy: jest.fn()
    };

    // Setup mock implementations
    mockAdd.rectangle.mockReturnValue(mockRectangle);
    mockAdd.text.mockReturnValue(mockText);

    // Create scene instance
    scene = new KidsFightScene();
    
    // Mock scene properties
    scene.add = mockAdd as any;
    scene.cameras = mockCameras as any;
    scene.roomCode = 'test-room';
    scene.gameMode = 'online';
    scene.isHost = false;
    scene.selectedScenario = 'scenario1';
    scene.selected = { p1: 'bento', p2: 'roni' };
    
    // Mock WebSocket manager
    scene.wsManager = {
      sendReplayResponse: jest.fn().mockReturnValue(true)
    };

    // Reset popup state
    (scene as any).replayPopupShown = false;
    (scene as any).replayPopupElements = [];
  });

  describe('showReplayRequestPopup', () => {
    it('should set background z-index to 5000', () => {
      scene.showReplayRequestPopup();

      expect(mockAdd.rectangle).toHaveBeenCalledWith(
        400, // width / 2
        300, // height / 2
        400,
        200,
        0x000000,
        0.7
      );
      expect(mockRectangle.setDepth).toHaveBeenCalledWith(5000);
    });

    it('should set text z-index to 5001', () => {
      scene.showReplayRequestPopup();

      // Check that text was created with correct z-index
      expect(mockAdd.text).toHaveBeenCalledWith(
        400, // width / 2
        260, // height / 2 - 40
        'O oponente quer jogar novamente',
        { fontSize: '24px', color: '#ffffff' }
      );
      expect(mockText.setDepth).toHaveBeenCalledWith(5001);
    });

    it('should set accept button z-index to 5001', () => {
      scene.showReplayRequestPopup();

      // Accept button should be the second text call
      expect(mockAdd.text).toHaveBeenNthCalledWith(2,
        340, // width / 2 - 60
        320, // height / 2 + 20
        'Aceitar',
        { fontSize: '20px', color: '#00ff00', backgroundColor: '#333333', padding: { x: 10, y: 5 } }
      );
      // All text elements should have setDepth called with 5001
      expect(mockText.setDepth).toHaveBeenCalledWith(5001);
    });

    it('should set decline button z-index to 5001', () => {
      scene.showReplayRequestPopup();

      // Decline button should be the third text call
      expect(mockAdd.text).toHaveBeenNthCalledWith(3,
        460, // width / 2 + 60
        320, // height / 2 + 20
        'Recusar',
        { fontSize: '20px', color: '#ff0000', backgroundColor: '#333333', padding: { x: 10, y: 5 } }
      );
      // All text elements should have setDepth called with 5001
      expect(mockText.setDepth).toHaveBeenCalledWith(5001);
    });

    it('should have popup elements with higher z-index than other game elements', () => {
      scene.showReplayRequestPopup();

      // Background should be at 5000 (higher than timer at 10, health bars at 2, etc.)
      expect(mockRectangle.setDepth).toHaveBeenCalledWith(5000);
      
      // Text and buttons should be at 5001 (even higher than background)
      expect(mockText.setDepth).toHaveBeenCalledWith(5001);
      
      // Verify z-index hierarchy: 5001 > 5000 > other game elements
      const backgroundZIndex = 5000;
      const textZIndex = 5001;
      const timerZIndex = 10; // From createTimer method
      const healthBarZIndex = 2; // From createHealthBars method
      const winnerTextZIndex = 1000; // From endGame method
      const rematchButtonZIndex = 1500; // From endGame method

      expect(textZIndex).toBeGreaterThan(backgroundZIndex);
      expect(backgroundZIndex).toBeGreaterThan(rematchButtonZIndex);
      expect(backgroundZIndex).toBeGreaterThan(winnerTextZIndex);
      expect(backgroundZIndex).toBeGreaterThan(timerZIndex);
      expect(backgroundZIndex).toBeGreaterThan(healthBarZIndex);
    });

    it('should only show popup once when called multiple times', () => {
      // Call showReplayRequestPopup multiple times
      scene.showReplayRequestPopup();
      scene.showReplayRequestPopup();
      scene.showReplayRequestPopup();

      // Should only create elements once
      expect(mockAdd.rectangle).toHaveBeenCalledTimes(1);
      expect(mockAdd.text).toHaveBeenCalledTimes(3); // 1 text + 2 buttons
      expect(mockRectangle.setDepth).toHaveBeenCalledTimes(1);
    });

    it('should store popup elements for cleanup', () => {
      scene.showReplayRequestPopup();

      const replayPopupElements = (scene as any).replayPopupElements;
      expect(replayPopupElements).toHaveLength(4); // background + text + 2 buttons
      expect((scene as any).replayPopupShown).toBe(true);
    });

    it('should make buttons interactive', () => {
      scene.showReplayRequestPopup();

      // Verify buttons are made interactive
      expect(mockText.setInteractive).toHaveBeenCalledTimes(2); // accept and decline buttons
    });

    it('should setup event handlers for buttons', () => {
      scene.showReplayRequestPopup();

      // Verify event handlers are attached
      expect(mockText.on).toHaveBeenCalledWith('pointerdown', expect.any(Function));
      expect(mockText.on).toHaveBeenCalledTimes(2); // accept and decline buttons
    });
  });

  describe('hideReplayPopup', () => {
    it('should destroy all popup elements', () => {
      // Show popup first
      scene.showReplayRequestPopup();
      
      // Hide popup
      scene.hideReplayPopup();

      // All elements should be destroyed
      expect(mockRectangle.destroy).toHaveBeenCalledTimes(1);
      expect(mockText.destroy).toHaveBeenCalledTimes(3); // text + 2 buttons

      // State should be reset
      expect((scene as any).replayPopupElements).toHaveLength(0);
      expect((scene as any).replayPopupShown).toBe(false);
    });

    it('should handle empty popup elements array gracefully', () => {
      // Call hideReplayPopup without showing popup first
      expect(() => scene.hideReplayPopup()).not.toThrow();
      
      expect((scene as any).replayPopupElements).toHaveLength(0);
      expect((scene as any).replayPopupShown).toBe(false);
    });
  });

  describe('Z-Index comparison with other UI elements', () => {
    it('should have higher z-index than timer display', () => {
      const POPUP_BACKGROUND_Z = 5000;
      const POPUP_TEXT_Z = 5001;
      const TIMER_Z = 10; // From timerText.setDepth(10) in createTimer
      
      expect(POPUP_BACKGROUND_Z).toBeGreaterThan(TIMER_Z);
      expect(POPUP_TEXT_Z).toBeGreaterThan(TIMER_Z);
    });

    it('should have higher z-index than health bars', () => {
      const POPUP_BACKGROUND_Z = 5000;
      const POPUP_TEXT_Z = 5001;
      const HEALTH_BAR_Z = 2; // From healthBar.setDepth(2) in createHealthBars
      
      expect(POPUP_BACKGROUND_Z).toBeGreaterThan(HEALTH_BAR_Z);
      expect(POPUP_TEXT_Z).toBeGreaterThan(HEALTH_BAR_Z);
    });

    it('should have higher z-index than winner text', () => {
      const POPUP_BACKGROUND_Z = 5000;
      const POPUP_TEXT_Z = 5001;
      const WINNER_TEXT_Z = 1000; // From setDepth(1000) in endGame
      
      expect(POPUP_BACKGROUND_Z).toBeGreaterThan(WINNER_TEXT_Z);
      expect(POPUP_TEXT_Z).toBeGreaterThan(WINNER_TEXT_Z);
    });

    it('should have higher z-index than rematch button', () => {
      const POPUP_BACKGROUND_Z = 5000;
      const POPUP_TEXT_Z = 5001;
      const REMATCH_BUTTON_Z = 1500; // From setDepth(1500) in endGame
      
      expect(POPUP_BACKGROUND_Z).toBeGreaterThan(REMATCH_BUTTON_Z);
      expect(POPUP_TEXT_Z).toBeGreaterThan(REMATCH_BUTTON_Z);
    });

    it('should have higher z-index than special pips', () => {
      const POPUP_BACKGROUND_Z = 5000;
      const POPUP_TEXT_Z = 5001;
      const SPECIAL_PIP_Z = 10; // From pip.setDepth(10) in updateSpecialPips
      
      expect(POPUP_BACKGROUND_Z).toBeGreaterThan(SPECIAL_PIP_Z);
      expect(POPUP_TEXT_Z).toBeGreaterThan(SPECIAL_PIP_Z);
    });

    it('should have higher z-index than attack effects', () => {
      const POPUP_BACKGROUND_Z = 5000;
      const POPUP_TEXT_Z = 5001;
      const ATTACK_EFFECT_Z = 100; // From graphicsObj.setDepth(100) in createAttackEffect
      
      expect(POPUP_BACKGROUND_Z).toBeGreaterThan(ATTACK_EFFECT_Z);
      expect(POPUP_TEXT_Z).toBeGreaterThan(ATTACK_EFFECT_Z);
    });
  });
});