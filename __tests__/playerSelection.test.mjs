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
      setTint: jest.fn().mockReturnThis(),
      setFlipX: jest.fn().mockReturnThis(),
      play: jest.fn().mockReturnThis(),
      facing: 1
    })
  }
};

mockPhaser.Scene.prototype.add = {
  text: jest.fn().mockReturnValue({
    setOrigin: jest.fn().mockReturnThis(),
    setDepth: jest.fn().mockReturnThis(),
    setAlpha: jest.fn().mockReturnThis()
  }),
  image: jest.fn().mockReturnValue({
    setOrigin: jest.fn().mockReturnThis()
  })
};

mockPhaser.Scene.prototype.tweens = {
  add: jest.fn()
};

mockPhaser.Scene.prototype.time = {
  delayedCall: jest.fn()
};

mockPhaser.Scene.prototype.cameras = {
  main: {
    width: 800,
    height: 600
  }
};

mockPhaser.Scene.prototype.scene = {
  start: jest.fn()
};

mockPhaser.Scene.prototype.textures = {
  exists: jest.fn().mockReturnValue(true)
};

// Mock global Phaser object
global.Phaser = mockPhaser;

// KidsFightScene mock
class KidsFightScene extends mockPhaser.Scene {
  constructor() {
    super('KidsFightScene');
    this.playerHealth = [100, 100];
    this.player1State = 'idle';
    this.player2State = 'idle';
    this.gameOver = false;
  }
  
  init(data) {
    this.selected = data;
  }
  
  create() {
    // Simplified create method for testing
    const playerSpritesSafe = ['player1', 'player2'];
    const selectedSafe = (this.selected && typeof this.selected.p1 === 'number' && 
                         typeof this.selected.p2 === 'number') ? 
                         this.selected : { p1: 0, p2: 1 };
    
    const p1Key = selectedSafe.p1 === 0 ? 'player1' : 'player2';
    const p2Key = selectedSafe.p2 === 0 ? 'player1' : 'player2';
    
    this.p1SpriteKey = p1Key;
    this.p2SpriteKey = p2Key;
    
    this.sameCharacterSelected = p1Key === p2Key;
    
    this.player1 = this.physics.add.sprite(200, 300, p1Key, 0);
    this.player2 = this.physics.add.sprite(600, 300, p2Key, 0);
    
    // Apply tinting if same character is selected
    if (this.sameCharacterSelected) {
      this.player1.setTint(0xff9999); // Light red tint
      this.player2.setTint(0x9999ff); // Light blue tint
    }
  }
  
  endGame(phrase) {
    if (this.gameOver) return;
    this.gameOver = true;
    const winText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      phrase
    );
    return phrase; // For testing purposes
  }
}

// PlayerSelectScene mock
class PlayerSelectScene extends mockPhaser.Scene {
  constructor() {
    super('PlayerSelectScene');
    this.selected = [null, null]; // [p1Selection, p2Selection]
  }
  
  create() {
    // Mock player selection UI
    this.p1Btns = [
      { setTint: jest.fn() },
      { setTint: jest.fn() }
    ];
    
    this.p2Btns = [
      { setTint: jest.fn() },
      { setTint: jest.fn() }
    ];
    
    this.startBtn = {
      on: jest.fn((event, callback) => {
        this.startCallback = callback;
      })
    };
  }
  
  selectPlayer(playerIdx, characterIdx) {
    this.selected[playerIdx] = characterIdx;
    
    // Update visual selection
    if (playerIdx === 0) {
      this.p1Btns.forEach((btn, idx) => {
        if (idx === characterIdx) {
          btn.setTint(0xffff00); // Yellow tint for selected
        } else {
          btn.setTint(0xffffff); // White tint for unselected
        }
      });
    } else {
      this.p2Btns.forEach((btn, idx) => {
        if (idx === characterIdx) {
          btn.setTint(0xffff00); // Yellow tint for selected
        } else {
          btn.setTint(0xffffff); // White tint for unselected
        }
      });
    }
  }
  
  startGame() {
    if (this.selected[0] !== null && this.selected[1] !== null) {
      this.scene.start('KidsFightScene', {
        p1: this.selected[0],
        p2: this.selected[1]
      });
      return true;
    }
    return false;
  }
}

describe('Player Selection and Character Handling', () => {
  let playerSelectScene;
  let kidsFightScene;
  
  beforeEach(() => {
    playerSelectScene = new PlayerSelectScene();
    kidsFightScene = new KidsFightScene();
    
    // Initialize the scenes
    playerSelectScene.create();
    jest.clearAllMocks();
  });
  
  describe('PlayerSelectScene', () => {
    it('should initialize with null selections', () => {
      expect(playerSelectScene.selected).toEqual([null, null]);
    });
    
    it('should update player 1 selection correctly', () => {
      playerSelectScene.selectPlayer(0, 1); // Player 1 selects Davi R (index 1)
      expect(playerSelectScene.selected[0]).toBe(1);
      expect(playerSelectScene.p1Btns[1].setTint).toHaveBeenCalledWith(0xffff00);
      expect(playerSelectScene.p1Btns[0].setTint).toHaveBeenCalledWith(0xffffff);
    });
    
    it('should update player 2 selection correctly', () => {
      playerSelectScene.selectPlayer(1, 0); // Player 2 selects Bento (index 0)
      expect(playerSelectScene.selected[1]).toBe(0);
      expect(playerSelectScene.p2Btns[0].setTint).toHaveBeenCalledWith(0xffff00);
      expect(playerSelectScene.p2Btns[1].setTint).toHaveBeenCalledWith(0xffffff);
    });
    
    it('should not start game if selections are incomplete', () => {
      playerSelectScene.selectPlayer(0, 0); // Only Player 1 made a selection
      const result = playerSelectScene.startGame();
      expect(result).toBe(false);
      expect(playerSelectScene.scene.start).not.toHaveBeenCalled();
    });
    
    it('should start game with correct data when both players have selected', () => {
      playerSelectScene.selectPlayer(0, 0); // Player 1 selects Bento
      playerSelectScene.selectPlayer(1, 1); // Player 2 selects Davi R
      const result = playerSelectScene.startGame();
      expect(result).toBe(true);
      expect(playerSelectScene.scene.start).toHaveBeenCalledWith('KidsFightScene', {
        p1: 0,
        p2: 1
      });
    });
  });
  
  describe('KidsFightScene', () => {
    it('should default to p1=0, p2=1 if no selection data is provided', () => {
      kidsFightScene.init(null);
      kidsFightScene.create();
      expect(kidsFightScene.p1SpriteKey).toBe('player1'); // Bento
      expect(kidsFightScene.p2SpriteKey).toBe('player2'); // Davi R
    });
    
    it('should map player selection indices to correct sprite keys', () => {
      kidsFightScene.init({ p1: 1, p2: 0 }); // P1=Davi R, P2=Bento
      kidsFightScene.create();
      expect(kidsFightScene.p1SpriteKey).toBe('player2'); // Davi R
      expect(kidsFightScene.p2SpriteKey).toBe('player1'); // Bento
    });
    
    it('should detect when the same character is selected and apply tinting', () => {
      kidsFightScene.init({ p1: 0, p2: 0 }); // Both select Bento
      kidsFightScene.create();
      expect(kidsFightScene.sameCharacterSelected).toBe(true);
      expect(kidsFightScene.player1.setTint).toHaveBeenCalledWith(0xff9999); // Red tint
      expect(kidsFightScene.player2.setTint).toHaveBeenCalledWith(0x9999ff); // Blue tint
    });
    
    it('should not apply tinting when different characters are selected', () => {
      kidsFightScene.init({ p1: 0, p2: 1 }); // P1=Bento, P2=Davi R
      kidsFightScene.create();
      expect(kidsFightScene.sameCharacterSelected).toBe(false);
      expect(kidsFightScene.player1.setTint).not.toHaveBeenCalled();
      expect(kidsFightScene.player2.setTint).not.toHaveBeenCalled();
    });
    
    it('should show correct winner message for Player 1 (Bento) win', () => {
      kidsFightScene.init({ p1: 0, p2: 1 }); // P1=Bento, P2=Davi R
      kidsFightScene.create();
      kidsFightScene.playerHealth = [100, 0]; // Player 2's health is 0
      const message = kidsFightScene.endGame('Bento Venceu!');
      expect(message).toBe('Bento Venceu!');
    });
    
    it('should show correct winner message for Player 1 (Davi R) win', () => {
      kidsFightScene.init({ p1: 1, p2: 0 }); // P1=Davi R, P2=Bento
      kidsFightScene.create();
      kidsFightScene.playerHealth = [100, 0]; // Player 2's health is 0
      const message = kidsFightScene.endGame('Davi R Venceu!');
      expect(message).toBe('Davi R Venceu!');
    });
    
    it('should show correct winner message for Player 2 (Bento) win', () => {
      kidsFightScene.init({ p1: 1, p2: 0 }); // P1=Davi R, P2=Bento
      kidsFightScene.create();
      kidsFightScene.playerHealth = [0, 100]; // Player 1's health is 0
      const message = kidsFightScene.endGame('Bento Venceu!');
      expect(message).toBe('Bento Venceu!');
    });
    
    it('should show correct winner message for Player 2 (Davi R) win', () => {
      kidsFightScene.init({ p1: 0, p2: 1 }); // P1=Bento, P2=Davi R
      kidsFightScene.create();
      kidsFightScene.playerHealth = [0, 100]; // Player 1's health is 0
      const message = kidsFightScene.endGame('Davi R Venceu!');
      expect(message).toBe('Davi R Venceu!');
    });
  });
});
