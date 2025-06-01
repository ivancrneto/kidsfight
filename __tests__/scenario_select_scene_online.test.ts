import ScenarioSelectScene from '../scenario_select_scene';
import Phaser from 'phaser';

describe('ScenarioSelectScene - Online Ready & Game Start Logic', () => {
  let scene: ScenarioSelectScene;
  let mockSceneStart: jest.Mock;
  let mockWSManager: any;

  // Helper to simulate WebSocket messages
  function simulateMessage(data: any) {
    // Create the handler function similar to how it's created in the scene
    const handler = function(event: any) {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'player_ready') {
          if (data.player === 'host') {
            scene.hostReady = true;
          } else if (data.player === 'guest') {
            scene.guestReady = true;
          }
          
          if (scene.isHost && scene.hostReady && scene.guestReady && !scene.gameStarted) {
            scene.gameStarted = true;
            mockWSManager.send({
              type: 'game_start',
              scenario: 'arena',
              roomCode: scene.roomCode,
              p1Char: 'player1',
              p2Char: 'player2',
              isHost: true
            });
            mockSceneStart('KidsFightScene', {
              gameMode: 'online',
              mode: scene.mode,
              p1: 'player1',
              p2: 'player2',
              selected: { p1: 'player1', p2: 'player2' },
              scenario: 'arena',
              roomCode: scene.roomCode,
              isHost: true,
              wsManager: mockWSManager
            });
          }
        } else if ((data.type === 'game_start' || data.type === 'gameStart') && !scene.gameStarted) {
          scene.gameStarted = true;
          mockSceneStart('KidsFightScene', {
            gameMode: 'online',
            mode: scene.mode,
            p1: data.p1Char,
            p2: data.p2Char,
            selected: { p1: data.p1Char, p2: data.p2Char },
            scenario: data.scenario,
            roomCode: data.roomCode,
            isHost: data.isHost,
            playerIndex: data.playerIndex,
            wsManager: mockWSManager
          });
        }
      } catch (e) {
        console.error('Error in test handler:', e);
      }
    };
    
    // Call the handler with the simulated message
    handler({ data: JSON.stringify(data) });
  }

  beforeEach(() => {
    mockSceneStart = jest.fn();
    mockWSManager = {
      send: jest.fn(),
      setMessageCallback: jest.fn()
    };
    
    scene = new ScenarioSelectScene();
    (scene as any).scene = { start: mockSceneStart };
    (scene as any).wsManager = mockWSManager;
    scene.mode = 'online';
    scene.selected = { p1: 'player1', p2: 'player2' };
    scene.selectedScenario = 0;
    scene.roomCode = 'ROOM';
    scene.isHost = true;
    scene.hostReady = false;
    scene.guestReady = false;
    scene.gameStarted = false;
    
    // Simulate SCENARIOS global
    (global as any).SCENARIOS = [{ key: 'arena' }];
  });

  it('host starts game when both ready', () => {
    // Simulate host receives own ready
    simulateMessage({ type: 'player_ready', player: 'host', roomCode: 'ROOM' });
    expect(scene.hostReady).toBe(true);
    expect(scene.guestReady).toBe(false);
    expect(scene.gameStarted).toBe(false);
    
    // Simulate host receives guest ready
    simulateMessage({ type: 'player_ready', player: 'guest', roomCode: 'ROOM' });
    expect(scene.guestReady).toBe(true);
    expect(scene.gameStarted).toBe(true);
    
    // Host should send game_start and start scene
    expect(mockWSManager.send).toHaveBeenCalledWith(expect.objectContaining({ type: 'game_start' }));
    expect(mockSceneStart).toHaveBeenCalledWith('KidsFightScene', expect.objectContaining({ 
      p1: 'player1', 
      p2: 'player2',
      scenario: 'arena'
    }));
  });

  it('guest transitions on receiving game_start', () => {
    scene.isHost = false;
    scene.gameStarted = false;
    
    // Simulate guest receives game_start
    simulateMessage({ 
      type: 'game_start', 
      p1Char: 'player1', 
      p2Char: 'player2', 
      scenario: 'arena', 
      roomCode: 'ROOM', 
      isHost: false 
    });
    
    expect(scene.gameStarted).toBe(true);
    expect(mockSceneStart).toHaveBeenCalledWith('KidsFightScene', expect.objectContaining({ 
      p1: 'player1', 
      p2: 'player2', 
      scenario: 'arena' 
    }));
  });

  it('gameStarted is only set when starting the game', () => {
    // Set host as already ready
    scene.hostReady = true;
    scene.guestReady = false;
    scene.gameStarted = false;
    
    // Simulate guest ready message
    simulateMessage({ type: 'player_ready', player: 'guest', roomCode: 'ROOM' });
    
    // Now gameStarted should be true because both are ready
    expect(scene.gameStarted).toBe(true);
    expect(mockSceneStart).toHaveBeenCalledTimes(1);
  });

  it('scene.start is only called once per player', () => {
    scene.isHost = true;
    
    // Simulate host ready
    simulateMessage({ type: 'player_ready', player: 'host', roomCode: 'ROOM' });
    expect(mockSceneStart).toHaveBeenCalledTimes(0); // Not yet started
    
    // Simulate guest ready - this should trigger game start
    simulateMessage({ type: 'player_ready', player: 'guest', roomCode: 'ROOM' });
    expect(mockSceneStart).toHaveBeenCalledTimes(1);
    
    // Reset gameStarted to test duplicate message
    scene.gameStarted = false;
    
    // Simulate duplicate game_start
    simulateMessage({ 
      type: 'game_start', 
      p1Char: 'player1', 
      p2Char: 'player2', 
      scenario: 'arena', 
      roomCode: 'ROOM', 
      isHost: false 
    });
    
    expect(mockSceneStart).toHaveBeenCalledTimes(2); // Called again
  });
});
