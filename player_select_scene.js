import scenarioImg from './scenario1.png';
import player1RawImg from './sprites-bento3.png';
import player2RawImg from './sprites-davir3.png';
import player3RawImg from './sprites-jose3.png';
import player4RawImg from './sprites-davis3.png';
import player5RawImg from './sprites-carol3.png';
import player6RawImg from './sprites-roni3.png';
import player7RawImg from './sprites-jacqueline3.png';
import player8RawImg from './sprites-ivan3.png';
import gameLogoImg from './android-chrome-192x192.png';

class PlayerSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PlayerSelectScene' });
    console.log('PlayerSelectScene constructor called');
    this.selected = { p1: 0, p2: 1 }; // Default selections
  }
  
  init(data) {
    // Reset selections when scene is restarted
    console.log('[PlayerSelectScene] Init called, resetting selections');
    this.selected = { p1: 0, p2: 1 };
    this.selectedScenario = data && data.scenario ? data.scenario : 'scenario1';
    this.scenarioKey = this.selectedScenario; // Store scenario key for KidsFightScene
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
    this.load.image('game_logo', gameLogoImg);
    console.log('[PlayerSelectScene] Assets queued for loading');
  }
  
  create() {
    // Log screen dimensions for debugging
    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;
    console.log(`[PlayerSelectScene] Create called - Screen dimensions: ${screenWidth}x${screenHeight}`);
    
    // Create a simple background
    const bg = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.7);
    
    // --- LOGO ---
    this.logo = this.add.image(this.cameras.main.centerX, 175, 'game_logo').setOrigin(0.5).setScale(0.65).setAlpha(0.93);
    
    // Responsive logo centering on resize/orientation
    this.scale.on('resize', () => {
      if (this.logo && this.cameras && this.cameras.main) {
        this.logo.setPosition(this.cameras.main.centerX, 175);
      }
    });
    
    // Add title text at the very top
    this.add.text(400, 40, 'ESCOLHA SEUS LUTADORES', {
      fontSize: '32px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Move 'Jogador 1' and 'Jogador 2' labels up, keeping their original colors
    this.add.text(180, 120, 'JOGADOR 1', { fontSize: '24px', fill: '#ff0000', fontStyle: 'bold', backgroundColor: 'rgba(0,0,0,0.18)' }).setOrigin(0.5).setAlpha(0.9);
    this.add.text(620, 120, 'JOGADOR 2', { fontSize: '24px', fill: '#0000ff', fontStyle: 'bold', backgroundColor: 'rgba(0,0,0,0.18)' }).setOrigin(0.5).setAlpha(0.9);
    
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
    
    // Create player face-only sprites for selection - crop to top half of first frame
    const faceRadius = 32; // Circle button radius
    const p1FaceX = [80, 150, 220, 290];
    const p2FaceX = [510, 580, 650, 720];
    const faceY1 = 170;
    const faceY2 = 230;
    const frameW = 250; // adjust if needed
    const frameH = 350; // adjust if needed (should match your spritesheet frame height)
    const cropH = frameH / 1.3;
    const cropY = 15; // move crop area just a little bit further up
    const faceOffsetY = 18; // move player images down inside the circles
    
    // Player 1 faces
    const p1FaceBGs = [];
    const p1Options = [];
    for (let i = 0; i < 4; i++) {
      p1FaceBGs.push(this.add.circle(p1FaceX[i], faceY1, faceRadius, 0x222222));
      let s1 = this.add.sprite(p1FaceX[i], faceY1 + faceOffsetY, `player${i+1}`, 0).setScale(0.18);
      s1.setCrop(0, cropY, frameW, cropH);
      p1Options.push(s1);
      p1FaceBGs.push(this.add.circle(p1FaceX[i], faceY2, faceRadius, 0x222222));
      let s2 = this.add.sprite(p1FaceX[i], faceY2 + faceOffsetY, `player${i+5}`, 0).setScale(0.18);
      s2.setCrop(0, cropY, frameW, cropH);
      p1Options.push(s2);
    }
    // Player 2 faces
    const p2FaceBGs = [];
    const p2Options = [];
    for (let i = 0; i < 4; i++) {
      p2FaceBGs.push(this.add.circle(p2FaceX[i], faceY1, faceRadius, 0x222222));
      let s1 = this.add.sprite(p2FaceX[i], faceY1 + faceOffsetY, `player${i+1}`, 0).setScale(0.18);
      s1.setCrop(0, cropY, frameW, cropH);
      p2Options.push(s1);
      p2FaceBGs.push(this.add.circle(p2FaceX[i], faceY2, faceRadius, 0x222222));
      let s2 = this.add.sprite(p2FaceX[i], faceY2 + faceOffsetY, `player${i+5}`, 0).setScale(0.18);
      s2.setCrop(0, cropY, frameW, cropH);
      p2Options.push(s2);
    }
    
    // Player names for both rows, in the middle of the circle with transparency
    const playerNames = ['Bento', 'Davi R', 'José', 'Davi S', 'Carol', 'Roni', 'Jacque', 'Ivan'];
    const nameStyle = {
      fontSize: '14px',
      fill: '#ffffff',
      fontStyle: 'bold',
      align: 'center',
      backgroundColor: 'rgba(0,0,0,0.35)'
    };
    const nameYOffset = 22; // move names a little bit more down
    // Player 1 names
    for (let i = 0; i < 4; i++) {
      this.add.text(p1FaceX[i], faceY1 + nameYOffset, playerNames[i], nameStyle).setOrigin(0.5).setAlpha(0.8);
      this.add.text(p1FaceX[i], faceY2 + nameYOffset, playerNames[i+4], nameStyle).setOrigin(0.5).setAlpha(0.8);
    }
    // Player 2 names
    for (let i = 0; i < 4; i++) {
      this.add.text(p2FaceX[i], faceY1 + nameYOffset, playerNames[i], nameStyle).setOrigin(0.5).setAlpha(0.8);
      this.add.text(p2FaceX[i], faceY2 + nameYOffset, playerNames[i+4], nameStyle).setOrigin(0.5).setAlpha(0.8);
    }
    
    // Make options interactive
    for (let i = 0; i < p1Options.length; i++) {
      p1Options[i].setInteractive();
      p2Options[i].setInteractive();
    }
    
    // Add selection indicators - store them as class properties so we can access them in other methods
    // Smaller selection indicators to match smaller sprites
    this.p1Selector = this.add.circle(p1FaceX[0], faceY1, faceRadius + 6, 0xffff00, 0.18).setStrokeStyle(4, 0xffff00);
    this.p2Selector = this.add.circle(p2FaceX[0], faceY1, faceRadius + 6, 0x0000ff, 0.18).setStrokeStyle(4, 0x0000ff);
    
    // Add click handlers
    for (let i = 0; i < p1Options.length; i++) {
      const option = p1Options[i];
      option.setInteractive();
      option.on('pointerdown', () => {
        this.selected.p1 = i;
        this.p1Selector.setPosition(option.x, option.y - faceOffsetY);
        console.log('[PlayerSelectScene] Player 1 selected', this.selected);
      });
    }
    
    for (let i = 0; i < p2Options.length; i++) {
      const option = p2Options[i];
      option.setInteractive();
      option.on('pointerdown', () => {
        this.selected.p2 = i;
        this.p2Selector.setPosition(option.x, option.y - faceOffsetY);
        console.log('[PlayerSelectScene] Player 2 selected', this.selected);
      });
    }
    
    // Start button - always place near the bottom, centered, responsive width
    const cam = this.cameras.main;
    const centerX = cam.centerX;
    const screenW = cam.width;
    const screenH = cam.height;
    const buttonW = Math.max(180, Math.min(0.9 * screenW, 320));
    const buttonH = 70;
    const margin = 24;
    const buttonY = screenH - buttonH / 2 - margin;
    
    // Calculate area available for avatars/options above the button
    const avatarBottomLimit = buttonY - buttonH / 2 - margin;
    // Example: Adjust a top margin and grid height for avatars/options
    // (Assume avatars/options are laid out using a Y offset or grid height variable)
    // If you have a variable like gridTop or gridHeight, set it here:
    // const gridTop = Math.max(40, avatarBottomLimit - desiredGridHeight);
    // If you use fixed Y positions for avatars, clamp them:
    // For each avatar/option: y = Math.min(originalY, avatarBottomLimit - avatarHeight/2)
    // (You may need to adapt this depending on your actual layout code)
    
    // Move the start button and text a bit to the left (e.g., 18px)
    const buttonX = centerX - 18;
    const startBtn = this.add.rectangle(buttonX, buttonY, buttonW, buttonH, 0x00ff00)
      .setStrokeStyle(4, 0x000000); // Add black border for better visibility
    const startText = this.add.text(buttonX, buttonY, 'COMEÇAR LUTA!', {
      fontSize: Math.max(18, Math.min(24, Math.round(screenW * 0.06))) + 'px', // Responsive font size
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
      this.startFight();
    });
    
    console.log('[PlayerSelectScene] UI created');
  }
  
  startFight() {
    // Instead of starting KidsFightScene, go to ScenarioSelectScene again
    this.scene.start('ScenarioSelectScene', {
      p1: this.selected.p1,
      p2: this.selected.p2
    });
  }
}

export default PlayerSelectScene;
