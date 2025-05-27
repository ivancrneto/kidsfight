import PlayerSelectScene from '../player_select_scene';
import { WebSocketManager } from '../websocket_manager';

// Mock WebSocketManager
const mockWebSocketManager = () => ({
  send: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  isConnected: jest.fn().mockReturnValue(true),
  isHost: false,
  getRoomCode: jest.fn().mockReturnValue('TEST123'),
  setRoomCode: jest.fn(),
  setHost: jest.fn()
});

function createScene({ isHost = false, mode = 'online' } = {}) {
  const wsManager = mockWebSocketManager();
  wsManager.isHost = isHost;
  const scene = new PlayerSelectScene(wsManager);
  scene.mode = mode;
  scene.isHost = isHost;
  scene.wsManager = wsManager;
  scene.CHARACTER_KEYS = ['bento', 'davir', 'jose', 'davis', 'carol', 'roni', 'jacqueline', 'ivan', 'd_isa'];
  scene.characters = scene.CHARACTER_KEYS.map(key => ({ key }));
  scene.selected = { p1: 'bento', p2: 'davir' };
  scene.selectedP1Index = 0;
  scene.selectedP2Index = 1;
  scene.p1Index = 0;
  scene.p2Index = 1;
  scene.updateSelectionIndicators = jest.fn();
  scene.updateReadyUI = jest.fn();
  return { scene, wsManager };
}

describe('PlayerSelectScene Online Sync', () => {
  it('host can only select for player 1', () => {
    const { scene, wsManager } = createScene({ isHost: true });
    scene.setSelectorToCharacter(1, 2); // host selects for p1
    expect(scene.selected.p1).toBe('jose');
    expect(wsManager.send).toHaveBeenCalledWith(expect.objectContaining({
      type: 'player_selected', player: 'p1', character: 'jose'
    }));
    scene.setSelectorToCharacter(2, 3); // host tries to select for p2
    expect(scene.selected.p2).not.toBe('davis'); // should NOT update
  });

  it('guest can only select for player 2', () => {
    const { scene, wsManager } = createScene({ isHost: false });
    scene.setSelectorToCharacter(2, 3); // guest selects for p2
    expect(scene.selected.p2).toBe('davis');
    expect(wsManager.send).toHaveBeenCalledWith(expect.objectContaining({
      type: 'player_selected', player: 'p2', character: 'davis'
    }));
    scene.setSelectorToCharacter(1, 4); // guest tries to select for p1
    expect(scene.selected.p1).not.toBe('carol'); // should NOT update
  });

  it('receives player_selected for p1 and updates only player 1', () => {
    const { scene } = createScene({ isHost: false });
    scene.handlePlayerSelected({ type: 'player_selected', player: 'p1', character: 'jacqueline' });
    expect(scene.selected.p1).toBe('jacqueline');
    expect(scene.selectedP1Index).toBe(6);
    expect(scene.p1Index).toBe(6);
  });

  it('receives player_selected for p2 and updates only player 2', () => {
    const { scene } = createScene({ isHost: true });
    scene.handlePlayerSelected({ type: 'player_selected', player: 'p2', character: 'ivan' });
    expect(scene.selected.p2).toBe('ivan');
    expect(scene.selectedP2Index).toBe(7);
    expect(scene.p2Index).toBe(7);
  });

  it('does not update indices if character key is not found', () => {
    const { scene } = createScene({ isHost: true });
    scene.handlePlayerSelected({ type: 'player_selected', player: 'p1', character: 'not_a_real_key' });
    expect(scene.selectedP1Index).toBe(-1);
    expect(scene.p1Index).toBe(-1);
  });

  it('updates selection indicators after sync', () => {
    const { scene } = createScene({ isHost: true });
    scene.updateSelectionIndicators = jest.fn();
    scene.handlePlayerSelected({ type: 'player_selected', player: 'p2', character: 'd_isa' });
    expect(scene.updateSelectionIndicators).toHaveBeenCalled();
  });
});
