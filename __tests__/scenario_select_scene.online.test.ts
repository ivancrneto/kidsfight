import ScenarioSelectScene from '../scenario_select_scene';

describe('ScenarioSelectScene - Online Mode Transitions', () => {
  let scene: any;

  beforeEach(() => {
    scene = new ScenarioSelectScene();
    scene.mode = 'online';
    scene.selected = { p1: 'player1', p2: 'player2' };
    scene.selectedScenario = 0;
    scene.roomCode = 'ROOM42';
    scene.isHost = true;
    scene.scene = { start: jest.fn() };
    scene.wsManager = { setMessageCallback: jest.fn() };
    // Mock minimal add and sys objects to avoid undefined errors
    scene.add = { text: jest.fn(), circle: jest.fn(), rectangle: jest.fn(), image: jest.fn(), graphics: jest.fn() };
    scene.sys = { events: { on: jest.fn() }, game: { device: { input: { touch: false } } } };
  });

  it('should pass gameMode: online when host transitions to KidsFightScene', () => {
    // Simulate host transition
    scene.scene.start('KidsFightScene', {
      gameMode: 'online',
      mode: scene.mode,
      selected: scene.selected,
      scenario: 'scenario1',
      roomCode: scene.roomCode,
      isHost: scene.isHost
    });
    expect(scene.scene.start).toHaveBeenCalledWith('KidsFightScene', expect.objectContaining({ gameMode: 'online' }));
  });

  it('should pass gameMode: online when guest receives scenario_selected', () => {
    // Simulate guest receiving scenario_selected
    scene.scene.start('KidsFightScene', {
      gameMode: 'online',
      mode: scene.mode,
      selected: scene.selected,
      scenario: 'scenario1',
      roomCode: scene.roomCode,
      isHost: scene.isHost
    });
    expect(scene.scene.start).toHaveBeenCalledWith('KidsFightScene', expect.objectContaining({ gameMode: 'online' }));
  });
});
