// Mock Phaser
const Phaser = {
  Scale: {
    PORTRAIT: 'portrait',
    LANDSCAPE: 'landscape'
  },
  Scene: class Scene {}
};

// Mock Scene classes
const mockSceneClasses = {
  PlayerSelectScene: class PlayerSelectScene extends Phaser.Scene {
    constructor() { super({ key: 'PlayerSelectScene' }); }
    create() {
      const w = this.cameras.main.width;
      const h = this.cameras.main.height;
      this.bg = this.add.rectangle(w/2, h/2, w, h, 0x222222, 1);
    }
  },
  ScenarioSelectScene: class ScenarioSelectScene extends Phaser.Scene {
    constructor() { super({ key: 'ScenarioSelectScene' }); }
  },
  KidsFightScene: class KidsFightScene extends Phaser.Scene {
    constructor() { 
      super({ key: 'KidsFightScene' }); 
      this.selected = {
        p1: 'player1',
        p2: 'player2'
      };
      this.selectedScenario = 'scenario1';
    }

    endGame(phrase) {
      const winText = this.add.text(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2,
        phrase,
        {}
      );

      const replayButton = this.add.text(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2 + 50,
        'Jogar Novamente (Mesmos Jogadores)',
        {}
      );
      replayButton.setInteractive();

      const newPlayersButton = this.add.text(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2 + 100,
        'Escolher Outros Jogadores',
        {}
      );
      newPlayersButton.setInteractive();

      replayButton.on('pointerdown', () => {
        this.scene.restart({
          p1: this.selected.p1,
          p2: this.selected.p2,
          scenario: this.selectedScenario
        });
      });

      newPlayersButton.on('pointerdown', () => {
        this.scene.stop();
        if (this.scene.get('PlayerSelectScene')) {
          this.scene.start('PlayerSelectScene');
        }
      });
    }
  },
  RotatePromptScene: class RotatePromptScene extends Phaser.Scene {
    constructor() { super({ key: 'RotatePromptScene' }); }
    create() {
      const w = this.cameras.main.width;
      const h = this.cameras.main.height;
      this.bg = this.add.rectangle(w/2, h/2, w, h, 0x222222, 1);
      this.text = this.add.text(w/2, h/2, 'Por favor, gire seu dispositivo para o modo paisagem.', {
        fontSize: '32px',
        color: '#fff',
        fontFamily: 'monospace',
        align: 'center',
        wordWrap: { width: 800 * 0.8 }
      });
    }
    update() {
      if (this.scale.orientation === Phaser.Scale.LANDSCAPE) {
        if (!this.scenesAdded) {
          this.scene.add('PlayerSelectScene', mockSceneClasses.PlayerSelectScene, false);
          this.scene.add('ScenarioSelectScene', mockSceneClasses.ScenarioSelectScene, false);
          this.scene.add('KidsFightScene', mockSceneClasses.KidsFightScene, false);
          this.scenesAdded = true;
        }
        this.scene.stop();
        this.scene.start('PlayerSelectScene');
      }
    }
  }
};

// Mock Phaser Scene
class MockScene {
  constructor() {
    // Create mock text object with event emitter functionality
    const createMockText = () => {
      const listeners = {};
      return {
        setInteractive: jest.fn().mockReturnThis(),
        setOrigin: jest.fn().mockReturnThis(),
        on: jest.fn((event, callback) => {
          listeners[event] = callback;
          return this;
        }),
        emit: (event) => {
          if (listeners[event]) {
            listeners[event]();
          }
        }
      };
    };

    this.add = {
      rectangle: jest.fn().mockReturnThis(),
      text: jest.fn(() => createMockText()),
      image: jest.fn().mockReturnThis(),
    };
    this.cameras = {
      main: {
        width: 800,
        height: 600
      }
    };
    this.scale = {
      width: 800,
      height: 600,
      orientation: Phaser.Scale.PORTRAIT
    };
    this.scene = {
      start: jest.fn(),
      stop: jest.fn(),
      add: jest.fn(),
      restart: jest.fn(),
      get: jest.fn().mockReturnValue(true)
    };
    this.time = {
      delayedCall: jest.fn((delay, callback) => {
        if (callback) callback();
      })
    };
  }
  setOrigin() { return this; }
}

describe('Scene Management', () => {
  let rotateScene;
  let mockScene;

  beforeEach(() => {
    mockScene = new MockScene();
    rotateScene = new mockSceneClasses.RotatePromptScene();
    // Copy mock methods to the scene
    Object.assign(rotateScene, mockScene);
  });

  describe('RotatePromptScene', () => {
    it('creates a fully opaque background', () => {
      rotateScene.create();
      expect(rotateScene.add.rectangle).toHaveBeenCalledWith(
        400, // width/2
        300, // height/2
        800, // width
        600, // height
        0x222222, // color
        1 // alpha (fully opaque)
      );
    });

    it('shows rotation message initially', () => {
      rotateScene.create();
      expect(rotateScene.add.text).toHaveBeenCalledWith(
        400, // width/2
        300, // height/2
        'Por favor, gire seu dispositivo para o modo paisagem.',
        {
          fontSize: '32px',
          color: '#fff',
          fontFamily: 'monospace',
          align: 'center',
          wordWrap: { width: 640 } // 800 * 0.8
        }
      );
    });

    it('adds game scenes only when in landscape mode', () => {
      rotateScene.create();
      rotateScene.scenesAdded = false;
      rotateScene.scale.orientation = Phaser.Scale.LANDSCAPE;
      
      rotateScene.update();
      
      expect(rotateScene.scene.add).toHaveBeenCalledWith('PlayerSelectScene', mockSceneClasses.PlayerSelectScene, false);
      expect(rotateScene.scene.add).toHaveBeenCalledWith('ScenarioSelectScene', mockSceneClasses.ScenarioSelectScene, false);
      expect(rotateScene.scene.add).toHaveBeenCalledWith('KidsFightScene', mockSceneClasses.KidsFightScene, false);
      expect(rotateScene.scenesAdded).toBe(true);
    });

    it('stops itself before starting PlayerSelectScene', () => {
      rotateScene.create();
      rotateScene.scale.orientation = Phaser.Scale.LANDSCAPE;
      
      rotateScene.update();
      
      expect(rotateScene.scene.stop).toHaveBeenCalled();
      expect(rotateScene.scene.start).toHaveBeenCalledWith('PlayerSelectScene');
    });

    it('does not add scenes multiple times', () => {

  });
});

describe('KidsFightScene', () => {
  let kidsFightScene;
  let mockScene;

  beforeEach(() => {
    mockScene = new MockScene();
    kidsFightScene = new mockSceneClasses.KidsFightScene();
    Object.assign(kidsFightScene, mockScene);
  });

  describe('endGame', () => {
    it('displays win message and replay buttons', () => {
      kidsFightScene.endGame('Player 1 wins!');

      // Check if win message is displayed
      expect(kidsFightScene.add.text).toHaveBeenCalledWith(
        400, // width/2
        300, // height/2
        'Player 1 wins!',
        expect.any(Object)
      );

      // Check if replay button is displayed
      expect(kidsFightScene.add.text).toHaveBeenCalledWith(
        400, // width/2
        350, // height/2 + 50
        'Jogar Novamente (Mesmos Jogadores)',
        expect.any(Object)
      );

      // Check if new players button is displayed
      expect(kidsFightScene.add.text).toHaveBeenCalledWith(
        400, // width/2
        400, // height/2 + 100
        'Escolher Outros Jogadores',
        expect.any(Object)
      );
    });

    it('restarts game with same players when replay button is clicked', () => {
      kidsFightScene.endGame('Player 1 wins!');
      
      // Get the replay button (second text element created)
      const replayButton = kidsFightScene.add.text.mock.results[1].value;
      
      // Simulate click on replay button
      replayButton.emit('pointerdown');

      // Check if scene is restarted with correct data
      expect(kidsFightScene.scene.restart).toHaveBeenCalledWith({
        p1: 'player1',
        p2: 'player2',
        scenario: 'scenario1'
      });
    });

    it('transitions to player select when new players button is clicked', () => {
      kidsFightScene.endGame('Player 1 wins!');
      
      // Get the new players button (third text element created)
      const newPlayersButton = kidsFightScene.add.text.mock.results[2].value;
      
      // Simulate click on new players button
      newPlayersButton.emit('pointerdown');

      // Check if current scene is stopped
      expect(kidsFightScene.scene.stop).toHaveBeenCalled();
      
      // Check if PlayerSelectScene exists
      expect(kidsFightScene.scene.get).toHaveBeenCalledWith('PlayerSelectScene');
      
      // Check if PlayerSelectScene is started
      expect(kidsFightScene.scene.start).toHaveBeenCalledWith('PlayerSelectScene');
    });

    it('does not start PlayerSelectScene if it does not exist', () => {
      // Mock scene.get to return false (scene does not exist)
      kidsFightScene.scene.get.mockReturnValue(false);
      
      kidsFightScene.endGame('Player 1 wins!');
      
      // Get the new players button (third text element created)
      const newPlayersButton = kidsFightScene.add.text.mock.results[2].value;
      
      // Simulate click on new players button
      newPlayersButton.emit('pointerdown');

      // Check if current scene is stopped
      expect(kidsFightScene.scene.stop).toHaveBeenCalled();
      
      // Check if PlayerSelectScene exists
      expect(kidsFightScene.scene.get).toHaveBeenCalledWith('PlayerSelectScene');
      
      // Check that PlayerSelectScene is NOT started
      expect(kidsFightScene.scene.start).not.toHaveBeenCalled();
    });
  });

    it('does not add scenes multiple times', () => {
      rotateScene.create();
      rotateScene.scenesAdded = true;
      rotateScene.scale.orientation = Phaser.Scale.LANDSCAPE;
      
      rotateScene.update();
      
      expect(rotateScene.scene.add).not.toHaveBeenCalled();
    });
  });

  describe('PlayerSelectScene', () => {
    let playerScene;

    beforeEach(() => {
      playerScene = new mockSceneClasses.PlayerSelectScene();
      Object.assign(playerScene, mockScene);
    });

    it('creates a fully opaque background', () => {
      playerScene.create();
      expect(playerScene.add.rectangle).toHaveBeenCalledWith(
        400, // width/2
        300, // height/2
        800, // width
        600, // height
        0x222222, // color
        1 // alpha (fully opaque)
      );
    });
  });
});
