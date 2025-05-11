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
import wsManager from './websocket_manager';

class PlayerSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PlayerSelectScene' });
    console.log('PlayerSelectScene constructor called');
    // Character sprite keys for mapping
    this.CHARACTER_KEYS = ['player1', 'player2', 'player3', 'player4', 'player5', 'player6', 'player7', 'player8'];
    this.selected = { p1: 'player1', p2: 'player2' }; // Default selections using sprite keys
  }
  
  init(data) {
    // Reset selections when scene is restarted
    console.log('[PlayerSelectScene] Init called, resetting selections');
    // Character sprite keys for mapping
    this.CHARACTER_KEYS = ['player1', 'player2', 'player3', 'player4', 'player5', 'player6', 'player7', 'player8'];
    
    // For online mode, always set Bento (player1) as the initial player for both players
    if (data && data.mode === 'online') {
      this.selected = { p1: 'player1', p2: 'player1' }; // Bento for both players in online mode
    } else {
      // For local mode, use the provided selections or defaults
      const p1Selection = typeof data?.p1 === 'number' ? this.CHARACTER_KEYS[data.p1] : data?.p1 || 'player1';
      const p2Selection = typeof data?.p2 === 'number' ? this.CHARACTER_KEYS[data.p2] : data?.p2 || 'player2';
      this.selected = { p1: p1Selection, p2: p2Selection };
    }
    this.selectedScenario = data && data.scenario ? data.scenario : 'scenario1';
    this.scenarioKey = this.selectedScenario; // Store scenario key for KidsFightScene
    this.gameMode = data && data.mode ? data.mode : 'local'; // Store game mode
    
    // For online mode, store host status and setup WebSocket handlers
    if (this.gameMode === 'online') {
      this.isHost = data.isHost;
      console.log('[PlayerSelectScene] Online mode initialized:', {
        isHost: this.isHost,
        roomCode: data.roomCode
      });
      
      // Setup WebSocket handlers for character selection
      const ws = wsManager.ws;
      if (ws) {
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          console.log('[PlayerSelectScene] Received websocket message:', data);
          
          switch(data.type) {
            case 'character_selected':
              // Update opponent's character
              const playerKey = data.playerNum === 1 ? 'p1' : 'p2';
              const characterKey = this.CHARACTER_KEYS[data.character];
              this.selected[playerKey] = characterKey;
              console.log('[PlayerSelectScene] Updated character selection:', {
                playerNum: data.playerNum,
                characterIndex: data.character,
                characterKey,
                selected: this.selected
              });
              break;
              
            case 'scenario_selected':
              // Update scenario selection (only client receives this from host)
              if (!this.isHost && data.scenario) {
                console.log('[PlayerSelectScene] Host selected scenario:', data.scenario);
                this.scenarioKey = data.scenario;
                
                // If we have a scenario info text, update it
                if (this.scenarioInfoText) {
                  const scenarioName = this.getScenarioName(this.scenarioKey);
                  this.scenarioInfoText.setText(`Cenário: ${scenarioName}`);
                } else {
                  // Create a scenario info text if it doesn't exist
                  const { width, height } = this.cameras.main;
                  this.scenarioInfoText = this.add.text(width/2, height * 0.75, `Cenário: ${this.getScenarioName(this.scenarioKey)}`, {
                    fontSize: '18px',
                    fill: '#ffffff',
                    backgroundColor: '#333333',
                    padding: { x: 10, y: 5 }
                  }).setOrigin(0.5);
                }
              }
              break;
              
            case 'error':
              console.error('[PlayerSelectScene] Error:', data.message);
              break;
          }
        };
      }
    }
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
    // Add solid background first
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    const bg = this.add.rectangle(w/2, h/2, w, h, 0x222222, 1);
    
    // Create the scene immediately since assets are already loaded in preload()
    this.createScene();
  }

  createScene() {

    // Log screen dimensions for debugging
    const cam = this.cameras.main;
    const screenWidth = cam.width;
    const screenHeight = cam.height;
    console.log(`[PlayerSelectScene] Create called - Screen dimensions: ${screenWidth}x${screenHeight}`);
    
    // Responsive background and logo
    const bg = this.add.rectangle(screenWidth / 2, screenHeight / 2, screenWidth, screenHeight, 0x000000, 0.7);
    this.logo = this.add.image(cam.centerX, screenHeight * 0.19, 'game_logo').setOrigin(0.5).setScale(0.65).setAlpha(0.93);
    // Responsive logo centering on resize/orientation
    this.scale.on('resize', () => {
      if (this.logo && this.cameras && this.cameras.main) {
        const cam = this.cameras.main;
        this.logo.setPosition(cam.centerX, cam.height * 0.19);
        bg.setPosition(cam.width / 2, cam.height / 2);
        bg.displayWidth = cam.width;
        bg.displayHeight = cam.height;
      }
    });

    // Responsive title
    this.titleText = this.add.text(cam.centerX, screenHeight * 0.08, 'ESCOLHA SEUS LUTADORES', {
      fontSize: Math.round(Math.max(24, Math.min(40, screenWidth * 0.05))) + 'px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Responsive player labels
    this.p1Label = this.add.text(screenWidth * 0.23, screenHeight * 0.23, 'JOGADOR 1', { fontSize: '24px', fill: '#ff0000', fontStyle: 'bold', backgroundColor: 'rgba(0,0,0,0.18)' }).setOrigin(0.5).setAlpha(0.9);
    this.p2Label = this.add.text(screenWidth * 0.77, screenHeight * 0.23, 'JOGADOR 2', { fontSize: '24px', fill: '#0000ff', fontStyle: 'bold', backgroundColor: 'rgba(0,0,0,0.18)' }).setOrigin(0.5).setAlpha(0.9);

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
    const cols = 4;
    // X positions: 4 columns, offset blocks with 8% shift
    const avatarSpacing = screenWidth * 0.08;
    const blockWidth = avatarSpacing * (cols - 1);
    const centerX = screenWidth / 2;
    const middleGap = screenWidth * 0.12;
    // Offset: Player 1 block 8% left, Player 2 block 8% right
    const p1BlockCenter = centerX - middleGap - screenWidth * 0.08;
    const p2BlockCenter = centerX + middleGap + screenWidth * 0.08;
    const p1FaceX = Array.from({length: 4}, (_, i) => p1BlockCenter - blockWidth / 2 + i * avatarSpacing);
    const p2FaceX = Array.from({length: 4}, (_, i) => p2BlockCenter - blockWidth / 2 + i * avatarSpacing);
    // Y positions: two rows, responsive
    const faceY1 = screenHeight * 0.38;
    const faceY2 = screenHeight * 0.52;
    const frameW = 250; // adjust if needed
    const frameH = 350; // adjust if needed (should match your spritesheet frame height)
    const cropH = frameH / 1.3;
    const cropY = 15; // move crop area just a little bit further up
    const faceOffsetY = 18; // move player images down inside the circles
    
    // Character sprite keys for mapping
    const CHARACTER_KEYS = ['player1', 'player2', 'player3', 'player4', 'player5', 'player6', 'player7', 'player8'];
    
    // Player 1 faces
    const p1FaceBGs = [];
    const p1Options = [];
    // First row (indices 0-3)
    for (let i = 0; i < 4; i++) {
      p1FaceBGs.push(this.add.circle(p1FaceX[i], faceY1, faceRadius, 0x222222));
      let s1 = this.add.sprite(p1FaceX[i], faceY1 + faceOffsetY, CHARACTER_KEYS[i], 0).setScale(0.18);
      s1.setCrop(0, cropY, frameW, cropH);
      p1Options.push(s1);
    }
    // Second row (indices 4-7)
    for (let i = 0; i < 4; i++) {
      p1FaceBGs.push(this.add.circle(p1FaceX[i], faceY2, faceRadius, 0x222222));
      let s2 = this.add.sprite(p1FaceX[i], faceY2 + faceOffsetY, CHARACTER_KEYS[i+4], 0).setScale(0.18);
      s2.setCrop(0, cropY, frameW, cropH);
      p1Options.push(s2);
    }

    // Player 2 faces
    const p2FaceBGs = [];
    const p2Options = [];
    // First row (indices 0-3)
    for (let i = 0; i < 4; i++) {
      p2FaceBGs.push(this.add.circle(p2FaceX[i], faceY1, faceRadius, 0x222222));
      let s1 = this.add.sprite(p2FaceX[i], faceY1 + faceOffsetY, CHARACTER_KEYS[i], 0).setScale(0.18);
      s1.setCrop(0, cropY, frameW, cropH);
      p2Options.push(s1);
    }
    // Second row (indices 4-7)
    for (let i = 0; i < 4; i++) {
      p2FaceBGs.push(this.add.circle(p2FaceX[i], faceY2, faceRadius, 0x222222));
      let s2 = this.add.sprite(p2FaceX[i], faceY2 + faceOffsetY, CHARACTER_KEYS[i+4], 0).setScale(0.18);
      s2.setCrop(0, cropY, frameW, cropH);
      p2Options.push(s2);
    }
    
    // Responsive player names
    const playerNames = ['Bento', 'Davi R', 'José', 'Davi S', 'Carol', 'Roni', 'Jacque', 'Ivan'];
    const nameStyle = {
      fontSize: Math.round(Math.max(12, Math.min(18, screenWidth * 0.025))) + 'px',
      fill: '#ffffff',
      fontStyle: 'bold',
      align: 'center',
      backgroundColor: 'rgba(0,0,0,0.35)'
    };
    const nameYOffset = 22;
    for (let i = 0; i < 4; i++) {
      this.add.text(p1FaceX[i], faceY1 + nameYOffset, playerNames[i], nameStyle).setOrigin(0.5).setAlpha(0.8);
      this.add.text(p1FaceX[i], faceY2 + nameYOffset, playerNames[i+4], nameStyle).setOrigin(0.5).setAlpha(0.8);
    }
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
      // In online mode, only host can select P1
      if (this.gameMode !== 'online' || this.isHost) {
        option.setInteractive();
        option.on('pointerdown', () => {
          // The index in p1Options array directly maps to the character index (0-7)
          this.selected.p1 = CHARACTER_KEYS[i];
          console.log('[PlayerSelectScene] P1 selected:', i, CHARACTER_KEYS[i]);
          this.p1Selector.setPosition(option.x, option.y - faceOffsetY);
          
          if (this.gameMode === 'online') {
            // Send selection to server
            wsManager.send({
              type: 'character_selected',
              character: i,
              playerNum: 1
            });
          }
        });
      } else {
        console.log('DEBUG: Calling setAlpha on option', option);
option.setAlpha(0.5); // Dim opponent's options
      }
    }
    
    for (let i = 0; i < p2Options.length; i++) {
      const option = p2Options[i];
      // In online mode, only client can select P2
      if (this.gameMode !== 'online' || !this.isHost) {
        option.setInteractive();
        option.on('pointerdown', () => {
          // The index in p2Options array directly maps to the character index (0-7)
          this.selected.p2 = CHARACTER_KEYS[i];
          console.log('[PlayerSelectScene] P2 selected:', i, CHARACTER_KEYS[i]);
          this.p2Selector.setPosition(option.x, option.y - faceOffsetY);
          
          if (this.gameMode === 'online') {
            // Send selection to server
            wsManager.send({
              type: 'character_selected',
              character: i,
              playerNum: 2
            });
          }
        });
      } else {
        console.log('DEBUG: Calling setAlpha on option', option);
option.setAlpha(0.5); // Dim opponent's options
      }
    }
    
    // Start button and scenario button configuration
    const buttonW = Math.max(180, Math.min(0.9 * screenWidth, 320));
    const buttonH = 70;
    const margin = 24;
    const buttonY = screenHeight - buttonH / 2 - margin;
    
    // Calculate area available for avatars/options above the button
    const avatarBottomLimit = buttonY - buttonH / 2 - margin;
    
    // Display scenario info text for online mode
    if (this.gameMode === 'online' && this.isHost) {
      console.log('[PlayerSelectScene] Creating scenario info text for host');
      // We'll select the scenario after player selection
      this.scenarioText = this.add.text(this.cameras.main.width * 0.5, this.cameras.main.height * 0.65, 
        'Você escolherá o cenário após selecionar os personagens', {
        fontSize: '18px',
        fill: '#ffffff',
        fontStyle: 'bold',
        backgroundColor: '#000000',
        padding: { x: 10, y: 5 }
      }).setOrigin(0.5);
    }
    
    // Move the start button and text a bit to the left
    const buttonX = cam.centerX - 18;
    const startBtn = this.add.rectangle(buttonX, buttonY, buttonW, buttonH, 0x00ff00)
      .setStrokeStyle(4, 0x000000); // Add black border for better visibility
    const startText = this.add.text(buttonX, buttonY, 'COMEÇAR LUTA!', {
      fontSize: Math.max(18, Math.min(24, Math.round(screenWidth * 0.06))) + 'px', // Responsive font size
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
    
    // Update all positions on resize
    this.scale.on('resize', () => {
      const cam = this.cameras.main;
      const screenWidth = cam.width;
      const screenHeight = cam.height;
      bg.setPosition(screenWidth / 2, screenHeight / 2);
      bg.displayWidth = screenWidth;
      bg.displayHeight = screenHeight;
      this.logo.setPosition(cam.centerX, screenHeight * 0.19);
      this.titleText.setPosition(cam.centerX, screenHeight * 0.08);
      this.p1Label.setPosition(screenWidth * 0.23, screenHeight * 0.23);
      this.p2Label.setPosition(screenWidth * 0.77, screenHeight * 0.23);
      // Offset blocks with 8% shift
      const avatarSpacing = screenWidth * 0.08;
      const cols = 4;
      const blockWidth = avatarSpacing * (cols - 1);
      const centerX = screenWidth / 2;
      const middleGap = screenWidth * 0.12;
      const p1BlockCenter = centerX - middleGap - screenWidth * 0.08;
      const p2BlockCenter = centerX + middleGap + screenWidth * 0.08;
      const p1FaceX = Array.from({length: 4}, (_, i) => p1BlockCenter - blockWidth / 2 + i * avatarSpacing);
      const p2FaceX = Array.from({length: 4}, (_, i) => p2BlockCenter - blockWidth / 2 + i * avatarSpacing);
      const faceY1 = screenHeight * 0.38;
      const faceY2 = screenHeight * 0.52;
      for (let i = 0; i < 4; i++) {
        p1FaceBGs[i*2].setPosition(p1FaceX[i], faceY1);
        p1Options[i*2].setPosition(p1FaceX[i], faceY1 + faceOffsetY);
        p1FaceBGs[i*2+1].setPosition(p1FaceX[i], faceY2);
        p1Options[i*2+1].setPosition(p1FaceX[i], faceY2 + faceOffsetY);
        p2FaceBGs[i*2].setPosition(p2FaceX[i], faceY1);
        p2Options[i*2].setPosition(p2FaceX[i], faceY1 + faceOffsetY);
        p2FaceBGs[i*2+1].setPosition(p2FaceX[i], faceY2);
        p2Options[i*2+1].setPosition(p2FaceX[i], faceY2 + faceOffsetY);
      }
      // Optionally update player names if you store references
    });
  }
  
  startFight() {
    // In online mode, use the ready system
    if (this.gameMode === 'online') {
      // If host, first select scenario before proceeding
      if (this.isHost) {
        console.log('[PlayerSelectScene] Host selecting scenario before starting fight');
        
        // Launch scenario selection scene
        this.scene.pause();
        this.scene.launch('ScenarioSelectScene', {
          p1: this.CHARACTER_KEYS.indexOf(this.selected.p1),
          p2: this.CHARACTER_KEYS.indexOf(this.selected.p2),
          fromPlayerSelect: true,
          onlineMode: true
        });
        
        // Listen for scenario selection
        this.events.once('resume', (scene, data) => {
          if (data && data.scenario) {
            console.log('[PlayerSelectScene] Received scenario selection from ScenarioSelectScene:', data.scenario);
            this.scenarioKey = data.scenario;
            
            // Send scenario selection to the other player
            console.log('[PlayerSelectScene] Sending scenario_selected message to other player:', data.scenario);
            wsManager.send({
              type: 'scenario_selected',
              scenario: data.scenario
            });
            
            // Continue with the normal fight start process
            this.continueStartFight();
          }
        });
        
        return; // Exit here, we'll continue after scenario selection
      }
      
      // For non-host or after scenario selection, continue with normal process
      this.continueStartFight();
    } else {
      // Start immediately in local mode
      this.launchGame();
    }
  }
  
  continueStartFight() {
    // Send our character selection
    // Get character index from the key (e.g., 'player1' -> 0)
    const myChar = this.isHost ? this.selected.p1 : this.selected.p2;
    const charIndex = this.CHARACTER_KEYS.indexOf(myChar);
    const playerNum = this.isHost ? 1 : 2;
    wsManager.send({
      type: 'character_selected',
      character: charIndex,
      playerNum: playerNum
    });
    console.log('[PlayerSelectScene] Sending character selection:', {
      charKey: myChar,
      charIndex,
      playerNum
    });
    
    // Show waiting message
    this.waitingText = this.add.text(
      this.cameras.main.width * 0.5,
      this.cameras.main.height * 0.8,
      'Waiting for both players to be ready...',
      {
        fontSize: '18px',
        color: '#ffff00',
        fontFamily: 'monospace',
        backgroundColor: '#000000',
        padding: { x: 10, y: 5 }
      }
    ).setOrigin(0.5).setDepth(100);
    
    // Send player ready message to server
    wsManager.send({
      type: 'player_ready',
      character: charIndex
    });
    console.log('[PlayerSelectScene] Sending player ready message');
    
    // Set up handler for start_game message
    const originalOnMessage = wsManager.ws.onmessage;
    wsManager.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[PlayerSelectScene] Received message:', data);
        
        if (data.type === 'start_game') {
          console.log('[PlayerSelectScene] Received start_game message, starting game');
          
          // Update scenario if provided in the start_game message
          if (data.scenario) {
            console.log('[PlayerSelectScene] Using scenario from start_game message:', data.scenario);
            this.scenarioKey = data.scenario;
          }
          
          // Add a visual indicator that we received the start_game message
          const startGameText = this.add.text(
            this.cameras.main.width * 0.5,
            this.cameras.main.height * 0.7,
            'START GAME RECEIVED! LAUNCHING...',
            {
              fontSize: '24px',
              color: '#00ff00',
              fontFamily: 'monospace',
              backgroundColor: '#000000',
              padding: { x: 10, y: 5 }
            }
          ).setOrigin(0.5).setDepth(100);
          
          // Launch the game after a short delay to ensure the message is visible
          this.time.delayedCall(500, () => {
            this.launchGame();
          });
        } else if (data.type === 'player_ready') {
          console.log('[PlayerSelectScene] Other player is ready');
          if (this.waitingText) {
            this.waitingText.setText('Other player is ready! Starting game soon...');
            this.waitingText.setColor('#00ff00');
          }
          
          // Add a visual indicator that we received the player_ready message
          const readyText = this.add.text(
            this.cameras.main.width * 0.5,
            this.cameras.main.height * 0.7,
            `PLAYER ${data.player} IS READY!`,
            {
              fontSize: '20px',
              color: '#ffff00',
              fontFamily: 'monospace',
              backgroundColor: '#000000',
              padding: { x: 10, y: 5 }
            }
          ).setOrigin(0.5).setDepth(100);
          
          // Remove the text after a short delay
          this.time.delayedCall(2000, () => {
            readyText.destroy();
          });
        } else if (originalOnMessage) {
          // Pass other messages to the original handler
          originalOnMessage(event);
        }
      } catch (error) {
        console.error('[PlayerSelectScene] Error processing message:', error);
      }
    };
    
    // Add a debug button to manually trigger the start game
    if (this.gameMode === 'online') {
      const debugButton = this.add.text(
        this.cameras.main.width * 0.5,
        this.cameras.main.height * 0.9,
        'DEBUG: FORCE START GAME',
        {
          fontSize: '16px',
          color: '#ff0000',
          fontFamily: 'monospace',
          backgroundColor: '#000000',
          padding: { x: 10, y: 5 }
        }
      ).setOrigin(0.5).setDepth(100).setInteractive();
      
      debugButton.on('pointerdown', () => {
        console.log('[PlayerSelectScene] Debug button clicked, forcing game start');
        this.launchGame();
      });
    }
  }
  
  launchGame() {
    console.log('[PlayerSelectScene] Starting fight with:', {
      p1: this.selected.p1,
      p2: this.selected.p2,
      isHost: this.isHost
    });
    
    // Start the KidsFightScene with character keys
    const p1Index = this.CHARACTER_KEYS.indexOf(this.selected.p1);
    const p2Index = this.CHARACTER_KEYS.indexOf(this.selected.p2);
    this.scene.start('KidsFightScene', {
      p1: this.selected.p1,
      p2: this.selected.p2,
      p1Index,
      p2Index,
      scenario: this.scenarioKey,
      mode: this.gameMode,
      isHost: this.isHost
    });
  }

  // Helper method to get scenario name from scenario key
  getScenarioName(scenarioKey) {
    const names = {
      'scenario1': 'Parque',
      'scenario2': 'Praia',
      'scenario3': 'Escola',
      'scenario4': 'Quintal'
    };
    return names[scenarioKey] || scenarioKey;
  }
}

export default PlayerSelectScene;
