import KidsFightScene from '../kidsfight_scene';

describe('KidsFightScene - Rematch Popup Integration', () => {
  let scene: KidsFightScene;
  
  beforeEach(() => {
    scene = new KidsFightScene();
    
    // Mock scene dependencies
    scene.add = {
      rectangle: jest.fn().mockReturnValue({
        setDepth: jest.fn().mockReturnThis(),
        destroy: jest.fn()
      }),
      text: jest.fn().mockImplementation(() => ({
        setOrigin: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
        destroy: jest.fn()
      }))
    } as any;
    
    scene.cameras = {
      main: { width: 800, height: 600 }
    } as any;
    
    scene.scene = {
      restart: jest.fn()
    } as any;
    
    // Setup WebSocket manager mock
    scene.wsManager = {
      sendReplayResponse: jest.fn().mockReturnValue(true)
    };
    
    // Initialize scene state
    scene.roomCode = 'test-room';
    scene.gameMode = 'online';
    scene.isHost = false;
    scene.selectedScenario = 'scenario1';
    scene.selected = { p1: 'bento', p2: 'roni' };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create rematch popup with correct z-index hierarchy', () => {
    const rectangleSpy = scene.add.rectangle as jest.Mock;
    const textSpy = scene.add.text as jest.Mock;
    
    scene.showReplayRequestPopup();
    
    // Verify rectangle (background) was created with z-index 5000
    expect(rectangleSpy).toHaveBeenCalledWith(400, 300, 400, 200, 0x000000, 0.7);
    const backgroundElement = rectangleSpy.mock.results[0].value;
    expect(backgroundElement.setDepth).toHaveBeenCalledWith(5000);
    
    // Verify text elements were created with z-index 5001
    expect(textSpy).toHaveBeenCalledTimes(3); // main text + 2 buttons
    textSpy.mock.results.forEach(result => {
      expect(result.value.setDepth).toHaveBeenCalledWith(5001);
    });
  });

  it('should handle accept button click correctly', () => {
    const textSpy = scene.add.text as jest.Mock;
    
    scene.showReplayRequestPopup();
    
    // Get the accept button (second text element)
    const acceptButtonMock = textSpy.mock.results[1].value;
    const onClickHandler = acceptButtonMock.on.mock.calls.find(
      (call: any[]) => call[0] === 'pointerdown'
    )[1];
    
    // Trigger accept button click
    onClickHandler();
    
    // Verify WebSocket message was sent
    expect(scene.wsManager.sendReplayResponse).toHaveBeenCalledWith(
      'test-room',
      true,
      {
        gameMode: 'online',
        isHost: false,
        selectedScenario: 'scenario1',
        selected: { p1: 'bento', p2: 'roni' }
      }
    );
    
    // Verify scene restart was triggered
    expect(scene.scene.restart).toHaveBeenCalledWith({
      gameMode: 'online',
      isHost: false,
      roomCode: 'test-room',
      selectedScenario: 'scenario1',
      selected: { p1: 'bento', p2: 'roni' }
    });
  });

  it('should handle decline button click correctly', () => {
    const textSpy = scene.add.text as jest.Mock;
    
    scene.showReplayRequestPopup();
    
    // Get the decline button (third text element)
    const declineButtonMock = textSpy.mock.results[2].value;
    const onClickHandler = declineButtonMock.on.mock.calls.find(
      (call: any[]) => call[0] === 'pointerdown'
    )[1];
    
    // Trigger decline button click
    onClickHandler();
    
    // Verify WebSocket message was sent
    expect(scene.wsManager.sendReplayResponse).toHaveBeenCalledWith(
      'test-room',
      false
    );
  });

  it('should properly clean up popup elements', () => {
    scene.showReplayRequestPopup();
    
    // Verify elements are stored
    const popupElements = (scene as any).replayPopupElements;
    expect(popupElements).toHaveLength(4);
    expect((scene as any).replayPopupShown).toBe(true);
    
    // Hide popup
    scene.hideReplayPopup();
    
    // Verify cleanup
    popupElements.forEach((element: any) => {
      expect(element.destroy).toHaveBeenCalled();
    });
    
    expect((scene as any).replayPopupElements).toHaveLength(0);
    expect((scene as any).replayPopupShown).toBe(false);
  });

  it('should prevent duplicate popups', () => {
    const rectangleSpy = scene.add.rectangle as jest.Mock;
    const textSpy = scene.add.text as jest.Mock;
    
    // Show popup multiple times
    scene.showReplayRequestPopup();
    scene.showReplayRequestPopup();
    scene.showReplayRequestPopup();
    
    // Should only create elements once
    expect(rectangleSpy).toHaveBeenCalledTimes(1);
    expect(textSpy).toHaveBeenCalledTimes(3);
  });

  it('should maintain z-index values as constants', () => {
    // Test that our z-index values are correctly set as expected
    const EXPECTED_BACKGROUND_Z = 5000;
    const EXPECTED_TEXT_Z = 5001;
    
    scene.showReplayRequestPopup();
    
    const rectangleMock = (scene.add.rectangle as jest.Mock).mock.results[0].value;
    const textMocks = (scene.add.text as jest.Mock).mock.results;
    
    expect(rectangleMock.setDepth).toHaveBeenCalledWith(EXPECTED_BACKGROUND_Z);
    textMocks.forEach(result => {
      expect(result.value.setDepth).toHaveBeenCalledWith(EXPECTED_TEXT_Z);
    });
    
    // Verify hierarchy
    expect(EXPECTED_TEXT_Z).toBeGreaterThan(EXPECTED_BACKGROUND_Z);
  });
});