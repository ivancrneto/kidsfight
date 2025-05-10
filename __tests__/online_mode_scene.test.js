jest.mock('../websocket_manager', () => ({
  __esModule: true,
  default: {
    isHost: false,
    ws: null,
    connect: jest.fn().mockImplementation(function() {
      if (!this.ws) {
        this.ws = {
          send: jest.fn(),
          onopen: null,
          onmessage: null,
          onerror: null,
          onclose: null,
          close: jest.fn()
        };
      }
      return this.ws;
    }),
    setHost: jest.fn().mockImplementation(function(isHost) {
      this.isHost = isHost;
    }),
    send: jest.fn(),
    close: jest.fn().mockImplementation(function() {
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
    })
  }
}));

import OnlineModeScene from '../online_mode_scene';
// Mock wsManager
const mockWsManager = {
  isHost: false,
  ws: null,
  connect: jest.fn().mockImplementation(function() {
    if (!this.ws) {
      this.ws = {
        send: jest.fn(),
        onopen: null,
        onmessage: jest.fn(),
        onerror: null,
        onclose: null,
        close: jest.fn()
      };
    }
    return this.ws;
  }),
  setHost: jest.fn().mockImplementation(function(isHost) {
    this.isHost = isHost;
  }),
  send: jest.fn(),
  close: jest.fn().mockImplementation(function() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  })
};

jest.mock('../websocket_manager', () => ({
  __esModule: true,
  default: {
    ...mockWsManager,
    send: jest.fn()
  }
}));

import wsManager from '../websocket_manager';

beforeEach(() => {
  wsManager.send = jest.fn((msg) => {
    if (wsManager.ws && typeof wsManager.ws.send === 'function') {
      wsManager.ws.send(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  });
});

// Mock WebSocket
global.WebSocket = jest.fn().mockImplementation(() => ({
  send: jest.fn(),
  close: jest.fn()
}));

// Mock Phaser
const mockScene = {
  start: jest.fn(),
  stop: jest.fn()
};

const mockAdd = {
  text: jest.fn().mockReturnValue({
    setOrigin: jest.fn().mockReturnThis(),
    setColor: jest.fn().mockReturnThis(),
    setText: jest.fn().mockReturnThis()
  }),
  rectangle: jest.fn().mockReturnValue({
    setStrokeStyle: jest.fn().mockReturnThis()
  })
};

const mockTime = {
  delayedCall: jest.fn((delay, callback) => callback())
};

const mockCameras = {
  main: {
    width: 800,
    height: 600
  }
};

jest.mock('../websocket_manager', () => ({
  __esModule: true,
  default: {
    connect: jest.fn().mockReturnValue({
      send: jest.fn(),
      onopen: null,
      onmessage: null,
      onerror: null,
      onclose: null
    }),
    setHost: jest.fn(),
    ws: null
  }
}));

describe('OnlineModeScene', () => {
  let scene;

  beforeEach(() => {
    jest.clearAllMocks();
    scene = new OnlineModeScene();
    scene.add = mockAdd;
    scene.scene = mockScene;
    scene.time = mockTime;
    scene.cameras = mockCameras;
    scene.statusText = mockAdd.text();
  });

  describe('connectAsHost', () => {
    it('stops existing scenes before connecting', () => {
      scene.connectAsHost('TEST123');
      expect(mockScene.stop).toHaveBeenCalledWith('KidsFightScene');
      expect(mockScene.stop).toHaveBeenCalledWith('PlayerSelectScene');
    });

    it('sets host status and creates websocket connection', () => {
      scene.connectAsHost('TEST123');
      expect(wsManager.setHost).toHaveBeenCalledWith(true);
      expect(wsManager.connect).toHaveBeenCalled();
    });

    it('sends create game request on websocket open', () => {
      scene.connectAsHost('TEST123');
      const ws = wsManager.connect();
      ws.onopen();
      expect(ws.send).toHaveBeenCalledWith(JSON.stringify({
        type: 'create_game',
        character: 'player1'
      }));
    });

    it('transitions to player select scene when player joins', () => {
      scene.connectAsHost('TEST123');
      const ws = wsManager.connect();
      ws.onmessage({
        data: JSON.stringify({
          type: 'player_joined',
          roomCode: 'TEST123'
        })
      });
      expect(mockScene.stop).toHaveBeenCalledWith('KidsFightScene');
      expect(mockScene.start).toHaveBeenCalledWith('PlayerSelectScene', {
        mode: 'online',
        isHost: true,
        roomCode: 'TEST123'
      });
    });
  });

  describe('connectAsClient', () => {
    it('stops existing scenes before connecting', () => {
      scene.connectAsClient('TEST123');
      expect(mockScene.stop).toHaveBeenCalledWith('KidsFightScene');
      expect(mockScene.stop).toHaveBeenCalledWith('PlayerSelectScene');
    });

    it('sets client status and creates websocket connection', () => {
      scene.connectAsClient('TEST123');
      expect(wsManager.setHost).toHaveBeenCalledWith(false);
      expect(wsManager.connect).toHaveBeenCalled();
    });

    it('sends join game request on websocket open', () => {
      scene.connectAsClient('TEST123');
      // Explicitly assign the mock ws to both wsManager and scene
      const ws = wsManager.connect();
      wsManager.ws = ws;
      scene.ws = ws;
      // Set readyState to OPEN so wsManager.isConnected() returns true
      ws.readyState = 1; // WebSocket.OPEN
      if (typeof scene.ws.onopen === 'function') scene.ws.onopen();
      // Accept either stringified or object
      expect(ws.send).toHaveBeenCalled();
      const arg = ws.send.mock.calls[0][0];
      let sent;
      try {
        sent = typeof arg === 'string' ? JSON.parse(arg) : arg;
      } catch (e) {
        sent = arg;
      }
      expect(sent).toEqual({
        type: 'join_game',
        roomCode: 'TEST123',
        character: 'player2'
      });
    });

    it('transitions to player select scene when game is joined', () => {
      scene.connectAsClient('TEST123');
      const ws = wsManager.connect();
      ws.onmessage({
        data: JSON.stringify({
          type: 'game_joined',
          roomCode: 'TEST123'
        })
      });
      expect(mockScene.stop).toHaveBeenCalledWith('KidsFightScene');
      expect(mockScene.start).toHaveBeenCalledWith('PlayerSelectScene', {
        mode: 'online',
        isHost: false,
        roomCode: 'TEST123'
      });
    });
  });

  describe('error handling', () => {
    it('displays error message when server returns error', () => {
      scene.connectAsClient('TEST123');
      const ws = wsManager.connect();
      ws.onmessage({
        data: JSON.stringify({
          type: 'error',
          message: 'Room not found'
        })
      });
      expect(scene.statusText.setText).toHaveBeenCalledWith('Erro: Room not found');
      expect(scene.statusText.setColor).toHaveBeenCalledWith('#ff0000');
    });

    it('displays error message on websocket error', () => {
      scene.connectAsClient('TEST123');
      const ws = wsManager.connect();
      ws.onerror();
      expect(scene.statusText.setText).toHaveBeenCalledWith('Erro: Não foi possível conectar ao servidor');
      expect(scene.statusText.setColor).toHaveBeenCalledWith('#ff0000');
    });
  });
});
