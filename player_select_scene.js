import scenarioImg from './scenario1.png';
import player1RawImg from './sprites-bento3.png';
import player2RawImg from './sprites-davir3.png';
import player3RawImg from './sprites-jose3.png';
import player4RawImg from './sprites-davis3.png';
import player5RawImg from './sprites-carol3.png';
import player6RawImg from './sprites-roni3.png';
import player7RawImg from './sprites-jacqueline3.png';
import player8RawImg from './sprites-ivan3.png';

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
    this.load.image('player5_raw', player5RawImg);
    this.load.image('player6_raw', player6RawImg);
    this.load.image('player7_raw', player7RawImg);
    this.load.image('player8_raw', player8RawImg);
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
    
    // Player 5 (Carol) Spritesheet
    if (!this.textures.exists('player5')) {
      console.log('[PlayerSelectScene] Creating player5 spritesheet');
      const frameWidths = [300, 300, 400, 460, 500, 400, 400, 400];
      const frameHeight = 512;
      const player5Texture = this.textures.get('player5_raw').getSourceImage();
      this.textures.addSpriteSheet('player5', player5Texture, {
        frameWidth: 400,
        frameHeight: frameHeight,
        startFrame: 0,
        endFrame: frameWidths.length - 1
      });
      const tex = this.textures.get('player5');
      tex.frames = { __BASE: tex.frames['__BASE'] };
      let x = 0;
      for (let i = 0; i < frameWidths.length; i++) {
        tex.add(i, 0, x, 0, frameWidths[i], frameHeight);
        x += frameWidths[i];
      }
    }
    
    // Player 6 (Roni) Spritesheet
    if (!this.textures.exists('player6')) {
      console.log('[PlayerSelectScene] Creating player6 spritesheet');
      const frameWidths = [300, 300, 400, 460, 500, 400, 400, 400];
      const frameHeight = 512;
      const player6Texture = this.textures.get('player6_raw').getSourceImage();
      this.textures.addSpriteSheet('player6', player6Texture, {
        frameWidth: 400,
        frameHeight: frameHeight,
        startFrame: 0,
        endFrame: frameWidths.length - 1
      });
      const tex = this.textures.get('player6');
      tex.frames = { __BASE: tex.frames['__BASE'] };
      let x = 0;
      for (let i = 0; i < frameWidths.length; i++) {
        tex.add(i, 0, x, 0, frameWidths[i], frameHeight);
        x += frameWidths[i];
      }
    }
    
    // Player 7 (Jacqueline) Spritesheet
    if (!this.textures.exists('player7')) {
      console.log('[PlayerSelectScene] Creating player7 spritesheet');
      const frameWidths = [300, 300, 400, 460, 500, 400, 400, 400];
      const frameHeight = 512;
      const player7Texture = this.textures.get('player7_raw').getSourceImage();
      this.textures.addSpriteSheet('player7', player7Texture, {
        frameWidth: 400,
        frameHeight: frameHeight,
        startFrame: 0,
        endFrame: frameWidths.length - 1
      });
      const tex = this.textures.get('player7');
      tex.frames = { __BASE: tex.frames['__BASE'] };
      let x = 0;
      for (let i = 0; i < frameWidths.length; i++) {
        tex.add(i, 0, x, 0, frameWidths[i], frameHeight);
        x += frameWidths[i];
      }
    }
    
    // Player 8 (Ivan) Spritesheet
    if (!this.textures.exists('player8')) {
      console.log('[PlayerSelectScene] Creating player8 spritesheet');
      const frameWidths = [300, 300, 400, 460, 500, 400, 400, 400];
      const frameHeight = 512;
      const player8Texture = this.textures.get('player8_raw').getSourceImage();
      this.textures.addSpriteSheet('player8', player8Texture, {
        frameWidth: 400,
        frameHeight: frameHeight,
        startFrame: 0,
        endFrame: frameWidths.length - 1
      });
      const tex = this.textures.get('player8');
      tex.frames = { __BASE: tex.frames['__BASE'] };
      let x = 0;
      for (let i = 0; i < frameWidths.length; i++) {
        tex.add(i, 0, x, 0, frameWidths[i], frameHeight);
        x += frameWidths[i];
      }
    }
    
    // Create player sprites for selection - with space between player 1 and player 2 groups
    // Player 1 options - First row (4 players)
    const p1Option1 = this.add.sprite(80, 220, 'player1', 0).setScale(0.15);
    const p1Option2 = this.add.sprite(150, 220, 'player2', 0).setScale(0.15);
    const p1Option3 = this.add.sprite(220, 220, 'player3', 0).setScale(0.15);
    const p1Option4 = this.add.sprite(290, 220, 'player4', 0).setScale(0.15);
    // Player 1 options - Second row (4 players)
    const p1Option5 = this.add.sprite(80, 290, 'player5', 0).setScale(0.15);
    const p1Option6 = this.add.sprite(150, 290, 'player6', 0).setScale(0.15);
    const p1Option7 = this.add.sprite(220, 290, 'player7', 0).setScale(0.15);
    const p1Option8 = this.add.sprite(290, 290, 'player8', 0).setScale(0.15);
    
    // Player 2 options - First row (4 players)
    const p2Option1 = this.add.sprite(510, 220, 'player1', 0).setScale(0.15);
    const p2Option2 = this.add.sprite(580, 220, 'player2', 0).setScale(0.15);
    const p2Option3 = this.add.sprite(650, 220, 'player3', 0).setScale(0.15);
    const p2Option4 = this.add.sprite(720, 220, 'player4', 0).setScale(0.15);
    // Player 2 options - Second row (4 players)
    const p2Option5 = this.add.sprite(510, 290, 'player5', 0).setScale(0.15);
    const p2Option6 = this.add.sprite(580, 290, 'player6', 0).setScale(0.15);
    const p2Option7 = this.add.sprite(650, 290, 'player7', 0).setScale(0.15);
    const p2Option8 = this.add.sprite(720, 290, 'player8', 0).setScale(0.15);
    
    // Add player names
    const nameStyle = {
      fontSize: '16px',
      fill: '#ffffff',
      fontStyle: 'bold'
    };
    
    // Player 1 names - First row
    this.add.text(80, 255, 'Bento', nameStyle).setOrigin(0.5);
    this.add.text(150, 255, 'Davi R', nameStyle).setOrigin(0.5);
    this.add.text(220, 255, 'José', nameStyle).setOrigin(0.5);
    this.add.text(290, 255, 'Davi S', nameStyle).setOrigin(0.5);
    // Player 1 names - Second row
    this.add.text(80, 325, 'Carol', nameStyle).setOrigin(0.5);
    this.add.text(150, 325, 'Roni', nameStyle).setOrigin(0.5);
    this.add.text(220, 325, 'Jacqueline', nameStyle).setOrigin(0.5);
    this.add.text(290, 325, 'Ivan', nameStyle).setOrigin(0.5);
    
    // Player 2 names - First row
    this.add.text(510, 255, 'Bento', nameStyle).setOrigin(0.5);
    this.add.text(580, 255, 'Davi R', nameStyle).setOrigin(0.5);
    this.add.text(650, 255, 'José', nameStyle).setOrigin(0.5);
    this.add.text(720, 255, 'Davi S', nameStyle).setOrigin(0.5);
    // Player 2 names - Second row
    this.add.text(510, 325, 'Carol', nameStyle).setOrigin(0.5);
    this.add.text(580, 325, 'Roni', nameStyle).setOrigin(0.5);
    this.add.text(650, 325, 'Jacqueline', nameStyle).setOrigin(0.5);
    this.add.text(720, 325, 'Ivan', nameStyle).setOrigin(0.5);
    
    // Make options interactive
    p1Option1.setInteractive();
    p1Option2.setInteractive();
    p1Option3.setInteractive();
    p1Option4.setInteractive();
    p1Option5.setInteractive();
    p1Option6.setInteractive();
    p1Option7.setInteractive();
    p1Option8.setInteractive();
    p2Option1.setInteractive();
    p2Option2.setInteractive();
    p2Option3.setInteractive();
    p2Option4.setInteractive();
    p2Option5.setInteractive();
    p2Option6.setInteractive();
    p2Option7.setInteractive();
    p2Option8.setInteractive();
    
    // Add selection indicators - store them as class properties so we can access them in other methods
    // Smaller selection indicators to match smaller sprites
    this.p1Selector = this.add.rectangle(80, 220, 70, 70).setStrokeStyle(4, 0xffff00).setFillStyle();
    this.p2Selector = this.add.rectangle(510, 220, 70, 70).setStrokeStyle(4, 0xffff00).setFillStyle();
    
    // Add click handlers
    p1Option1.on('pointerdown', () => {
      this.selected.p1 = 0;
      this.p1Selector.setPosition(80, 220);
      console.log('[PlayerSelectScene] Player 1 selected Bento (0)', this.selected);
    });
    
    p1Option2.on('pointerdown', () => {
      this.selected.p1 = 1;
      this.p1Selector.setPosition(150, 220);
      console.log('[PlayerSelectScene] Player 1 selected Davi R (1)', this.selected);
    });
    
    p1Option3.on('pointerdown', () => {
      this.selected.p1 = 2;
      this.p1Selector.setPosition(220, 220);
      console.log('[PlayerSelectScene] Player 1 selected José (2)', this.selected);
    });
    
    p1Option4.on('pointerdown', () => {
      this.selected.p1 = 3;
      this.p1Selector.setPosition(290, 220);
      console.log('[PlayerSelectScene] Player 1 selected Davi S (3)', this.selected);
    });
    
    p1Option5.on('pointerdown', () => {
      this.selected.p1 = 4;
      this.p1Selector.setPosition(100, 290);
      console.log('[PlayerSelectScene] Player 1 selected Carol (4)', this.selected);
    });
    
    p1Option6.on('pointerdown', () => {
      this.selected.p1 = 5;
      this.p1Selector.setPosition(185, 290);
      console.log('[PlayerSelectScene] Player 1 selected Roni (5)', this.selected);
    });
    
    p1Option7.on('pointerdown', () => {
      this.selected.p1 = 6;
      this.p1Selector.setPosition(220, 290);
      console.log('[PlayerSelectScene] Player 1 selected Jacqueline (6)', this.selected);
    });
    
    p1Option8.on('pointerdown', () => {
      this.selected.p1 = 7;
      this.p1Selector.setPosition(290, 290);
      console.log('[PlayerSelectScene] Player 1 selected Ivan (7)', this.selected);
    });
    
    p2Option1.on('pointerdown', () => {
      this.selected.p2 = 0;
      this.p2Selector.setPosition(510, 220);
      console.log('[PlayerSelectScene] Player 2 selected Bento (0)', this.selected);
    });
    
    p2Option2.on('pointerdown', () => {
      this.selected.p2 = 1;
      this.p2Selector.setPosition(580, 220);
      console.log('[PlayerSelectScene] Player 2 selected Davi R (1)', this.selected);
    });
    
    p2Option3.on('pointerdown', () => {
      this.selected.p2 = 2;
      this.p2Selector.setPosition(650, 220);
      console.log('[PlayerSelectScene] Player 2 selected José (2)', this.selected);
    });
    
    p2Option4.on('pointerdown', () => {
      this.selected.p2 = 3;
      this.p2Selector.setPosition(720, 220);
      console.log('[PlayerSelectScene] Player 2 selected Davi S (3)', this.selected);
    });
    
    p2Option5.on('pointerdown', () => {
      this.selected.p2 = 4;
      this.p2Selector.setPosition(530, 290);
      console.log('[PlayerSelectScene] Player 2 selected Carol (4)', this.selected);
    });
    
    p2Option6.on('pointerdown', () => {
      this.selected.p2 = 5;
      this.p2Selector.setPosition(615, 290);
      console.log('[PlayerSelectScene] Player 2 selected Roni (5)', this.selected);
    });
    
    p2Option7.on('pointerdown', () => {
      this.selected.p2 = 6;
      this.p2Selector.setPosition(650, 290);
      console.log('[PlayerSelectScene] Player 2 selected Jacqueline (6)', this.selected);
    });
    
    p2Option8.on('pointerdown', () => {
      this.selected.p2 = 7;
      this.p2Selector.setPosition(720, 290);
      console.log('[PlayerSelectScene] Player 2 selected Ivan (7)', this.selected);
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
