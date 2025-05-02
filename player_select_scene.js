import scenarioImg from './scenario1.png?url';
import player1RawImg from './sprites-bento3.png?url';
import player2RawImg from './sprites-davir3.png?url';
import player3RawImg from './sprites-jose3.png?url';
import player4RawImg from './sprites-davis3.png?url';

class PlayerSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PlayerSelectScene' });
    console.log('PlayerSelectScene constructor called');
    this.selected = { p1: 0, p2: 1 }; // Default selections
  }
  
  init() {
    // Reset selections when scene is restarted
    console.log('[PlayerSelectScene] Init called, resetting selections');
    this.selected = { p1: 0, p2: 1 };
  }
  
  preload() {
    console.log('[PlayerSelectScene] Preload started');
    this.load.image('select_bg', scenarioImg);
    this.load.image('player1_raw', player1RawImg);
    this.load.image('player2_raw', player2RawImg);
    this.load.image('player3_raw', player3RawImg);
    this.load.image('player4_raw', player4RawImg);
    console.log('[PlayerSelectScene] Assets queued for loading');
  }
  
  create() {
    // Log screen dimensions for debugging
    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;
    console.log(`[PlayerSelectScene] Create called - Screen dimensions: ${screenWidth}x${screenHeight}`);
    
    // Create a simple background
    const bg = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.7);
    
    // Add title text
    this.add.text(400, 100, 'ESCOLHA SEUS LUTADORES', {
      fontSize: '32px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Player 1 section
    this.add.text(200, 150, 'JOGADOR 1', {
      fontSize: '24px',
      fill: '#ff0000',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Player 2 section
    this.add.text(600, 150, 'JOGADOR 2', {
      fontSize: '24px',
      fill: '#0000ff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // --- CREATE CUSTOM SPRITESHEETS FIRST ---
    // Player 1
    if (!this.textures.exists('player1')) {
      console.log('[PlayerSelectScene] Creating player1 spritesheet');
      const frameWidths = [300, 300, 400, 460, 500, 440, 440, 440];
      const frameHeight = 512;
      const player1Texture = this.textures.get('player1_raw').getSourceImage();
      this.textures.addSpriteSheet('player1', player1Texture, {
        frameWidth: 430,
        frameHeight: frameHeight,
        startFrame: 0,
        endFrame: 6
      });
      const tex = this.textures.get('player1');
      tex.frames = { __BASE: tex.frames['__BASE'] };
      let x = 0;
      for (let i = 0; i < frameWidths.length; i++) {
        tex.add(i, 0, x, 0, frameWidths[i], frameHeight);
        x += frameWidths[i];
      }
    }
    
    // Player 2
    if (!this.textures.exists('player2')) {
      console.log('[PlayerSelectScene] Creating player2 spritesheet');
      const frameWidths = [300, 300, 400, 460, 500, 400, 400, 400];
      const frameHeight = 512;
      const player2Texture = this.textures.get('player2_raw').getSourceImage();
      this.textures.addSpriteSheet('player2', player2Texture, {
        frameWidth: 400,
        frameHeight: frameHeight,
        startFrame: 0,
        endFrame: frameWidths.length - 1
      });
      const tex = this.textures.get('player2');
      tex.frames = { __BASE: tex.frames['__BASE'] };
      let x = 0;
      for (let i = 0; i < frameWidths.length; i++) {
        tex.add(i, 0, x, 0, frameWidths[i], frameHeight);
        x += frameWidths[i];
      }
    }
    
    // Player 3 (José)
    if (!this.textures.exists('player3')) {
      console.log('[PlayerSelectScene] Creating player3 spritesheet');
      const frameWidths = [300, 300, 400, 460, 500, 400, 400, 400];
      const frameHeight = 512;
      const player3Texture = this.textures.get('player3_raw').getSourceImage();
      this.textures.addSpriteSheet('player3', player3Texture, {
        frameWidth: 400,
        frameHeight: frameHeight,
        startFrame: 0,
        endFrame: frameWidths.length - 1
      });
      const tex = this.textures.get('player3');
      tex.frames = { __BASE: tex.frames['__BASE'] };
      let x = 0;
      for (let i = 0; i < frameWidths.length; i++) {
        tex.add(i, 0, x, 0, frameWidths[i], frameHeight);
        x += frameWidths[i];
      }
    }
    
    // Player 4 (Davi S)
    if (!this.textures.exists('player4')) {
      console.log('[PlayerSelectScene] Creating player4 spritesheet');
      const frameWidths = [300, 300, 400, 460, 500, 400, 400, 400];
      const frameHeight = 512;
      const player4Texture = this.textures.get('player4_raw').getSourceImage();
      this.textures.addSpriteSheet('player4', player4Texture, {
        frameWidth: 400,
        frameHeight: frameHeight,
        startFrame: 0,
        endFrame: frameWidths.length - 1
      });
      const tex = this.textures.get('player4');
      tex.frames = { __BASE: tex.frames['__BASE'] };
      let x = 0;
      for (let i = 0; i < frameWidths.length; i++) {
        tex.add(i, 0, x, 0, frameWidths[i], frameHeight);
        x += frameWidths[i];
      }
    }
    
    // Create player sprites for selection - with space between player 1 and player 2 groups
    // Player 1 options
    const p1Option1 = this.add.sprite(120, 250, 'player1', 0).setScale(0.15);
    const p1Option2 = this.add.sprite(190, 250, 'player2', 0).setScale(0.15);
    const p1Option3 = this.add.sprite(260, 250, 'player3', 0).setScale(0.15);
    const p1Option4 = this.add.sprite(330, 250, 'player4', 0).setScale(0.15);
    
    // Player 2 options - added more space between player groups
    const p2Option1 = this.add.sprite(470, 250, 'player1', 0).setScale(0.15);
    const p2Option2 = this.add.sprite(540, 250, 'player2', 0).setScale(0.15);
    const p2Option3 = this.add.sprite(610, 250, 'player3', 0).setScale(0.15);
    const p2Option4 = this.add.sprite(680, 250, 'player4', 0).setScale(0.15);
    
    // Add player names
    const nameStyle = {
      fontSize: '16px',
      fill: '#ffffff',
      fontStyle: 'bold'
    };
    
    this.add.text(120, 320, 'Bento', nameStyle).setOrigin(0.5);
    this.add.text(190, 320, 'Davi R', nameStyle).setOrigin(0.5);
    this.add.text(260, 320, 'José', nameStyle).setOrigin(0.5);
    this.add.text(330, 320, 'Davi S', nameStyle).setOrigin(0.5);
    this.add.text(470, 320, 'Bento', nameStyle).setOrigin(0.5);
    this.add.text(540, 320, 'Davi R', nameStyle).setOrigin(0.5);
    this.add.text(610, 320, 'José', nameStyle).setOrigin(0.5);
    this.add.text(680, 320, 'Davi S', nameStyle).setOrigin(0.5);
    
    // Make options interactive
    p1Option1.setInteractive();
    p1Option2.setInteractive();
    p1Option3.setInteractive();
    p1Option4.setInteractive();
    p2Option1.setInteractive();
    p2Option2.setInteractive();
    p2Option3.setInteractive();
    p2Option4.setInteractive();
    
    // Add selection indicators - store them as class properties so we can access them in other methods
    // Smaller selection indicators to match smaller sprites
    this.p1Selector = this.add.rectangle(120, 250, 70, 70).setStrokeStyle(4, 0xffff00).setFillStyle();
    this.p2Selector = this.add.rectangle(540, 250, 70, 70).setStrokeStyle(4, 0xffff00).setFillStyle();
    
    // Add click handlers
    p1Option1.on('pointerdown', () => {
      this.selected.p1 = 0;
      this.p1Selector.setPosition(120, 250);
      console.log('[PlayerSelectScene] Player 1 selected Bento (0)', this.selected);
    });
    
    p1Option2.on('pointerdown', () => {
      this.selected.p1 = 1;
      this.p1Selector.setPosition(190, 250);
      console.log('[PlayerSelectScene] Player 1 selected Davi R (1)', this.selected);
    });
    
    p1Option3.on('pointerdown', () => {
      this.selected.p1 = 2;
      this.p1Selector.setPosition(260, 250);
      console.log('[PlayerSelectScene] Player 1 selected José (2)', this.selected);
    });
    
    p1Option4.on('pointerdown', () => {
      this.selected.p1 = 3;
      this.p1Selector.setPosition(330, 250);
      console.log('[PlayerSelectScene] Player 1 selected Davi S (3)', this.selected);
    });
    
    p2Option1.on('pointerdown', () => {
      this.selected.p2 = 0;
      this.p2Selector.setPosition(470, 250);
      console.log('[PlayerSelectScene] Player 2 selected Bento (0)', this.selected);
    });
    
    p2Option2.on('pointerdown', () => {
      this.selected.p2 = 1;
      this.p2Selector.setPosition(540, 250);
      console.log('[PlayerSelectScene] Player 2 selected Davi R (1)', this.selected);
    });
    
    p2Option3.on('pointerdown', () => {
      this.selected.p2 = 2;
      this.p2Selector.setPosition(610, 250);
      console.log('[PlayerSelectScene] Player 2 selected José (2)', this.selected);
    });
    
    p2Option4.on('pointerdown', () => {
      this.selected.p2 = 3;
      this.p2Selector.setPosition(680, 250);
      console.log('[PlayerSelectScene] Player 2 selected Davi S (3)', this.selected);
    });
    
    // Start button - position it even higher on the screen
    const buttonY = Math.min(screenHeight * 0.40, 290); // Much higher position - 40% of screen height, capped at 290px
    
    // Make button more visible with brighter color, larger size, and border
    const startBtn = this.add.rectangle(400, buttonY, 240, 70, 0x00ff00)
      .setStrokeStyle(4, 0x000000); // Add black border for better visibility
    const startText = this.add.text(400, buttonY, 'COMEÇAR LUTA!', {
      fontSize: Math.max(18, Math.min(24, Math.round(this.cameras.main.width * 0.06))) + 'px', // Responsive font size
      fill: '#000000',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Make start button interactive
    startBtn.setInteractive();
    startBtn.on('pointerdown', () => {
      // Log the selection for debugging
      console.log('[PlayerSelectScene] Starting fight with selections:', this.selected);
      
      // Create a new object with the exact format expected by KidsFightScene
      // KidsFightScene expects { p1: number, p2: number }
      this.scene.start('KidsFightScene', {
        p1: this.selected.p1,
        p2: this.selected.p2
      });
    });
    
    console.log('[PlayerSelectScene] UI created');
  }
}

export default PlayerSelectScene;
