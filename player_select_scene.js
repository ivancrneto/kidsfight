import scenarioImg from './scenario1.png?url';
import player1RawImg from './sprites-bento3.png?url';
import player2RawImg from './sprites-davir3.png?url';

class PlayerSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PlayerSelectScene' });
    console.log('PlayerSelectScene constructor called');
    this.selected = { p1: 0, p2: 0 }; // Default selections
  }
  
  init() {
    // Reset selections when scene is restarted
    console.log('[PlayerSelectScene] Init called, resetting selections');
    this.selected = { p1: 0, p2: 0 };
  }
  
  preload() {
    console.log('[PlayerSelectScene] Preload started');
    this.load.image('select_bg', scenarioImg);
    this.load.image('player1_raw', player1RawImg);
    this.load.image('player2_raw', player2RawImg);
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
    
    // Create player sprites for selection
    // Player 1 options
    const p1Option1 = this.add.sprite(150, 250, 'player1', 0).setScale(0.25);
    const p1Option2 = this.add.sprite(250, 250, 'player2', 0).setScale(0.25);
    
    // Player 2 options
    const p2Option1 = this.add.sprite(550, 250, 'player1', 0).setScale(0.25);
    const p2Option2 = this.add.sprite(650, 250, 'player2', 0).setScale(0.25);
    
    // Add player names
    const nameStyle = {
      fontSize: '16px',
      fill: '#ffffff',
      fontStyle: 'bold'
    };
    
    this.add.text(150, 320, 'Bento', nameStyle).setOrigin(0.5);
    this.add.text(250, 320, 'Davi R', nameStyle).setOrigin(0.5);
    this.add.text(550, 320, 'Bento', nameStyle).setOrigin(0.5);
    this.add.text(650, 320, 'Davi R', nameStyle).setOrigin(0.5);
    
    // Make options interactive
    p1Option1.setInteractive();
    p1Option2.setInteractive();
    p2Option1.setInteractive();
    p2Option2.setInteractive();
    
    // Add selection indicators - store them as class properties so we can access them in other methods
    this.p1Selector = this.add.rectangle(150, 250, 110, 110).setStrokeStyle(4, 0xffff00).setFillStyle();
    this.p2Selector = this.add.rectangle(550, 250, 110, 110).setStrokeStyle(4, 0xffff00).setFillStyle();
    
    // Add click handlers
    p1Option1.on('pointerdown', () => {
      this.selected.p1 = 0;
      this.p1Selector.setPosition(150, 250);
      console.log('[PlayerSelectScene] Player 1 selected Bento (0)', this.selected);
    });
    
    p1Option2.on('pointerdown', () => {
      this.selected.p1 = 1;
      this.p1Selector.setPosition(250, 250);
      console.log('[PlayerSelectScene] Player 1 selected Davi R (1)', this.selected);
    });
    
    p2Option1.on('pointerdown', () => {
      this.selected.p2 = 0;
      this.p2Selector.setPosition(550, 250);
      console.log('[PlayerSelectScene] Player 2 selected Bento (0)', this.selected);
    });
    
    p2Option2.on('pointerdown', () => {
      this.selected.p2 = 1;
      this.p2Selector.setPosition(650, 250);
      console.log('[PlayerSelectScene] Player 2 selected Davi R (1)', this.selected);
    });
    
    // Start button - position it based on screen height for better responsiveness
    const buttonY = Math.min(screenHeight * 0.65, 380); // Lower position - 65% of screen height, capped at 380px
    
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
