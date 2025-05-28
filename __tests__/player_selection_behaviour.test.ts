import PlayerSelectScene from '../player_select_scene';
import { WebSocketManager } from '../websocket_manager';

// Helper to patch characterSprites with jest.fn() for 'on' in tests
function patchCharacterSpriteOn(scene: any, key: string) {
  if (scene.characterSprites && scene.characterSprites[key]) {
    scene.characterSprites[key].on = jest.fn();
  }
}

// Mock WebSocketManager
const mockWebSocketManager = {
  send: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  isConnected: jest.fn().mockReturnValue(true),
  isHost: jest.fn().mockReturnValue(false),
  getRoomCode: jest.fn().mockReturnValue('TEST123'),
  setRoomCode: jest.fn(),
  setHost: jest.fn(),
  setMessageCallback: jest.fn()
};

// Mock Phaser components
const mockScene = {
  add: {
    text: jest.fn().mockReturnValue({
      setOrigin: jest.fn().mockReturnThis(),
      setScrollFactor: jest.fn().mockReturnThis(),
      setDepth: jest.fn().mockReturnThis(),
      setVisible: jest.fn().mockReturnThis(),
      setText: jest.fn().mockReturnThis(),
      setInteractive: jest.fn().mockReturnThis(),
      setFlipX: jest.fn().mockReturnThis(),
      setScale: jest.fn().mockReturnThis(),
      setCrop: jest.fn().mockReturnThis(),
      setPosition: jest.fn().mockReturnThis(),
      on: jest.fn().mockReturnThis(),
      body: { blocked: { down: true } },
      destroy: jest.fn()
    }),
    circle: jest.fn().mockReturnValue({
      setOrigin: jest.fn(),
      setStrokeStyle: jest.fn(),
      setInteractive: jest.fn(),
      setScale: jest.fn(),
      setTint: jest.fn(),
      setAlpha: jest.fn(),
      setPosition: jest.fn(),
      on: jest.fn(),
      setVisible: jest.fn()
    }),
    rectangle: jest.fn().mockReturnValue({
      setOrigin: jest.fn(),
      setDisplaySize: jest.fn(),
      setDepth: jest.fn(),
      setScrollFactor: jest.fn(),
      setStrokeStyle: jest.fn(),
      setInteractive: jest.fn(),
      on: jest.fn()
    }),
    sprite: jest.fn().mockReturnValue({
      setOrigin: jest.fn().mockReturnThis(),
      setScale: jest.fn().mockReturnThis(),
      setCrop: jest.fn().mockReturnThis(),
      setInteractive: jest.fn().mockReturnThis(),
      setFlipX: jest.fn().mockReturnThis(),
      on: jest.fn()
    })
  },
  scale: {
    on: jest.fn(),
    width: 800,
    height: 600
  },
  cameras: {
    main: {
      width: 800,
      height: 600
    }
  },
  sys: {
    game: {
      config: {
        width: 800,
        height: 600
      }
    }
  },
  physics: {
    pause: jest.fn()
  }
};

describe('Player Selection Behaviour', () => {
  let scene: PlayerSelectScene;

  beforeEach(() => {
    // Create a fresh instance for each test
    scene = new PlayerSelectScene(mockWebSocketManager as unknown as WebSocketManager);
    Object.assign(scene, mockScene);
  });

  describe('Character Selection', () => {
    it('should allow player 1 to select a character in local mode', () => {
      scene.init({ mode: 'local' });
      scene.create();
      scene.CHARACTER_KEYS = [
        'bento', 'davir', 'jose', 'davis',
        'carol', 'roni', 'jacqueline', 'ivan', 'd_isa'
      ];
      scene.characters = [
        { key: 'bento', name: 'Bento', x: 0, y: 0, scale: 1 },
        { key: 'davir', name: 'Davi R', x: 120, y: 208, scale: 1 },
        { key: 'jose', name: 'José', x: 240, y: 0, scale: 1 },
        { key: 'davis', name: 'Davi S', x: 0, y: 120, scale: 1 },
        { key: 'carol', name: 'Carol', x: 120, y: 120, scale: 1 },
        { key: 'roni', name: 'Roni', x: 240, y: 120, scale: 1 },
        { key: 'jacqueline', name: 'Jacqueline', x: 0, y: 240, scale: 1 },
        { key: 'ivan', name: 'Ivan', x: 120, y: 240, scale: 1 },
        { key: 'd_isa', name: 'D Isa', x: 240, y: 240, scale: 1 }
      ];
      scene.characterSprites = {};
      for (const char of scene.characters) {
        scene.characterSprites[char.key] = { on: jest.fn() };
      }
      for (const char of scene.characters) {
        patchCharacterSpriteOn(scene, char.key);
      }
      console.log('DEBUG p1Index:', scene.p1Index);
      console.log('DEBUG characters.length:', scene.characters.length);
      console.log('DEBUG character keys:', scene.characters.map(c => c.key));
      if (
        scene.CHARACTER_KEYS.length !== scene.characters.length
      ) {
        throw new Error(`DEBUG: CHARACTER_KEYS.length=${scene.CHARACTER_KEYS.length}, characters.length=${scene.characters.length}, CHARACTER_KEYS=${scene.CHARACTER_KEYS}, characters.keys=${scene.characters.map(c => c.key)}`);
      }
      if (
        scene.characters.length !== 9 ||
        !scene.characters[0] ||
        scene.characters[0].key !== 'bento'
      ) {
        throw new Error(`DEBUG: p1Index=${scene.p1Index}, characters.length=${scene.characters.length}, keys=${scene.characters.map(c => c.key)}`);
      }
      scene.p1Index = scene.characters.length - 1;
      scene.selected = { p1: '', p2: '' };
      console.log('DEBUG p1Index before handleCharacterSelect:', scene.p1Index);
      // Extra debug for test failure
      console.log('DEBUG (pre) mode:', scene.mode, 'isHost:', scene.isHost, 'characters:', scene.characters.map(c => c.key), 'p1Index:', scene.p1Index, 'selected:', scene.selected);
      scene.handleCharacterSelect(1, 1);
      console.log('DEBUG (post) selected.p1:', scene.selected.p1, 'p1Index:', scene.p1Index);
      expect(scene.selected.p1).toBe('bento');
      expect(scene.p1Index).toBe(0);
    });

    it('should alternate between players in local mode', () => {
      scene.init({ mode: 'local' });
      scene.create();
      scene.CHARACTER_KEYS = [
        'bento', 'davir', 'jose', 'davis',
        'carol', 'roni', 'jacqueline', 'ivan', 'd_isa'
      ];
      scene.characters = [
        { key: 'bento', name: 'Bento', x: 0, y: 0, scale: 1 },
        { key: 'davir', name: 'Davi R', x: 120, y: 208, scale: 1 },
        { key: 'jose', name: 'José', x: 240, y: 0, scale: 1 },
        { key: 'davis', name: 'Davi S', x: 0, y: 120, scale: 1 },
        { key: 'carol', name: 'Carol', x: 120, y: 120, scale: 1 },
        { key: 'roni', name: 'Roni', x: 240, y: 120, scale: 1 },
        { key: 'jacqueline', name: 'Jacqueline', x: 0, y: 240, scale: 1 },
        { key: 'ivan', name: 'Ivan', x: 120, y: 240, scale: 1 },
        { key: 'd_isa', name: 'D Isa', x: 240, y: 240, scale: 1 }
      ];
      scene.characterSprites = {};
      for (const char of scene.characters) {
        scene.characterSprites[char.key] = { on: jest.fn() };
      }
      for (const char of scene.characters) {
        patchCharacterSpriteOn(scene, char.key);
      }
      console.log('DEBUG p1Index:', scene.p1Index);
      console.log('DEBUG characters.length:', scene.characters.length);
      console.log('DEBUG character keys:', scene.characters.map(c => c.key));
      if (
        scene.CHARACTER_KEYS.length !== scene.characters.length
      ) {
        throw new Error(`DEBUG: CHARACTER_KEYS.length=${scene.CHARACTER_KEYS.length}, characters.length=${scene.characters.length}, CHARACTER_KEYS=${scene.CHARACTER_KEYS}, characters.keys=${scene.characters.map(c => c.key)}`);
      }
      if (
        scene.characters.length !== 9 ||
        !scene.characters[0] ||
        scene.characters[0].key !== 'bento'
      ) {
        throw new Error(`DEBUG: p1Index=${scene.p1Index}, characters.length=${scene.characters.length}, keys=${scene.characters.map(c => c.key)}`);
      }
      scene.p1Index = scene.characters.length - 1;
      scene.selected = { p1: '', p2: '' };
      console.log('DEBUG p1Index before handleCharacterSelect:', scene.p1Index);
      scene.handleCharacterSelect(1, 1);
      expect(scene.selected.p1).toBe('bento');
      scene.p2Index = scene.characters.length - 1;
      scene.selected.p2 = '';
      console.log('DEBUG p2Index before handleCharacterSelect:', scene.p2Index);
      scene.handleCharacterSelect(2, 1);
      expect(scene.selected.p2).toBe('bento');
    });

    it('should only allow player 1 to select in online mode', () => {
      scene.init({ mode: 'online' });
      scene.create();
      scene.CHARACTER_KEYS = [
        'bento', 'davir', 'jose', 'davis',
        'carol', 'roni', 'jacqueline', 'ivan', 'd_isa'
      ];
      scene.characters = [
        { key: 'bento', name: 'Bento', x: 0, y: 0, scale: 1 },
        { key: 'davir', name: 'Davi R', x: 120, y: 208, scale: 1 },
        { key: 'jose', name: 'José', x: 240, y: 0, scale: 1 },
        { key: 'davis', name: 'Davi S', x: 0, y: 120, scale: 1 },
        { key: 'carol', name: 'Carol', x: 120, y: 120, scale: 1 },
        { key: 'roni', name: 'Roni', x: 240, y: 120, scale: 1 },
        { key: 'jacqueline', name: 'Jacqueline', x: 0, y: 240, scale: 1 },
        { key: 'ivan', name: 'Ivan', x: 120, y: 240, scale: 1 },
        { key: 'd_isa', name: 'D Isa', x: 240, y: 240, scale: 1 }
      ];
      scene.characterSprites = {};
      for (const char of scene.characters) {
        scene.characterSprites[char.key] = { on: jest.fn() };
      }
      for (const char of scene.characters) {
        patchCharacterSpriteOn(scene, char.key);
      }
      console.log('DEBUG p1Index:', scene.p1Index);
      console.log('DEBUG characters.length:', scene.characters.length);
      console.log('DEBUG character keys:', scene.characters.map(c => c.key));
      if (
        scene.CHARACTER_KEYS.length !== scene.characters.length
      ) {
        throw new Error(`DEBUG: CHARACTER_KEYS.length=${scene.CHARACTER_KEYS.length}, characters.length=${scene.characters.length}, CHARACTER_KEYS=${scene.CHARACTER_KEYS}, characters.keys=${scene.characters.map(c => c.key)}`);
      }
      if (
        scene.characters.length !== 9 ||
        !scene.characters[0] ||
        scene.characters[0].key !== 'bento'
      ) {
        throw new Error(`DEBUG: p1Index=${scene.p1Index}, characters.length=${scene.characters.length}, keys=${scene.characters.map(c => c.key)}`);
      }
      scene.p1Index = scene.characters.length - 1;
      scene.selected = { p1: '', p2: '' };
      console.log('DEBUG p1Index before handleCharacterSelect:', scene.p1Index);
      scene.isHost = true;
      scene.handleCharacterSelect(1, 1);
      expect(scene.selected.p1).toBe('bento');
    });

    it('should send player selection to WebSocket in online mode', () => {
      const wsScene = new PlayerSelectScene(mockWebSocketManager as any);
      Object.assign(wsScene, mockScene);
      wsScene.init({ mode: 'online' });
      wsScene.create();
      wsScene.CHARACTER_KEYS = [
        'bento', 'davir', 'jose', 'davis',
        'carol', 'roni', 'jacqueline', 'ivan', 'd_isa'
      ];
      wsScene.characters = [
        { key: 'bento', name: 'Bento', x: 0, y: 0, scale: 1 },
        { key: 'davir', name: 'Davi R', x: 120, y: 208, scale: 1 },
        { key: 'jose', name: 'José', x: 240, y: 0, scale: 1 },
        { key: 'davis', name: 'Davi S', x: 0, y: 120, scale: 1 },
        { key: 'carol', name: 'Carol', x: 120, y: 120, scale: 1 },
        { key: 'roni', name: 'Roni', x: 240, y: 120, scale: 1 },
        { key: 'jacqueline', name: 'Jacqueline', x: 0, y: 240, scale: 1 },
        { key: 'ivan', name: 'Ivan', x: 120, y: 240, scale: 1 },
        { key: 'd_isa', name: 'D Isa', x: 240, y: 240, scale: 1 }
      ];
      wsScene.characterSprites = {};
      for (const char of wsScene.characters) {
        wsScene.characterSprites[char.key] = { on: jest.fn() };
      }
      for (const char of wsScene.characters) {
        patchCharacterSpriteOn(wsScene, char.key);
      }
      wsScene.wsManager = mockWebSocketManager;
      wsScene.webSocketManager = mockWebSocketManager;
      wsScene.isHost = true;
      console.log('DEBUG wsScene.p1Index:', wsScene.p1Index);
      console.log('DEBUG wsScene.characters.length:', wsScene.characters.length);
      console.log('DEBUG wsScene.character keys:', wsScene.characters.map(c => c.key));
      if (
        wsScene.CHARACTER_KEYS.length !== wsScene.characters.length
      ) {
        throw new Error(`DEBUG: CHARACTER_KEYS.length=${wsScene.CHARACTER_KEYS.length}, characters.length=${wsScene.characters.length}, CHARACTER_KEYS=${wsScene.CHARACTER_KEYS}, characters.keys=${wsScene.characters.map(c => c.key)}`);
      }
      if (
        wsScene.characters.length !== 9 ||
        !wsScene.characters[0] ||
        wsScene.characters[0].key !== 'bento'
      ) {
        throw new Error(`DEBUG: p1Index=${wsScene.p1Index}, characters.length=${wsScene.characters.length}, keys=${wsScene.characters.map(c => c.key)}`);
      }
      wsScene.p1Index = wsScene.characters.length - 1;
      wsScene.selected = { p1: '', p2: '' };
      console.log('DEBUG wsScene.p1Index before handleCharacterSelect:', wsScene.p1Index);
      wsScene.handleCharacterSelect(1, 1);
      expect(mockWebSocketManager.send).toHaveBeenCalledWith({
        type: 'player_selected',
        player: 'p1',
        character: 'bento'
      });
    });

    it('should update selection indicators when characters are selected', () => {
      scene.init({ mode: 'local' });
      scene.create();
      scene.CHARACTER_KEYS = [
        'bento', 'davir', 'jose', 'davis',
        'carol', 'roni', 'jacqueline', 'ivan', 'd_isa'
      ];
      scene.characters = [
        { key: 'bento', name: 'Bento', x: 0, y: 0, scale: 1 },
        { key: 'davir', name: 'Davi R', x: 120, y: 208, scale: 1 },
        { key: 'jose', name: 'José', x: 240, y: 0, scale: 1 },
        { key: 'davis', name: 'Davi S', x: 0, y: 120, scale: 1 },
        { key: 'carol', name: 'Carol', x: 120, y: 120, scale: 1 },
        { key: 'roni', name: 'Roni', x: 240, y: 120, scale: 1 },
        { key: 'jacqueline', name: 'Jacqueline', x: 0, y: 240, scale: 1 },
        { key: 'ivan', name: 'Ivan', x: 120, y: 240, scale: 1 },
        { key: 'd_isa', name: 'D Isa', x: 240, y: 240, scale: 1 }
      ];
      scene.characterSprites = {};
      for (const char of scene.characters) {
        scene.characterSprites[char.key] = { on: jest.fn() };
      }
      for (const char of scene.characters) {
        patchCharacterSpriteOn(scene, char.key);
      }
      console.log('DEBUG p1Index:', scene.p1Index);
      console.log('DEBUG p2Index:', scene.p2Index);
      console.log('DEBUG characters.length:', scene.characters.length);
      console.log('DEBUG character keys:', scene.characters.map(c => c.key));
      if (
        scene.CHARACTER_KEYS.length !== scene.characters.length
      ) {
        throw new Error(`DEBUG: CHARACTER_KEYS.length=${scene.CHARACTER_KEYS.length}, characters.length=${scene.characters.length}, CHARACTER_KEYS=${scene.CHARACTER_KEYS}, characters.keys=${scene.characters.map(c => c.key)}`);
      }
      if (
        scene.characters.length !== 9 ||
        !scene.characters[0] ||
        scene.characters[0].key !== 'bento'
      ) {
        throw new Error(`DEBUG: p1Index=${scene.p1Index}, p2Index=${scene.p2Index}, characters.length=${scene.characters.length}, keys=${scene.characters.map(c => c.key)}`);
      }
      scene.p1Index = scene.characters.length - 1;
      scene.p2Index = 1;
      scene.selected = { p1: '', p2: '' };
      scene.p1SelectorCircle = { setPosition: jest.fn(), setVisible: jest.fn() } as any;
      scene.p2SelectorCircle = { setPosition: jest.fn(), setVisible: jest.fn() } as any;
      const updateSpy = jest.spyOn(PlayerSelectScene.prototype, 'updateSelectionIndicators');
      console.log('DEBUG p1Index before handleCharacterSelect:', scene.p1Index);
      scene.handleCharacterSelect(1, 1);
      console.log('DEBUG selected.p1 after handleCharacterSelect:', scene.selected.p1);
      expect(updateSpy).toHaveBeenCalled();
      expect(scene.p1SelectorCircle.setPosition).toHaveBeenCalledWith(
        scene.characters[0].x,
        expect.any(Number)
      );
    });
  });

  describe('WebSocket Integration', () => {
    it('should send player selection to WebSocket in online mode', () => {
      const wsScene = new PlayerSelectScene(mockWebSocketManager as any);
      Object.assign(wsScene, mockScene);
      wsScene.init({ mode: 'online' });
      wsScene.create();
      wsScene.CHARACTER_KEYS = [
        'bento', 'davir', 'jose', 'davis',
        'carol', 'roni', 'jacqueline', 'ivan', 'd_isa'
      ];
      wsScene.characters = [
        { key: 'bento', name: 'Bento', x: 0, y: 0, scale: 1 },
        { key: 'davir', name: 'Davi R', x: 120, y: 208, scale: 1 },
        { key: 'jose', name: 'José', x: 240, y: 0, scale: 1 },
        { key: 'davis', name: 'Davi S', x: 0, y: 120, scale: 1 },
        { key: 'carol', name: 'Carol', x: 120, y: 120, scale: 1 },
        { key: 'roni', name: 'Roni', x: 240, y: 120, scale: 1 },
        { key: 'jacqueline', name: 'Jacqueline', x: 0, y: 240, scale: 1 },
        { key: 'ivan', name: 'Ivan', x: 120, y: 240, scale: 1 },
        { key: 'd_isa', name: 'D Isa', x: 240, y: 240, scale: 1 }
      ];
      wsScene.characterSprites = {};
      for (const char of wsScene.characters) {
        wsScene.characterSprites[char.key] = { on: jest.fn() };
      }
      for (const char of wsScene.characters) {
        patchCharacterSpriteOn(wsScene, char.key);
      }
      wsScene.wsManager = mockWebSocketManager;
      wsScene.webSocketManager = mockWebSocketManager;
      wsScene.isHost = true;
      console.log('DEBUG wsScene.p1Index:', wsScene.p1Index);
      console.log('DEBUG wsScene.characters.length:', wsScene.characters.length);
      console.log('DEBUG wsScene.character keys:', wsScene.characters.map(c => c.key));
      if (
        wsScene.CHARACTER_KEYS.length !== wsScene.characters.length
      ) {
        throw new Error(`DEBUG: CHARACTER_KEYS.length=${wsScene.CHARACTER_KEYS.length}, characters.length=${wsScene.characters.length}, CHARACTER_KEYS=${wsScene.CHARACTER_KEYS}, characters.keys=${wsScene.characters.map(c => c.key)}`);
      }
      if (
        wsScene.characters.length !== 9 ||
        !wsScene.characters[0] ||
        wsScene.characters[0].key !== 'bento'
      ) {
        throw new Error(`DEBUG: p1Index=${wsScene.p1Index}, characters.length=${wsScene.characters.length}, keys=${wsScene.characters.map(c => c.key)}`);
      }
      wsScene.p1Index = wsScene.characters.length - 1;
      wsScene.selected = { p1: '', p2: '' };
      console.log('DEBUG wsScene.p1Index before handleCharacterSelect:', wsScene.p1Index);
      wsScene.handleCharacterSelect(1, 1);
      expect(mockWebSocketManager.send).toHaveBeenCalledWith({
        type: 'player_selected',
        player: 'p1',
        character: 'bento'
      });
    });
  });

  describe('Selection Indicators', () => {
    it('should update selection indicators when characters are selected', () => {
      scene.init({ mode: 'local' });
      scene.create();
      scene.CHARACTER_KEYS = [
        'bento', 'davir', 'jose', 'davis',
        'carol', 'roni', 'jacqueline', 'ivan', 'd_isa'
      ];
      scene.characters = [
        { key: 'bento', name: 'Bento', x: 0, y: 0, scale: 1 },
        { key: 'davir', name: 'Davi R', x: 120, y: 208, scale: 1 },
        { key: 'jose', name: 'José', x: 240, y: 0, scale: 1 },
        { key: 'davis', name: 'Davi S', x: 0, y: 120, scale: 1 },
        { key: 'carol', name: 'Carol', x: 120, y: 120, scale: 1 },
        { key: 'roni', name: 'Roni', x: 240, y: 120, scale: 1 },
        { key: 'jacqueline', name: 'Jacqueline', x: 0, y: 240, scale: 1 },
        { key: 'ivan', name: 'Ivan', x: 120, y: 240, scale: 1 },
        { key: 'd_isa', name: 'D Isa', x: 240, y: 240, scale: 1 }
      ];
      scene.characterSprites = {};
      for (const char of scene.characters) {
        scene.characterSprites[char.key] = { on: jest.fn() };
      }
      for (const char of scene.characters) {
        patchCharacterSpriteOn(scene, char.key);
      }
      console.log('DEBUG p1Index:', scene.p1Index);
      console.log('DEBUG p2Index:', scene.p2Index);
      console.log('DEBUG characters.length:', scene.characters.length);
      console.log('DEBUG character keys:', scene.characters.map(c => c.key));
      if (
        scene.CHARACTER_KEYS.length !== scene.characters.length
      ) {
        throw new Error(`DEBUG: CHARACTER_KEYS.length=${scene.CHARACTER_KEYS.length}, characters.length=${scene.characters.length}, CHARACTER_KEYS=${scene.CHARACTER_KEYS}, characters.keys=${scene.characters.map(c => c.key)}`);
      }
      if (
        scene.characters.length !== 9 ||
        !scene.characters[0] ||
        scene.characters[0].key !== 'bento'
      ) {
        throw new Error(`DEBUG: p1Index=${scene.p1Index}, p2Index=${scene.p2Index}, characters.length=${scene.characters.length}, keys=${scene.characters.map(c => c.key)}`);
      }
      scene.p1Index = scene.characters.length - 1;
      scene.p2Index = 1;
      scene.selected = { p1: '', p2: '' };
      scene.p1SelectorCircle = { setPosition: jest.fn(), setVisible: jest.fn() } as any;
      scene.p2SelectorCircle = { setPosition: jest.fn(), setVisible: jest.fn() } as any;
      const updateSpy = jest.spyOn(PlayerSelectScene.prototype, 'updateSelectionIndicators');
      console.log('DEBUG p1Index before handleCharacterSelect:', scene.p1Index);
      scene.handleCharacterSelect(1, 1);
      console.log('DEBUG selected.p1 after handleCharacterSelect:', scene.selected.p1);
      expect(updateSpy).toHaveBeenCalled();
      expect(scene.p1SelectorCircle.setPosition).toHaveBeenCalledWith(
        scene.characters[0].x,
        expect.any(Number)
      );
    });
  });
});
