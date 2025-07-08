import ScenarioSelectScene from '../scenario_select_scene';

// Mock Phaser
jest.mock('phaser', () => ({
  Scene: class MockScene {
    add = {
      image: jest.fn().mockReturnValue({
        setOrigin: jest.fn().mockReturnThis(),
        setDisplaySize: jest.fn().mockReturnThis(),
        setAlpha: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        setTexture: jest.fn().mockReturnThis(),
        setScale: jest.fn().mockReturnThis(),
        width: 400,
        height: 300
      }),
      rectangle: jest.fn().mockReturnValue({
        setDepth: jest.fn().mockReturnThis()
      }),
      text: jest.fn().mockReturnValue({
        setOrigin: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis(),
        setPadding: jest.fn().mockReturnThis(),
        setBackgroundColor: jest.fn().mockReturnThis(),
        setText: jest.fn().mockReturnThis(),
        setTint: jest.fn().mockReturnThis(),
        setStyle: jest.fn().mockReturnThis(),
        disableInteractive: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
        scene: true
      })
    };
    cameras = {
      main: { width: 800, height: 600 }
    };
    scale = {
      on: jest.fn()
    };
    load = {
      image: jest.fn()
    };
    scene = {
      start: jest.fn()
    };
    textures = {
      exists: jest.fn().mockReturnValue(true)
    };
  }
}));

// Mock WebSocket Manager
const createMockWebSocketManager = () => ({
  send: jest.fn().mockReturnValue(true),
  setMessageCallback: jest.fn(),
  isConnected: jest.fn().mockReturnValue(true),
  disconnect: jest.fn()
});

describe('ScenarioSelectScene - Ready Message Synchronization', () => {
  let scene: ScenarioSelectScene;
  let mockWsManager: any;
  let consoleLogSpy: jest.SpyInstance;
  let consoleDebugSpy: jest.SpyInstance;

  beforeEach(() => {
    mockWsManager = createMockWebSocketManager();
    scene = new ScenarioSelectScene();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleDebugSpy.mockRestore();
  });

  describe('WebSocket Handler Setup', () => {
    it('should set up WebSocket message handler with timing delay for online mode', () => {
      // Initialize scene in online mode
      scene.init({
        mode: 'online',
        isHost: true,
        roomCode: 'TEST123',
        wsManager: mockWsManager,
        selected: { p1: 'bento', p2: 'davir' }
      });

      // Create the scene
      scene.create();

      // Verify WebSocket handler was set up
      expect(mockWsManager.setMessageCallback).toHaveBeenCalled();
      
      // Verify setup logging
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[ScenarioSelectScene] Setting WebSocket message handler for scenario scene'
      );
    });

    it('should not set up WebSocket handler for local mode', () => {
      // Initialize scene in local mode
      scene.init({
        mode: 'local',
        selected: { p1: 'bento', p2: 'davir' }
      });

      // Create the scene
      scene.create();

      // Verify WebSocket handler was NOT set up
      expect(mockWsManager.setMessageCallback).not.toHaveBeenCalled();
    });
  });

  describe('Ready Message Reception', () => {
    let messageHandler: (event: MessageEvent) => void;

    beforeEach(() => {
      // Initialize host scene
      scene.init({
        mode: 'online',
        isHost: true,
        roomCode: 'TEST123',
        wsManager: mockWsManager,
        selected: { p1: 'bento', p2: 'davir' }
      });

      scene.create();

      // Capture the message handler
      messageHandler = mockWsManager.setMessageCallback.mock.calls[0][0];
    });

    it('should process guest ready message and mark guest as ready', () => {
      const guestReadyMessage = {
        type: 'player_ready',
        player: 'guest'
      };

      // Simulate receiving guest ready message
      messageHandler({ data: JSON.stringify(guestReadyMessage) } as MessageEvent);

      // Verify extensive logging for guest ready
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[ScenarioSelectScene][WebSocket] *** PLAYER_READY MESSAGE RECEIVED ***'
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[ScenarioSelectScene][WebSocket] Message data:', guestReadyMessage
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[ScenarioSelectScene][WebSocket] ✅ GUEST marked as ready'
      );

      // Verify internal state was updated
      expect((scene as any).guestReady).toBe(true);
      expect((scene as any).hostReady).toBe(false);
    });

    it('should process host ready message and mark host as ready', () => {
      const hostReadyMessage = {
        type: 'player_ready',
        player: 'host',
        scenario: 'scenario1'
      };

      // Simulate receiving host ready message
      messageHandler({ data: JSON.stringify(hostReadyMessage) } as MessageEvent);

      // Verify extensive logging for host ready
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[ScenarioSelectScene][WebSocket] *** PLAYER_READY MESSAGE RECEIVED ***'
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[ScenarioSelectScene][WebSocket] ✅ HOST marked as ready'
      );

      // Verify internal state was updated
      expect((scene as any).hostReady).toBe(true);
      expect((scene as any).guestReady).toBe(false);
    });

    it('should trigger game start when both players are ready (host perspective)', () => {
      const startGameSpy = jest.spyOn(scene as any, 'startGame');

      // Mark guest as ready first
      const guestReadyMessage = {
        type: 'player_ready',
        player: 'guest'
      };
      messageHandler({ data: JSON.stringify(guestReadyMessage) } as MessageEvent);

      // Now mark host as ready
      const hostReadyMessage = {
        type: 'player_ready',
        player: 'host',
        scenario: 'scenario1'
      };
      messageHandler({ data: JSON.stringify(hostReadyMessage) } as MessageEvent);

      // Verify game start logic was triggered
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[ScenarioSelectScene][WebSocket] 🚀 BOTH PLAYERS READY - HOST STARTING GAME'
      );
      expect(startGameSpy).toHaveBeenCalled();
    });

    it('should not trigger game start if guest receives ready messages', () => {
      // Initialize as guest instead of host
      scene.init({
        mode: 'online',
        isHost: false,
        roomCode: 'TEST123',
        wsManager: mockWsManager,
        selected: { p1: 'bento', p2: 'davir' }
      });

      scene.create();
      const guestMessageHandler = mockWsManager.setMessageCallback.mock.calls[1][0];
      const startGameSpy = jest.spyOn(scene as any, 'startGame');

      // Mark both players as ready
      guestMessageHandler({ data: JSON.stringify({ type: 'player_ready', player: 'guest' }) } as MessageEvent);
      guestMessageHandler({ data: JSON.stringify({ type: 'player_ready', player: 'host' }) } as MessageEvent);

      // Verify guest doesn't start game
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[ScenarioSelectScene][WebSocket] ⏳ Both players ready but guest waiting for host to start'
      );
      expect(startGameSpy).not.toHaveBeenCalled();
    });
  });

  describe('Ready Button Message Sending', () => {
    it('should send guest ready message with comprehensive logging', () => {
      // Clear any previous calls
      consoleLogSpy.mockClear();
      mockWsManager.send.mockClear();

      // Initialize scene as guest
      scene.init({
        mode: 'online',
        isHost: false,
        roomCode: 'TEST123',
        wsManager: mockWsManager,
        selected: { p1: 'bento', p2: 'davir' }
      });

      scene.create();

      // Clear logs from initialization
      consoleLogSpy.mockClear();
      mockWsManager.send.mockClear();

      // Get the ready button and find the most recent pointerdown handler
      const readyButton = (scene as any).readyButton;
      const pointerdownCalls = readyButton.on.mock.calls.filter((call: any) => call[0] === 'pointerdown');
      expect(pointerdownCalls.length).toBeGreaterThan(0);
      const clickHandler = pointerdownCalls[pointerdownCalls.length - 1][1]; // Use last handler

      // Simulate button click
      clickHandler();

      // Verify comprehensive logging for message sending
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[ScenarioSelectScene][ReadyButton] *** SENDING PLAYER_READY MESSAGE ***'
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[ScenarioSelectScene][ReadyButton] Message:', 
        { type: 'player_ready', player: 'guest' }
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[ScenarioSelectScene][ReadyButton] Current player role:',
        {
          isHost: false,
          player: 'guest',
          roomCode: 'TEST123',
          wsManager: true,
          wsConnected: true
        }
      );

      // Verify message was sent
      expect(mockWsManager.send).toHaveBeenCalledWith({
        type: 'player_ready',
        player: 'guest'
      });

      // Verify send result was logged
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[ScenarioSelectScene][ReadyButton] Message send result:', true
      );
    });

    it('should send host ready message with scenario information', () => {
      // Clear any previous calls
      consoleLogSpy.mockClear();
      mockWsManager.send.mockClear();

      // Initialize as host
      scene.init({
        mode: 'online',
        isHost: true,
        roomCode: 'TEST123',
        wsManager: mockWsManager,
        selected: { p1: 'bento', p2: 'davir' }
      });

      scene.create();

      // Clear logs from initialization (which sends character selections)
      consoleLogSpy.mockClear();
      mockWsManager.send.mockClear();

      // Get the ready button and find the most recent pointerdown handler
      const readyButton = (scene as any).readyButton;
      const pointerdownCalls = readyButton.on.mock.calls.filter((call: any) => call[0] === 'pointerdown');
      expect(pointerdownCalls.length).toBeGreaterThan(0);
      const clickHandler = pointerdownCalls[pointerdownCalls.length - 1][1]; // Use last handler

      // Simulate button click
      clickHandler();

      // Verify host message includes scenario
      expect(mockWsManager.send).toHaveBeenCalledWith({
        type: 'player_ready',
        player: 'host',
        scenario: 'scenario1'
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[ScenarioSelectScene][ReadyButton] Message:', 
        { type: 'player_ready', player: 'host', scenario: 'scenario1' }
      );
    });
  });

  describe('Error Handling and Edge Cases', () => {
    let messageHandler: (event: MessageEvent) => void;

    beforeEach(() => {
      scene.init({
        mode: 'online',
        isHost: true,
        roomCode: 'TEST123',
        wsManager: mockWsManager,
        selected: { p1: 'bento', p2: 'davir' }
      });

      scene.create();
      messageHandler = mockWsManager.setMessageCallback.mock.calls[0][0];
    });

    it('should handle malformed JSON messages gracefully', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Send malformed JSON
      messageHandler({ data: 'invalid json {' } as MessageEvent);

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[ScenarioSelectScene][WebSocket] Error processing message:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle already parsed message data', () => {
      const readyMessage = { type: 'player_ready', player: 'guest' };

      // Send already parsed object instead of string
      messageHandler({ data: readyMessage } as MessageEvent);

      // Verify message was processed correctly
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[ScenarioSelectScene][WebSocket] ✅ GUEST marked as ready'
      );
      expect((scene as any).guestReady).toBe(true);
    });

    it('should handle duplicate ready messages without re-triggering game start', () => {
      const startGameSpy = jest.spyOn(scene as any, 'startGame');

      // Send guest ready message twice
      const guestReadyMessage = { type: 'player_ready', player: 'guest' };
      messageHandler({ data: JSON.stringify(guestReadyMessage) } as MessageEvent);
      messageHandler({ data: JSON.stringify(guestReadyMessage) } as MessageEvent);

      // Send host ready message
      const hostReadyMessage = { type: 'player_ready', player: 'host' };
      messageHandler({ data: JSON.stringify(hostReadyMessage) } as MessageEvent);

      // Verify game start was only called once
      expect(startGameSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle WebSocket manager without isConnected method', () => {
      // Create a fresh scene instance for this test
      const testScene = new ScenarioSelectScene();
      
      // Create manager without isConnected method
      const mockWsManagerNoIsConnected = {
        send: jest.fn().mockReturnValue(true),
        setMessageCallback: jest.fn()
        // No isConnected method
      };

      // Clear previous logs
      consoleLogSpy.mockClear();

      testScene.init({
        mode: 'online',
        isHost: false,
        roomCode: 'TEST123',
        wsManager: mockWsManagerNoIsConnected,
        selected: { p1: 'bento', p2: 'davir' }
      });

      testScene.create();

      // Clear logs from initialization
      consoleLogSpy.mockClear();

      // Get the ready button and simulate click
      const readyButton = (testScene as any).readyButton;
      const pointerdownCalls = readyButton.on.mock.calls.filter((call: any) => call[0] === 'pointerdown');
      expect(pointerdownCalls.length).toBeGreaterThan(0);
      const clickHandler = pointerdownCalls[pointerdownCalls.length - 1][1]; // Use last handler

      // Should not crash when isConnected is not available
      expect(() => clickHandler()).not.toThrow();

      // Verify connection status was logged as 'unknown'
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[ScenarioSelectScene][ReadyButton] Current player role:',
        expect.objectContaining({
          wsConnected: 'unknown'
        })
      );
    });
  });

  describe('Guest Ready Notification', () => {
    it('should show notification when host receives guest ready message', () => {
      // Initialize as host
      scene.init({
        mode: 'online',
        isHost: true,
        roomCode: 'TEST123',
        wsManager: mockWsManager,
        selected: { p1: 'bento', p2: 'davir' }
      });

      scene.create();

      // Mock waitingText for host notification
      const mockWaitingText = {
        setText: jest.fn(),
        setStyle: jest.fn()
      };
      (scene as any).waitingText = mockWaitingText;

      // Get message handler and send guest ready
      const messageHandler = mockWsManager.setMessageCallback.mock.calls[0][0];
      const guestReadyMessage = { type: 'player_ready', player: 'guest' };
      messageHandler({ data: JSON.stringify(guestReadyMessage) } as MessageEvent);

      // Verify notification was shown
      expect(mockWaitingText.setText).toHaveBeenCalledWith('Convidado está pronto!');
      expect(mockWaitingText.setStyle).toHaveBeenCalledWith({ color: '#00FF00' });
    });

    it('should not show notification when guest receives host ready message', () => {
      // Initialize as guest
      scene.init({
        mode: 'online',
        isHost: false,
        roomCode: 'TEST123',
        wsManager: mockWsManager,
        selected: { p1: 'bento', p2: 'davir' }
      });

      scene.create();

      // Mock waitingText
      const mockWaitingText = {
        setText: jest.fn(),
        setStyle: jest.fn()
      };
      (scene as any).waitingText = mockWaitingText;

      // Get message handler and send host ready
      const messageHandler = mockWsManager.setMessageCallback.mock.calls[0][0];
      const hostReadyMessage = { type: 'player_ready', player: 'host' };
      messageHandler({ data: JSON.stringify(hostReadyMessage) } as MessageEvent);

      // Verify notification was NOT shown (only for guest ready to host)
      expect(mockWaitingText.setText).not.toHaveBeenCalledWith('Convidado está pronto!');
    });
  });
});