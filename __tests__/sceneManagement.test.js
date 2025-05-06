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
    constructor() { super({ key: 'KidsFightScene' }); }
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
    this.add = {
      rectangle: jest.fn().mockReturnThis(),
      text: jest.fn().mockReturnThis(),
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
