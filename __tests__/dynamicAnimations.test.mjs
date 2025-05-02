// Mock Phaser
const mockPhaser = {
  Scene: class {
    constructor(config) {
      this.key = config;
    }
  }
};

mockPhaser.Scene.prototype.physics = {
  add: {
    sprite: jest.fn().mockReturnValue({
      setScale: jest.fn().mockReturnThis(),
      setOrigin: jest.fn().mockReturnThis(),
      body: {
        setSize: jest.fn(),
        setOffset: jest.fn()
      },
      setCollideWorldBounds: jest.fn().mockReturnThis(),
      setBounce: jest.fn().mockReturnThis(),
      play: jest.fn().mockReturnThis(),
      facing: 1
    })
  }
};

mockPhaser.Scene.prototype.anims = {
  create: jest.fn(),
  exists: jest.fn().mockReturnValue(false)
};

// Mock global Phaser object
global.Phaser = mockPhaser;

// Create a simplified version of KidsFightScene for testing animations
class TestKidsFightScene extends mockPhaser.Scene {
  constructor() {
    super('KidsFightScene');
    this.player1 = null;
    this.player2 = null;
    this.p1SpriteKey = 'player1';
    this.p2SpriteKey = 'player2';
  }
  
  init(data) {
    this.selected = data || { p1: 0, p2: 1 };
  }
  
  create() {
    // Map selection indices to sprite keys
    const playerSpritesSafe = ['player1', 'player2'];
    const selectedSafe = (this.selected && 
                         typeof this.selected.p1 === 'number' && 
                         typeof this.selected.p2 === 'number') ? 
                         this.selected : { p1: 0, p2: 1 };
    
    const p1Key = selectedSafe.p1 === 0 ? 'player1' : 'player2';
    const p2Key = selectedSafe.p2 === 0 ? 'player1' : 'player2';
    
    this.p1SpriteKey = p1Key;
    this.p2SpriteKey = p2Key;
    
    // Create player sprites
    this.player1 = this.physics.add.sprite(200, 300, p1Key, 0);
    this.player2 = this.physics.add.sprite(600, 300, p2Key, 0);
    
    // Create animations with dynamic keys
    this.createPlayerAnimations();
  }
  
  createPlayerAnimations() {
    // Only create animations if they don't exist
    if (!this.anims.exists(`p1_idle_${this.p1SpriteKey}`)) {
      this.anims.create({
        key: `p1_idle_${this.p1SpriteKey}`,
        frames: [{ key: this.p1SpriteKey, frame: 0 }],
        frameRate: 1,
        repeat: -1
      });
    }
    
    if (!this.anims.exists(`p1_walk_${this.p1SpriteKey}`)) {
      this.anims.create({
        key: `p1_walk_${this.p1SpriteKey}`,
        frames: [
          { key: this.p1SpriteKey, frame: 1 },
          { key: this.p1SpriteKey, frame: 2 }
        ],
        frameRate: 6,
        repeat: -1
      });
    }
    
    if (!this.anims.exists(`p1_attack_${this.p1SpriteKey}`)) {
      this.anims.create({
        key: `p1_attack_${this.p1SpriteKey}`,
        frames: [{ key: this.p1SpriteKey, frame: 4 }],
        frameRate: 1,
        repeat: 0,
        duration: 200
      });
    }
    
    if (!this.anims.exists(`p1_special_${this.p1SpriteKey}`)) {
      this.anims.create({
        key: `p1_special_${this.p1SpriteKey}`,
        frames: [{ key: this.p1SpriteKey, frame: 6 }],
        frameRate: 1,
        repeat: 0,
        duration: 900
      });
    }
    
    // Player 2 animations
    if (!this.anims.exists(`p2_idle_${this.p2SpriteKey}`)) {
      this.anims.create({
        key: `p2_idle_${this.p2SpriteKey}`,
        frames: [{ key: this.p2SpriteKey, frame: 0 }],
        frameRate: 1,
        repeat: -1
      });
    }
    
    if (!this.anims.exists(`p2_walk_${this.p2SpriteKey}`)) {
      this.anims.create({
        key: `p2_walk_${this.p2SpriteKey}`,
        frames: [
          { key: this.p2SpriteKey, frame: 0 },
          { key: this.p2SpriteKey, frame: 1 }
        ],
        frameRate: 6,
        repeat: -1
      });
    }
    
    if (!this.anims.exists(`p2_attack_${this.p2SpriteKey}`)) {
      this.anims.create({
        key: `p2_attack_${this.p2SpriteKey}`,
        frames: [{ key: this.p2SpriteKey, frame: 4 }],
        frameRate: 1,
        repeat: 0,
        duration: 200
      });
    }
    
    if (!this.anims.exists(`p2_special_${this.p2SpriteKey}`)) {
      this.anims.create({
        key: `p2_special_${this.p2SpriteKey}`,
        frames: [{ key: this.p2SpriteKey, frame: 6 }],
        frameRate: 1,
        repeat: 0,
        duration: 900
      });
    }
  }
  
  playPlayerAnimations() {
    // Play animations with dynamic keys
    this.player1.play(`p1_idle_${this.p1SpriteKey}`);
    this.player2.play(`p2_idle_${this.p2SpriteKey}`);
  }
  
  playerAttack(playerNum) {
    if (playerNum === 1) {
      const p1AttackKey = `p1_attack_${this.p1SpriteKey}`;
      this.player1.play(p1AttackKey);
    } else {
      const p2AttackKey = `p2_attack_${this.p2SpriteKey}`;
      this.player2.play(p2AttackKey);
    }
  }
  
  playerSpecial(playerNum) {
    if (playerNum === 1) {
      const p1SpecialKey = `p1_special_${this.p1SpriteKey}`;
      this.player1.play(p1SpecialKey);
    } else {
      const p2SpecialKey = `p2_special_${this.p2SpriteKey}`;
      this.player2.play(p2SpecialKey);
    }
  }
}

describe('Dynamic Animation Keys', () => {
  let scene;
  
  beforeEach(() => {
    scene = new TestKidsFightScene();
    jest.clearAllMocks();
  });
  
  describe('Animation Creation', () => {
    it('should create animations with dynamic keys based on player 1 sprite key', () => {
      scene.init({ p1: 0, p2: 1 }); // P1=Bento, P2=Davi R
      scene.create();
      
      // Check that animations were created with the correct dynamic keys
      expect(scene.anims.create).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'p1_idle_player1'
        })
      );
      
      expect(scene.anims.create).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'p1_walk_player1'
        })
      );
      
      expect(scene.anims.create).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'p1_attack_player1'
        })
      );
      
      expect(scene.anims.create).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'p1_special_player1'
        })
      );
    });
    
    it('should create animations with dynamic keys based on player 2 sprite key', () => {
      scene.init({ p1: 0, p2: 1 }); // P1=Bento, P2=Davi R
      scene.create();
      
      // Check that animations were created with the correct dynamic keys
      expect(scene.anims.create).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'p2_idle_player2'
        })
      );
      
      expect(scene.anims.create).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'p2_walk_player2'
        })
      );
      
      expect(scene.anims.create).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'p2_attack_player2'
        })
      );
      
      expect(scene.anims.create).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'p2_special_player2'
        })
      );
    });
    
    it('should create animations with correct keys when players select the same character', () => {
      scene.init({ p1: 0, p2: 0 }); // Both select Bento
      scene.create();
      
      // Check Player 1 animations
      expect(scene.anims.create).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'p1_idle_player1'
        })
      );
      
      // Check Player 2 animations
      expect(scene.anims.create).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'p2_idle_player1'
        })
      );
    });
    
    it('should create animations with correct keys when players select opposite characters', () => {
      scene.init({ p1: 1, p2: 0 }); // P1=Davi R, P2=Bento
      scene.create();
      
      // Check Player 1 animations
      expect(scene.anims.create).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'p1_idle_player2'
        })
      );
      
      // Check Player 2 animations
      expect(scene.anims.create).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'p2_idle_player1'
        })
      );
    });
  });
  
  describe('Animation Playback', () => {
    it('should play idle animations with correct dynamic keys', () => {
      scene.init({ p1: 0, p2: 1 }); // P1=Bento, P2=Davi R
      scene.create();
      scene.playPlayerAnimations();
      
      expect(scene.player1.play).toHaveBeenCalledWith('p1_idle_player1');
      expect(scene.player2.play).toHaveBeenCalledWith('p2_idle_player2');
    });
    
    it('should play attack animations with correct dynamic keys', () => {
      scene.init({ p1: 0, p2: 1 }); // P1=Bento, P2=Davi R
      scene.create();
      
      scene.playerAttack(1); // Player 1 attacks
      expect(scene.player1.play).toHaveBeenCalledWith('p1_attack_player1');
      
      scene.playerAttack(2); // Player 2 attacks
      expect(scene.player2.play).toHaveBeenCalledWith('p2_attack_player2');
    });
    
    it('should play special animations with correct dynamic keys', () => {
      scene.init({ p1: 0, p2: 1 }); // P1=Bento, P2=Davi R
      scene.create();
      
      scene.playerSpecial(1); // Player 1 special
      expect(scene.player1.play).toHaveBeenCalledWith('p1_special_player1');
      
      scene.playerSpecial(2); // Player 2 special
      expect(scene.player2.play).toHaveBeenCalledWith('p2_special_player2');
    });
    
    it('should play animations with correct keys when players select the same character', () => {
      scene.init({ p1: 0, p2: 0 }); // Both select Bento
      scene.create();
      scene.playPlayerAnimations();
      
      expect(scene.player1.play).toHaveBeenCalledWith('p1_idle_player1');
      expect(scene.player2.play).toHaveBeenCalledWith('p2_idle_player1');
    });
  });
});
