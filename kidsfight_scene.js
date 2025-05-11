// Utility: Detect if the screen is in landscape orientation
export function isLandscape() {
  // In test, window may not exist
  if (typeof window === 'undefined') return true;
  return window.innerWidth > window.innerHeight;
}

// Extracted: Utility to stretch a background image to fill a given area
export function stretchBackgroundToFill(bg, width, height) {
  if (!bg) return;
  bg.displayWidth = width;
  bg.displayHeight = height;
}

import scenario1Img from './scenario1.png';
import scenario2Img from './scenario2.png';
import player1RawImg from './sprites-bento3.png';
import player2RawImg from './sprites-davir3.png';
import player3RawImg from './sprites-jose3.png';
import player4RawImg from './sprites-davis3.png';
import player5RawImg from './sprites-carol3.png';
import player6RawImg from './sprites-roni3.png';
import player7RawImg from './sprites-jacqueline3.png';
import player8RawImg from './sprites-ivan3.png';
import wsManager from './websocket_manager';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 480;
const MAX_HEALTH = 100;
const PLAYER_SPEED = 200;
const JUMP_VELOCITY = -400;
const GRAVITY = 900;
const ROUND_TIME = 60;
const ATTACK_COOLDOWN = 500; // 500ms cooldown between attacks
const SPECIAL_COOLDOWN = 2000; // 2s cooldown between special attacks
const LUNGE_COOLDOWN = 1000; // 1s cooldown between lunges
const ATTACK_DAMAGE = 10;
const SPECIAL_DAMAGE = 20;
const LUNGE_DAMAGE = 15;
const PLATFORM_Y = GAME_HEIGHT - 100;
const PLATFORM_HEIGHT = 20;

// Accept Phaser as a constructor parameter for testability
class KidsFightScene extends (typeof Phaser !== 'undefined' && Phaser.Scene ? Phaser.Scene : class {}) {
  // Helper method to get character name from sprite key
  getCharacterName(spriteKey) {
    switch(spriteKey) {
      case 'player1': return 'Bento';
      case 'player2': return 'Davi R';
      case 'player3': return 'José';
      case 'player4': return 'Davi S';
      case 'player5': return 'Carol';
      case 'player6': return 'Roni';
      case 'player7': return 'Jacqueline';
      case 'player8': return 'Ivan';
      default: return 'Jogador';
    }
  }
  // --- EFFECTS: Special Effect Helper (Phaser 3.60+ workaround) ---
  showSpecialEffect(x, y, count = 30) {
    if (!this.specialEffect) return;
    this.specialEffect.clear();
    this.specialEffect.setVisible(true);
    this.specialEffect.setAlpha(1);
    this.specialEffect.setScale(1);
    this.specialEffect.lineStyle(8, 0x00eaff, 0.7);
    this.specialEffect.strokeCircle(x, y, 20);
    this.tweens.add({
      targets: this.specialEffect,
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      duration: 350,
      onComplete: () => {
        this.specialEffect.clear();
        this.specialEffect.setVisible(false);
        this.specialEffect.setAlpha(1);
        this.specialEffect.setScale(1);
      }
    });
  }

  constructor() {
    super('KidsFightScene');
    this.lastAttackTime = [0, 0];
    this.attackCount = [0, 0]; // Counts normal attacks landed by each player
    this.lungeTimer = [0, 0]; // Initialize lunge timers for both players
    this.timeLeft = 60;
    this.player1State = 'idle';
// console.log('[DEBUG] player1State set to:', this.player1State); // 'idle', 'down', 'attack', 'special'
    this.player2State = 'idle';
    // // console.log('[constructor] timeLeft:', this.timeLeft, 'ROUND_TIME:', typeof ROUND_TIME !== 'undefined' ? ROUND_TIME : 'undefined');
  }

  init(data) {
    console.log('[KidsFightScene] Init called with data:', data);
    if (!data || !data.p1 || !data.p2) {
      console.log('[KidsFightScene] Missing player data:', data);
    }
    // Convert numeric indices to character keys if needed
    const CHARACTER_KEYS = ['player1', 'player2', 'player3', 'player4', 'player5', 'player6', 'player7', 'player8'];
    if (typeof data?.p1 === 'number') {
      data.p1 = CHARACTER_KEYS[data.p1];
    }
    if (typeof data?.p2 === 'number') {
      data.p2 = CHARACTER_KEYS[data.p2];
    }
    
    this.selected = {
      p1: data?.p1 || 'player1',
      p2: data?.p2 || 'player2'
    };
    this.selectedScenario = data?.scenario || 'scenario1';
    this.gameMode = data?.mode || 'local';
    this.p1SpriteKey = this.selected.p1;
    this.p2SpriteKey = this.selected.p2;
    
    // For online mode
    if (this.gameMode === 'online') {
      this.isHost = data.isHost;
    }
  }

  preload() {
    console.log('[KidsFightScene] Preloading assets...');
    this.load.image('scenario1', scenario1Img);
    this.load.image('scenario2', scenario2Img);
    this.load.image('player1_raw', player1RawImg);
    this.load.image('player2_raw', player2RawImg);
    this.load.image('player3_raw', player3RawImg);
    this.load.image('player4_raw', player4RawImg);
    this.load.image('player5_raw', player5RawImg);
    this.load.image('player6_raw', player6RawImg);
    this.load.image('player7_raw', player7RawImg);
    this.load.image('player8_raw', player8RawImg);
    // Load scenario background
    //this.load.image('scenario1', scenario1Img);
    //this.load.image('scenario2', scenario2Img);
    // Load particle spritesheet for effects
    //this.load.atlas('flares', 'flares.png', 'flares.json');
  }

  create() {
    window.scene = this;
    
    // For online mode, determine which player we control
    if (this.gameMode === 'online') {
      this.localPlayerIndex = this.isHost ? 0 : 1; // 0 for p1, 1 for p2
    }

    // --- RESET ALL GAME STATE ON RESTART ---
    this.gameOver = false;
    this.player1State = 'idle';
    this.player2State = 'idle';
    this.lastAttackTime = [0, 0];
    this.attackCount = [0, 0];
    this.lungeTimer = [0, 0];
    this.timeLeft = 60;
    this.playerHealth = [MAX_HEALTH, MAX_HEALTH];
    this.players = [];
    
    // Create platforms
    this.platforms = this.physics.add.staticGroup();
    
    // Add main platform
    const ground = this.add.rectangle(400, 450, 800, 60, 0x00ff00);
    this.platforms.add(ground);
    
    // Create player sprites with the selected character sprites
    console.log('[KidsFightScene] Creating players with sprites:', { p1: this.p1SpriteKey, p2: this.p2SpriteKey });
    
    // Make sure we have valid sprite keys
    if (!this.p1SpriteKey || !this.p2SpriteKey) {
      console.error('[KidsFightScene] Missing sprite keys:', { p1: this.p1SpriteKey, p2: this.p2SpriteKey });
      this.p1SpriteKey = 'player1';
      this.p2SpriteKey = 'player2';
    }
    
    const player1 = this.physics.add.sprite(200, 300, this.p1SpriteKey);
    const player2 = this.physics.add.sprite(600, 300, this.p2SpriteKey);
    this.players = [player1, player2];
    
    // Initialize keyboard controls
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyF = this.input.keyboard.addKey('F');
    this.keyE = this.input.keyboard.addKey('E');
    this.keyShift = this.input.keyboard.addKey('SHIFT');

    // Setup WebSocket for online mode
    if (this.gameMode === 'online') {
      this.wsManager = wsManager;
      this.wsManager.isHost = this.isHost;
      
      // Add debug info text
      this.debugInfoText = this.add.text(
        10, 
        this.cameras.main.height - 150, 
        'WebSocket Debug Info:\nWaiting for actions...', 
        {
          fontSize: '14px',
          color: '#ffffff',
          backgroundColor: '#000000',
          padding: { x: 5, y: 5 }
        }
      ).setScrollFactor(0).setDepth(1000);
      
      // CRITICAL FIX: Set up WebSocket message handler
      if (wsManager.ws) {
        console.log('[CRITICAL] Setting up WebSocket message handler in KidsFightScene');
        
        // Store the original onmessage handler if it exists
        const originalOnMessage = wsManager.ws.onmessage;
        
        wsManager.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('[CRITICAL] KidsFightScene received WebSocket message:', data);
            
            if (data.type === 'game_action') {
              console.log('[CRITICAL] Received game action:', data.action);
              this.handleRemoteAction(data.action);
            } else if (data.type === 'player_disconnected') {
              this.handleDisconnection();
            }
          } catch (error) {
            console.error('[CRITICAL] Error handling WebSocket message:', error);
          }
        };
      } else {
        console.error('[CRITICAL] WebSocket not initialized in KidsFightScene');
      }
    }

    // Add game mode indicator
    if (this.gameMode === 'online') {
      const modeText = this.add.text(
        this.cameras.main.width * 0.5,
        30,
        'Modo Online',
        {
          fontSize: '20px',
          color: '#00ff00',
          fontFamily: 'monospace'
        }
      ).setOrigin(0.5);

      // Make it glow
      modeText.setStroke('#004400', 4);
      this.tweens.add({
        targets: modeText,
        alpha: 0.6,
        duration: 1000,
        yoyo: true,
        repeat: -1
      });
      
      // Add test button to manually trigger a remote action
      const testButton = this.add.text(
        this.cameras.main.width * 0.5,
        60,
        '[ TEST SYNC ]',
        {
          fontSize: '16px',
          color: '#ff0000',
          backgroundColor: '#000000',
          padding: { x: 10, y: 5 },
          fontFamily: 'monospace'
        }
      ).setOrigin(0.5).setInteractive();
      
      testButton.on('pointerdown', () => {
        console.log('[DEBUG] Test button clicked, sending test action');
        // Force send a test action
        if (wsManager.isConnected()) {
          wsManager.send({
            type: 'game_action',
            action: { type: 'test_sync', timestamp: Date.now() }
          });
          console.log('[DEBUG] Test sync action sent');
        } else {
          console.error('[DEBUG] WebSocket not connected, cannot send test action');
        }
      });
    }
    // console.log('[DEBUG] create() this:', this, 'scene key:', this.sys && this.sys.settings && this.sys.settings.key);
    // --- CREATE CUSTOM SPRITESHEETS FIRST ---
    // Player 1 Spritesheet
    if (!this.textures.exists('player1')) {
      console.log('[KidsFightScene] Creating player1 spritesheet');
      const frameWidths = [300, 300, 430, 580, 580, 440, 440, 440];
      const frameHeight = 512;
      const player1Texture = this.textures.get('player1_raw').getSourceImage();
      this.textures.addSpriteSheet('player1', player1Texture, {
        frameWidth: 430,
        frameHeight: frameHeight,
        startFrame: 0,
        endFrame: frameWidths.length - 1
      });
      const tex = this.textures.get('player1');
      tex.frames = { __BASE: tex.frames['__BASE'] };
      let x = 0;
      for (let i = 0; i < frameWidths.length; i++) {
        tex.add(i, 0, x, 0, frameWidths[i], frameHeight);
        x += frameWidths[i];
      }
    }

    // Player 2 Spritesheet
    if (!this.textures.exists('player2')) {
      console.log('[KidsFightScene] Creating player2 spritesheet');
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

    // Player 3 (José) Spritesheet
    if (!this.textures.exists('player3')) {
      console.log('[KidsFightScene] Creating player3 spritesheet');
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

    // Player 4 (Davi S) Spritesheet
    if (!this.textures.exists('player4')) {
      console.log('[KidsFightScene] Creating player4 spritesheet');
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
      console.log('[KidsFightScene] Creating player5 spritesheet');
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
      console.log('[KidsFightScene] Creating player6 spritesheet');
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
      console.log('[KidsFightScene] Creating player7 spritesheet');
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
      console.log('[KidsFightScene] Creating player8 spritesheet');
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
    // Add background image

    // --- MOBILE SIDE PADDING FOR CONTROLS ---
    let leftPad = 0, rightPad = 0, playAreaWidth = GAME_WIDTH;
    if (this.isTouch) {
      leftPad = Math.round(GAME_WIDTH * 0.15);
      rightPad = Math.round(GAME_WIDTH * 0.15);
      playAreaWidth = GAME_WIDTH - leftPad - rightPad;
    }

    const scenarioKey = this.selectedScenario || 'scenario1';
    const cam = this.cameras.main;
    const bg = this.add.image(cam.width / 2, cam.height / 2, scenarioKey).setOrigin(0.5, 0.5);
    // Squeeze/stretch scenario to fill the entire visible area (ignore aspect ratio)
    stretchBackgroundToFill(bg, cam.width, cam.height);
    // Ensure world and camera bounds match the visible area (for mobile/responsive)
    // Always use the full screen for camera and world bounds (prevents cropping)
    this.physics.world.setBounds(0, 0, cam.width, cam.height);
    cam.setBounds(0, 0, cam.width, cam.height);
    // --- TOUCH CONTROLS ---
    this.touchControls = { p1: {}, p2: {} };
    // --- KEYBOARD CONTROLS ---
    // Always initialize keyboard keys and cursors
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      a: 'A', d: 'D', w: 'W',
      v: 'V', b: 'B', n: 'N', s: 'S',
      k: 'K', l: 'L', semicolon: 'SEMICOLON'
    });
    // Robust touch detection (works on iOS and all browsers)
    const debugAlwaysShowTouch = false; // set to true to force show for debugging
    this.isTouch = debugAlwaysShowTouch || (typeof window !== 'undefined' && (
      (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
      ('ontouchstart' in window)
    ));
    if (this.isTouch) {
      const w = cam.width;
      const h = cam.height;
      // Player 1 (left side) - relative positions
      this.touchControls.p1.left = this.add.rectangle(0, 0, 48, 48, 0x444444, 0.7).setInteractive().setDepth(9999);
      this.touchControls.p1.right = this.add.rectangle(0, 0, 48, 48, 0x444444, 0.7).setInteractive().setDepth(9999);
      this.touchControls.p1.jump = this.add.rectangle(0, 0, 48, 48, 0x888888, 0.7).setInteractive().setDepth(9999);
      this.touchControls.p1.down = this.add.rectangle(0, 0, 48, 48, 0x888888, 0.7).setInteractive().setDepth(9999);
      this.touchControls.p1.attack = this.add.circle(0, 0, 30, 0xff4444, 0.8).setInteractive().setDepth(9999);
      this.touchControls.p1.special = this.add.circle(0, 0, 30, 0xffd700, 0.8).setInteractive().setDepth(9999);
      // Player 2 (right side) - relative positions
      this.touchControls.p2.left = this.add.rectangle(0, 0, 48, 48, 0x444444, 0.7).setInteractive().setDepth(9999);
      this.touchControls.p2.right = this.add.rectangle(0, 0, 48, 48, 0x444444, 0.7).setInteractive().setDepth(9999);
      this.touchControls.p2.jump = this.add.rectangle(0, 0, 48, 48, 0x888888, 0.7).setInteractive().setDepth(9999);
      this.touchControls.p2.down = this.add.rectangle(0, 0, 48, 48, 0x888888, 0.7).setInteractive().setDepth(9999);
      this.touchControls.p2.attack = this.add.circle(0, 0, 30, 0x44aaff, 0.8).setInteractive().setDepth(9999);
      this.touchControls.p2.special = this.add.circle(0, 0, 30, 0xffd700, 0.8).setInteractive().setDepth(9999);
      // Touch flags
      this.touchFlags = { p1: {left:false,right:false,jump:false,down:false,attack:false,special:false}, p2: {left:false,right:false,jump:false,down:false,attack:false,special:false} };
      // Setup touch events for all buttons
      const setupBtn = (btn, flagObj, flag) => {
        btn.on('pointerdown', (e)=>{flagObj[flag]=true; if (e && e.stopPropagation) e.stopPropagation(); console.log('[TOUCH] pointerdown', flag);});
        btn.on('pointerup', (e)=>{flagObj[flag]=false; if (e && e.stopPropagation) e.stopPropagation(); console.log('[TOUCH] pointerup', flag);});
        btn.on('pointerout', (e)=>{flagObj[flag]=false; if (e && e.stopPropagation) e.stopPropagation(); console.log('[TOUCH] pointerout', flag);});
        btn.on('pointerupoutside', (e)=>{flagObj[flag]=false; if (e && e.stopPropagation) e.stopPropagation(); console.log('[TOUCH] pointerupoutside', flag);});
      };
      Object.entries(this.touchControls.p1).forEach(([k,btn])=>setupBtn(btn, this.touchFlags.p1, k));
      Object.entries(this.touchControls.p2).forEach(([k,btn])=>setupBtn(btn, this.touchFlags.p2, k));
      // Add icons/labels (also relative)
      this.touchLabels = [];
      this.touchLabels.push(this.add.text(0, 0, '<', {fontSize:'24px',color:'#fff'}).setDepth(10000));
      this.touchLabels.push(this.add.text(0, 0, '>', {fontSize:'24px',color:'#fff'}).setDepth(10000));
      this.touchLabels.push(this.add.text(0, 0, '^', {fontSize:'24px',color:'#fff'}).setDepth(10000));
      this.touchLabels.push(this.add.text(0, 0, 'v', {fontSize:'24px',color:'#fff'}).setDepth(10000));
      this.touchLabels.push(this.add.text(0, 0, 'A', {fontSize:'24px',color:'#fff'}).setDepth(10000));
      this.touchLabels.push(this.add.text(0, 0, 'S', {fontSize:'24px',color:'#222'}).setDepth(10000));
      this.touchLabels.push(this.add.text(0, 0, '<', {fontSize:'24px',color:'#fff'}).setDepth(10000));
      this.touchLabels.push(this.add.text(0, 0, '>', {fontSize:'24px',color:'#fff'}).setDepth(10000));
      this.touchLabels.push(this.add.text(0, 0, '^', {fontSize:'24px',color:'#fff'}).setDepth(10000));
      this.touchLabels.push(this.add.text(0, 0, 'v', {fontSize:'24px',color:'#fff'}).setDepth(10000));
      this.touchLabels.push(this.add.text(0, 0, 'A', {fontSize:'24px',color:'#fff'}).setDepth(10000));
      this.touchLabels.push(this.add.text(0, 0, 'S', {fontSize:'24px',color:'#222'}).setDepth(10000));
      // Immediately position all touch labels
      this.updateControlPositions();
    }


    // --- EFFECTS ---
    // Hit flash effect for attacks
    this.hitFlash = this.add.graphics({ x: 0, y: 0 }).setDepth(999);
    this.hitFlash.setVisible(false);
    // Particle system and emitter for special attacks
    // Simple custom effect for special attacks (Phaser 3.60+ workaround)
    this.specialEffect = this.add.graphics({ x: 0, y: 0 }).setDepth(998);
    this.specialEffect.setVisible(false);



  // --- EFFECTS ---
  // --- PLAYER SPAWN LOGIC (moved from orphaned code) ---
  const playerSprites = ['player1', 'player2', 'player3', 'player4', 'player5', 'player6', 'player7', 'player8'];
  // Responsive player scale based on height (target ~38% of screen height)
  const scale = (GAME_HEIGHT * 0.38) / 512;
  const frameHeight = 512;
  const player1FrameWidths = [300, 300, 430, 580, 580, 440, 440, 440];

  // Align player feet to the ground (bottom of the screen)
  const frameWidth = player1FrameWidths[0];
  const bodyWidth = frameWidth * scale;
  const bodyHeight = frameHeight * scale;
  // player.y is the center, so set: playerY = GAME_HEIGHT - (this.textures.get('player1').getSourceImage().height * scale) / 2;
// But we can use the actual sprite height after creation for precision
  // Responsive platform position and height
  const PLATFORM_Y = GAME_HEIGHT * 0.7; // 70% down the screen (lower for desktop)
  const PLATFORM_HEIGHT = GAME_HEIGHT * 0.045; // 4.5% of screen height
  // Add background image

  // Draw the platform rectangle above the background
  const platformRect = this.add.rectangle(GAME_WIDTH / 2, PLATFORM_Y + PLATFORM_HEIGHT / 2, GAME_WIDTH, PLATFORM_HEIGHT, 0x8B5A2B).setDepth(2).setVisible(false);
  // Add static physics body for the platform
  const platform = this.physics.add.staticGroup();
  platform.create(GAME_WIDTH / 2, PLATFORM_Y + PLATFORM_HEIGHT / 2, null)
    .setDisplaySize(GAME_WIDTH, PLATFORM_HEIGHT)
    .setVisible(false)
    .refreshBody();
  this.platform = platform;

  // --- DEFENSIVE: Ensure valid selected and sprite keys ---
  console.log('[KidsFightScene] Selected data received:', this.selected);

  // Use character keys from data
  const CHARACTER_KEYS = ['player1', 'player2', 'player3', 'player4', 'player5', 'player6', 'player7', 'player8'];
  let p1Key = this.selected?.p1 || 'player1';
  let p2Key = this.selected?.p2 || 'player2';
  
  // Ensure character keys are strings and valid
  if (typeof p1Key !== 'string' || !this.textures.exists(p1Key)) {
    console.error('[KidsFightScene] Invalid p1Key:', p1Key);
    p1Key = 'player1';
    this.selected.p1 = 'player1';
  }
  if (typeof p2Key !== 'string' || !this.textures.exists(p2Key)) {
    console.error('[KidsFightScene] Invalid p2Key:', p2Key);
    p2Key = 'player2';
    this.selected.p2 = 'player2';
  }

  console.log('[KidsFightScene] Using sprite keys:', { p1Key, p2Key });

  // Store the selected keys for later use in animations
  this.p1SpriteKey = p1Key;
  this.p2SpriteKey = p2Key;

  // Store if players selected the same character (for tinting)
  this.sameCharacterSelected = p1Key === p2Key;

  console.log('[KidsFightScene] Using sprite keys:', { p1Key, p2Key });
  console.log('[KidsFightScene] Same character selected:', this.sameCharacterSelected);
  const PLAYER_PLATFORM_OFFSET = 20;
  // Responsive player spawn positions
  const p1X = GAME_WIDTH * 0.25;
  const p2X = GAME_WIDTH * 0.75;
  const playerY = PLATFORM_Y + PLAYER_PLATFORM_OFFSET;
  this.player1 = this.physics.add.sprite(p1X, playerY, p1Key, 0);
  this.player1.setScale(scale);
  this.player1.setOrigin(0.5, 1); // bottom center
  this.player1.body.setSize(this.player1.displayWidth, this.player1.displayHeight);
  this.player1.body.setOffset(0, 0);

  // Apply red tint to Player 1 if both players selected the same character
  if (this.sameCharacterSelected) {
    this.player1.setTint(0xff9999); // Light red tint
  }

  // Enable collision with platform
  this.physics.add.collider(this.player1, platform);
  this.player1.setCollideWorldBounds(true);
  this.player1.setBounce(0.1);
  this.player1.facing = 1;

  this.player2 = this.physics.add.sprite(p2X, playerY, p2Key, 0);
  this.player2.setScale(scale);
  this.player2.setOrigin(0.5, 1); // bottom center
  this.player2.body.setSize(this.player2.displayWidth, this.player2.displayHeight);
  this.player2.body.setOffset(0, 0);

  // Apply blue tint to Player 2 if both players selected the same character
  if (this.sameCharacterSelected) {
    this.player2.setTint(0x9999ff); // Light blue tint
  }
  


  // Enable collision with platform
  this.physics.add.collider(this.player2, platform);
  this.player2.setCollideWorldBounds(true);
  this.player2.setBounce(0.1);
  this.player2.facing = -1;
  this.player2.setFlipX(true); // Invert horizontally

    // Player 1 Animations (custom frames)
    // Create or recreate p1 animations with the correct sprite key
    // We need to recreate these animations each time to use the correct sprite key
    console.log('[KidsFightScene] Creating animations for P1 with sprite key:', this.p1SpriteKey);

    // First check if the sprite key exists
    if (!this.textures.exists(this.p1SpriteKey)) {
      console.error(`[KidsFightScene] Sprite key ${this.p1SpriteKey} does not exist!`);
      // Fall back to player1 if the selected sprite doesn't exist
      this.p1SpriteKey = 'player1';
    }

    const p1AnimKey = 'p1_idle_' + this.p1SpriteKey;
    if (this.anims.exists(p1AnimKey)) {
      this.anims.remove(p1AnimKey);
    }
    this.anims.create({
      key: p1AnimKey,
      frames: [{ key: this.p1SpriteKey, frame: 0 }],
      frameRate: 1,
      repeat: -1
    });
    // Create or recreate p1_walk animation
    const p1WalkKey = 'p1_walk_' + this.p1SpriteKey;
    if (this.anims.exists(p1WalkKey)) {
      this.anims.remove(p1WalkKey);
    }
    this.anims.create({
      key: p1WalkKey,
      frames: [
        { key: this.p1SpriteKey, frame: 1 },
        { key: this.p1SpriteKey, frame: 2 }
      ],
      frameRate: 6,
      repeat: -1
    });

    // Create or recreate p1_attack animation
    const p1AttackKey = 'p1_attack_' + this.p1SpriteKey;
    if (this.anims.exists(p1AttackKey)) {
      this.anims.remove(p1AttackKey);
    }
    this.anims.create({
      key: p1AttackKey,
      frames: [{ key: this.p1SpriteKey, frame: 4 }], // Use frame 4 for hit
      frameRate: 1,
      repeat: 0,
      duration: 200 // Show hit frame for 200ms
    });

    // Create or recreate p1_special animation
    const p1SpecialKey = 'p1_special_' + this.p1SpriteKey;
    if (this.anims.exists(p1SpecialKey)) {
      this.anims.remove(p1SpecialKey);
    }
    this.anims.create({
      key: p1SpecialKey,
      frames: [{ key: this.p1SpriteKey, frame: 6 }], // Use frame 6 for special
      frameRate: 1,
      repeat: 0,
      duration: 900 // Show special frame for 900ms
    });

    // Create or recreate p1_down animation
    const p1DownKey = 'p1_down_' + this.p1SpriteKey;
    if (this.anims.exists(p1DownKey)) {
      this.anims.remove(p1DownKey);
    }
    this.anims.create({
      key: p1DownKey,
      frames: [{ key: this.p1SpriteKey, frame: 5 }], // Use 6th image (index 5)
      frameRate: 1,
      repeat: -1
    });

    // Player 2 Animations (custom frames)
    // Create or recreate p2 animations with the correct sprite key
    console.log('[KidsFightScene] Creating animations for P2 with sprite key:', this.p2SpriteKey);

    // First check if the sprite key exists
    if (!this.textures.exists(this.p2SpriteKey)) {
      console.error(`[KidsFightScene] Sprite key ${this.p2SpriteKey} does not exist!`);
      // Fall back to player2 if the selected sprite doesn't exist
      this.p2SpriteKey = 'player2';
    }

    const p2AnimKey = 'p2_idle_' + this.p2SpriteKey;
    if (this.anims.exists(p2AnimKey)) {
      this.anims.remove(p2AnimKey);
    }
    this.anims.create({
      key: p2AnimKey,
      frames: [{ key: this.p2SpriteKey, frame: 0 }],
      frameRate: 1,
      repeat: -1
    });
    // Create or recreate p2_walk animation
    const p2WalkKey = 'p2_walk_' + this.p2SpriteKey;
    if (this.anims.exists(p2WalkKey)) {
      this.anims.remove(p2WalkKey);
    }
    this.anims.create({
      key: p2WalkKey,
      frames: [
        { key: this.p2SpriteKey, frame: 1 },
        { key: this.p2SpriteKey, frame: 2 }
      ],
      frameRate: 6,
      repeat: -1
    });

    // Create or recreate p2_attack animation
    const p2AttackKey = 'p2_attack_' + this.p2SpriteKey;
    if (this.anims.exists(p2AttackKey)) {
      this.anims.remove(p2AttackKey);
    }
    this.anims.create({
      key: p2AttackKey,
      frames: [{ key: this.p2SpriteKey, frame: 4 }], // Use frame 4 for hit
      frameRate: 1,
      repeat: 0,
      duration: 200 // Show hit frame for 200ms
    });

    // Create or recreate p2_down animation
    const p2DownKey = 'p2_down_' + this.p2SpriteKey;
    if (this.anims.exists(p2DownKey)) {
      this.anims.remove(p2DownKey);
    }
    this.anims.create({
      key: p2DownKey,
      frames: [{ key: this.p2SpriteKey, frame: 5 }], // Use 6th image (index 5)
      frameRate: 1,
      repeat: -1
    });

    // Create or recreate p2_special animation
    const p2SpecialKey = 'p2_special_' + this.p2SpriteKey;
    if (this.anims.exists(p2SpecialKey)) {
      this.anims.remove(p2SpecialKey);
    }
    this.anims.create({
      key: p2SpecialKey,
      frames: [{ key: this.p2SpriteKey, frame: 6 }], // Use frame 6 for special
      frameRate: 1,
      repeat: 0,
      duration: 900 // Show special frame for 900ms
    });
    // Play the correct animations for each player using the dynamic animation keys
    this.player1.play('p1_idle_' + this.p1SpriteKey);
    this.player1.angle = 0;
    this.player2.angle = 0;
    if (!this.gameOver) this.player2.play('p2_idle_' + this.p2SpriteKey);

    console.log('[KidsFightScene] Playing animations:', {
      p1: 'p1_idle_' + this.p1SpriteKey,
      p2: 'p2_idle_' + this.p2SpriteKey
    });
    // Reset loser y offset (in case of rematch)
    this.playerY = playerY; // Store globally for use in endGame
    // Store original Y for laying down math
    this.player1._originalY = this.player1.y;
    this.player2._originalY = this.player2.y;

    // Animation complete: return to idle after attack
    // (Replaced by manual timer for attack/special)
    // this.player1.on('animationcomplete', ...)
    // this.player2.on('animationcomplete', ...)

    // Collisions
    this.physics.add.collider(this.player1, this.floatPlatform);
    this.physics.add.collider(this.player2, this.floatPlatform);

    // Controls
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      a: 'A', d: 'D', w: 'W', // P1 movement
      v: 'V', b: 'B', n: 'N', s: 'S', // P1: V = attack, B = special, N/S = down/crouch
      k: 'K', l: 'L', semicolon: 'SEMICOLON'
    });
    // Defensive: ensure all keys exist even if not mapped
    const keyList = ['a','d','w','v','b','n','s','k','l','semicolon'];
    for (const k of keyList) {
      if (!this.keys[k]) this.keys[k] = { isDown: false };
    }
    // Debug: log at end of create()
    // console.log('[DEBUG] create() called, this.keys:', this.keys);
    // Global keydown debug (disable for touch)
    if (!this.isTouch) {
      window.addEventListener('keydown', function(e) {
        // console.log('[GLOBAL] Key pressed:', e.key, 'code:', e.code);
      });
    }

    // Health bars
    this.healthBar1Border = this.add.rectangle(200, 30, 204, 24, 0xffffff).setOrigin(0.5);
    this.healthBar2Border = this.add.rectangle(600, 30, 204, 24, 0xffffff).setOrigin(0.5);
    this.healthBar1Border.setStrokeStyle(2, 0x000000);
    this.healthBar2Border.setStrokeStyle(2, 0x000000);
    this.healthBar1 = this.add.rectangle(200, 30, 200, 20, 0xff4444);
    this.healthBar2 = this.add.rectangle(600, 30, 200, 20, 0x44aaff);
    this.healthBar1.setOrigin(0.5);
    this.healthBar2.setOrigin(0.5);
    this.children.bringToTop(this.healthBar1);
    this.children.bringToTop(this.healthBar2);

    // --- SPECIAL HIT CIRCLES (PIPS) ---
    // Player 1 special pips (left, above health bar)
    this.specialPips1 = [];
    for (let i = 0; i < 3; i++) {
      const pip = this.add.circle(140 + i * 30, 16, 10, 0x888888, 0.8).setStrokeStyle(2, 0x000).setDepth(10);
      pip.setVisible(true);
      this.specialPips1.push(pip);
    }
    // Player 2 special pips (right, above health bar)
    this.specialPips2 = [];
    for (let i = 0; i < 3; i++) {
      const pip = this.add.circle(540 + i * 30, 16, 10, 0x888888, 0.8).setStrokeStyle(2, 0x000).setDepth(10);
      pip.setVisible(true);
      this.specialPips2.push(pip);
    }
    // Ensure all pips are reset to gray and visible
    this.specialPips1.forEach(pip => pip.setFillStyle(0x888888).setVisible(true));
    this.specialPips2.forEach(pip => pip.setFillStyle(0x888888).setVisible(true));
    // Hide special ready circles
    if (this.specialReady1) this.specialReady1.setVisible(false);
    if (this.specialReadyText1) this.specialReadyText1.setVisible(false);
    if (this.specialReady2) this.specialReady2.setVisible(false);
    if (this.specialReadyText2) this.specialReadyText2.setVisible(false);

    // --- SPECIAL READY CIRCLE (BIG S) ---
    // Player 1
    this.specialReady1 = this.add.circle(200, 60, 22, 0xffd700, 0.93).setStrokeStyle(3, 0x000).setDepth(15).setVisible(false);
    this.specialReadyText1 = this.add.text(200, 60, 'S', { fontSize: '26px', color: '#000', fontFamily: 'monospace', fontStyle: 'bold' }).setOrigin(0.5).setDepth(16).setVisible(false);
    // Player 2
    this.specialReady2 = this.add.circle(600, 60, 22, 0xffd700, 0.93).setStrokeStyle(3, 0x000).setDepth(15).setVisible(false);
    this.specialReadyText2 = this.add.text(600, 60, 'S', { fontSize: '26px', color: '#000', fontFamily: 'monospace', fontStyle: 'bold' }).setOrigin(0.5).setDepth(16).setVisible(false);

    // Fight state and countdown
    this.fightStarted = false;
    this.countdownValue = 3;
    
    // Timer text display
    this.timerText = this.add.text(
      this.cameras.main.width / 2,
      50,
      'PRONTOS?', {
        fontSize: '32px', color: '#fff', fontFamily: 'monospace', align: 'center', stroke: '#000', strokeThickness: 4
      }
    )
      .setOrigin(0.5);
      
    // Add a very prominent test sync button for debugging
    if (this.gameMode === 'online') {
      const testSyncButton = this.add.text(
        this.cameras.main.width / 2,
        this.cameras.main.height - 100,
        '[ TEST SYNC BUTTON ]',
        {
          fontSize: '24px',
          color: '#ffffff',
          backgroundColor: '#ff0000',
          padding: { x: 20, y: 10 },
          fontFamily: 'monospace'
        }
      ).setOrigin(0.5).setInteractive().setDepth(9999);
      
      testSyncButton.on('pointerdown', () => {
        console.log('[DEBUG] Test sync button clicked!');
        if (wsManager && wsManager.isConnected && wsManager.isConnected()) {
          console.log('[DEBUG] WebSocket is connected, sending test sync action');
          wsManager.send({
            type: 'game_action',
            action: { type: 'test_sync', timestamp: Date.now() }
          });
          
          // Update debug info
          if (this.debugInfoText) {
            this.debugInfoText.setText(`Last Action: test_sync\nTimestamp: ${Date.now()}\nHost: ${this.isHost ? 'Yes' : 'No'}\nPlayer Index: ${this.localPlayerIndex}`);
          }
        } else {
          console.error('[DEBUG] WebSocket is not connected!');
          
          // Update debug info
          if (this.debugInfoText) {
            this.debugInfoText.setText('WebSocket NOT CONNECTED!\nCheck console for errors');
          }
        }
      });
      
      // Add on-screen debug information
      this.debugInfoText = this.add.text(
        10, 
        this.cameras.main.height - 150,
        `WebSocket: ${wsManager && wsManager.isConnected && wsManager.isConnected() ? 'Connected' : 'Disconnected'}\nHost: ${this.isHost ? 'Yes' : 'No'}\nPlayer Index: ${this.localPlayerIndex}\nNo actions yet`,
        {
          fontSize: '16px',
          color: '#ffff00',
          backgroundColor: '#000000',
          padding: { x: 5, y: 5 },
          fontFamily: 'monospace'
        }
      ).setDepth(9999);
    }
    
    // Start countdown after a short delay
    this.time.delayedCall(1000, () => {
      const countdownInterval = setInterval(() => {
        this.countdownValue--;
        if (this.countdownValue > 0) {
          this.timerText.setText(this.countdownValue);
        } else if (this.countdownValue === 0) {
          this.timerText.setText('LUTEM!');
          this.time.delayedCall(1000, () => {
            this.fightStarted = true;
            this.lastTimerUpdate = this.time.now;
            this.timerText.setText(Math.ceil(this.timeLeft));
          });
          clearInterval(countdownInterval);
        }
      }, 1000);
    });

    // Mark scene as ready so updateSceneLayout can safely run
    this.isReady = true;

    // --- FINAL updateSceneLayout ---
    if (typeof this.updateSceneLayout === 'function') {
      console.log('[KidsFight] Calling updateSceneLayout at end of create');
      this.updateSceneLayout();
    }

    // Listen for Phaser's resize event and re-apply CSS AND update layout
    this.scale.on('resize', () => {
      if (typeof applyGameCss === 'function') {
        applyGameCss();
      }
      if (typeof this.updateSceneLayout === 'function' && isLandscape()) {
        console.log('[KidsFight] Calling updateSceneLayout at end of create');
        this.updateSceneLayout();
      }
    });
  }

  update(time, delta) {
    if (this.gameOver) return;

    // Handle player 1 movement
    if (this.player1 && this.player1.body) {
      let p1IsMoving = false;

      // Left/Right movement
      if (this.keys.a.isDown) {
        this.player1.body.velocity.x = -PLAYER_SPEED;
        this.player1.setFlipX(true);
        p1IsMoving = true;
      } else if (this.keys.d.isDown) {
        this.player1.body.velocity.x = PLAYER_SPEED;
        this.player1.setFlipX(false);
        p1IsMoving = true;
      } else {
        this.player1.body.velocity.x = 0;
      }

      // Jump
      if (this.keys.w.isDown && this.player1.body.touching.down) {
        this.player1.body.velocity.y = JUMP_VELOCITY;
      }

      // Handle animations
      if (p1IsMoving && this.player1.body.touching.down) {
        // Only play walk animation if not already playing it
        if (!this.player1.anims.isPlaying || this.player1.anims.currentAnim.key !== `p1_walk_${this.p1SpriteKey}`) {
          this.player1.play(`p1_walk_${this.p1SpriteKey}`);
        }
      } else if (this.player1.body.touching.down) {
        // Only play idle animation if not already playing it
        if (!this.player1.anims.isPlaying || this.player1.anims.currentAnim.key !== `p1_idle_${this.p1SpriteKey}`) {
          this.player1.play(`p1_idle_${this.p1SpriteKey}`);
        }
      }

      // Handle attacks in local mode or if player is host in online mode
      if ((this.gameMode !== 'online' || this.isHost) && this.keys.f.isDown && time > this.lastAttackTime[0] + 500) {
        this.player1.play(`p1_attack_${this.p1SpriteKey}`);
        this.lastAttackTime[0] = time;
        // Attack logic would go here...
      }
    }

    // Handle player 2 movement (in local mode only or if client in online mode)
    if (this.player2 && this.player2.body && (this.gameMode !== 'online' || !this.isHost)) {
      let p2IsMoving = false;

      // Left/Right movement
      if (this.cursors.left.isDown) {
        this.player2.body.velocity.x = -PLAYER_SPEED;
        this.player2.setFlipX(true);
        p2IsMoving = true;
      } else if (this.cursors.right.isDown) {
        this.player2.body.velocity.x = PLAYER_SPEED;
        this.player2.setFlipX(false);
        p2IsMoving = true;
      } else {
        this.player2.body.velocity.x = 0;
      }

      // Jump
      if (this.cursors.up.isDown && this.player2.body.touching.down) {
        this.player2.body.velocity.y = JUMP_VELOCITY;
      }

      // Handle animations
      if (p2IsMoving && this.player2.body.touching.down) {
        // Only play walk animation if not already playing it
        if (!this.player2.anims.isPlaying || this.player2.anims.currentAnim.key !== `p2_walk_${this.p2SpriteKey}`) {
          this.player2.play(`p2_walk_${this.p2SpriteKey}`);
        }
      } else if (this.player2.body.touching.down) {
        // Only play idle animation if not already playing it
        if (!this.player2.anims.isPlaying || this.player2.anims.currentAnim.key !== `p2_idle_${this.p2SpriteKey}`) {
          this.player2.play(`p2_idle_${this.p2SpriteKey}`);
        }
      }

      // Handle attacks in local mode or if player is client in online mode
      if ((this.gameMode !== 'online' || !this.isHost) && this.cursors.space.isDown && time > this.lastAttackTime[1] + 500) {
        this.player2.play(`p2_attack_${this.p2SpriteKey}`);
        this.lastAttackTime[1] = time;
        // Attack logic would go here...
      }
    }

    // In online mode, send player position to other player
    if (this.gameMode === 'online' && wsManager && wsManager.isConnected()) {
      const playerToSync = this.isHost ? this.player1 : this.player2;
      const playerIndex = this.isHost ? 0 : 1;

      if (playerToSync && playerToSync.body) {
        wsManager.send({
          type: 'player_update',
          x: playerToSync.x,
          y: playerToSync.y,
          velocityX: playerToSync.body.velocity.x,
          velocityY: playerToSync.body.velocity.y,
          health: this.playerHealth[playerIndex],
          frame: playerToSync.frame.name,
          flipX: playerToSync.flipX
        });
      }
    }
  }

  updatePlayer2Animation(isMoving, delta) {
    updateWalkingAnimation(this.player2, isMoving, delta);
  }

  handleRemoteAction(action) {
    // CRITICAL FIX: Determine the correct player to update based on the player index in the action
    // This ensures we're updating the correct player regardless of who is host or guest
    const remotePlayerIndex = action.player === 0 ? 0 : 1;
    const remoteSprite = remotePlayerIndex === 0 ? this.player1 : this.player2;
    const spriteKey = remotePlayerIndex === 0 ? this.p1SpriteKey : this.p2SpriteKey;
    
    // Skip if trying to update our own local player
    if (remotePlayerIndex === this.localPlayerIndex) {
      console.log(`[CRITICAL] Ignoring action for our own player ${remotePlayerIndex}`);
      return;
    }
    
    console.log(`[CRITICAL] Received remote action: ${action.type}, direction: ${action.direction || 'N/A'} for player ${remotePlayerIndex}`);
    console.log(`[CRITICAL] Local player is ${this.localPlayerIndex}, isHost: ${this.isHost}`);
    console.log(`[CRITICAL] Remote player sprite position: (${remoteSprite.x}, ${remoteSprite.y})`);
    
    // CRITICAL FIX: If position data is included, update the remote player's position directly
    if (action.position) {
      console.log(`[CRITICAL] Received position data: (${action.position.x}, ${action.position.y}), velocity: (${action.position.velocityX}, ${action.position.velocityY})`);
      
      // Update the remote player's position and velocity
      remoteSprite.x = action.position.x;
      remoteSprite.y = action.position.y;
      remoteSprite.body.velocity.x = action.position.velocityX;
      remoteSprite.body.velocity.y = action.position.velocityY;
      
      // Add a visual indicator for position update
      const posMarker = this.add.circle(remoteSprite.x, remoteSprite.y, 15, 0x00ff00, 0.7);
      this.time.delayedCall(300, () => posMarker.destroy());
    } else {
      // CRITICAL DEBUG: Force a visible marker at the remote player's position
      const marker = this.add.circle(remoteSprite.x, remoteSprite.y, 20, 0xff0000, 0.5);
      this.time.delayedCall(500, () => marker.destroy());
    }
    
    // Update on-screen debug information
    if (this.debugInfoText) {
      this.debugInfoText.setText(
        `Received: ${action.type}\n` +
        `Direction: ${action.direction || 'N/A'}\n` +
        `Timestamp: ${action.timestamp || Date.now()}\n` +
        `Remote Player: ${remotePlayerIndex} (${remotePlayerIndex === 0 ? 'Host' : 'Guest'})\n` +
        `Local Player: ${this.localPlayerIndex}\n` +
        `Remote Position: (${Math.round(remoteSprite.x)}, ${Math.round(remoteSprite.y)})`
      );
    }
    
    // Add a visual indicator that an action was received
    const actionText = this.add.text(
      remoteSprite.x,
      remoteSprite.y - 30,
      `Action: ${action.type}${action.direction ? ' ' + action.direction : ''}`,
      {
        fontSize: '14px',
        color: '#00ff00',
        backgroundColor: '#000000',
        padding: { x: 3, y: 2 }
      }
    ).setOrigin(0.5).setDepth(9999);
    
    // Remove the text after a short delay
    this.time.delayedCall(800, () => {
      actionText.destroy();
    });
    
    switch(action.type) {
      case 'move':
        console.log(`[CRITICAL DEBUG] Handling move action: ${action.direction} for player ${remotePlayerIndex}`);
        
        // CRITICAL FIX: Force update the remote player's animation based on direction
        if (action.direction === 'left') {
          // Set flip direction
          remoteSprite.setFlipX(true);
          
          // Add visual indicator for debugging
          const leftMarker = this.add.text(remoteSprite.x, remoteSprite.y - 50, '← MOVE LEFT', {
            fontSize: '16px',
            color: '#ff0000',
            backgroundColor: '#000000',
            padding: { x: 5, y: 2 }
          }).setOrigin(0.5).setDepth(9999).setAlpha(0.8);
          
          // Remove the text after a short delay
          this.time.delayedCall(800, () => {
            leftMarker.destroy();
          });
          
          // CRITICAL FIX: Force the animation to play
          const runAnim = `p${remotePlayerIndex+1}_walk_${spriteKey}`;
          remoteSprite.anims.play(runAnim, true);
          console.log(`[CRITICAL] Playing walk animation ${runAnim} for remote player ${remotePlayerIndex}`);
        } else if (action.direction === 'right') {
          // Set flip direction
          remoteSprite.setFlipX(false);
          
          // Add visual indicator for debugging
          const rightMarker = this.add.text(remoteSprite.x, remoteSprite.y - 50, 'MOVE RIGHT →', {
            fontSize: '16px',
            color: '#ff0000',
            backgroundColor: '#000000',
            padding: { x: 5, y: 2 }
          }).setOrigin(0.5).setDepth(9999).setAlpha(0.8);
          
          // Remove the text after a short delay
          this.time.delayedCall(800, () => {
            rightMarker.destroy();
          });
          
          // CRITICAL FIX: Force the animation to play
          const runAnim = `p${remotePlayerIndex+1}_walk_${spriteKey}`;
          remoteSprite.anims.play(runAnim, true);
          console.log(`[CRITICAL] Playing walk animation ${runAnim} for remote player ${remotePlayerIndex}`);
        } else if (action.direction === 'stop') {
          // Add visual indicator for debugging
          const stopMarker = this.add.text(remoteSprite.x, remoteSprite.y - 50, 'STOP', {
            fontSize: '16px',
            color: '#ff0000',
            backgroundColor: '#000000',
            padding: { x: 5, y: 2 }
          }).setOrigin(0.5).setDepth(9999).setAlpha(0.8);
          
          // Remove the text after a short delay
          this.time.delayedCall(800, () => {
            stopMarker.destroy();
          });
          
          // CRITICAL FIX: Force the idle animation to play
          const idleAnim = `p${remotePlayerIndex+1}_idle_${spriteKey}`;
          remoteSprite.anims.play(idleAnim, true);
          console.log(`[CRITICAL] Playing idle animation ${idleAnim} for remote player ${remotePlayerIndex}`);
        }
        
        // CRITICAL FIX: Force update the player's position in the debug display
        console.log(`[CRITICAL] Player ${remotePlayerIndex} position: (${remoteSprite.x}, ${remoteSprite.y}), velocity: (${remoteSprite.body.velocity.x}, ${remoteSprite.body.velocity.y})`);
        
        // Update debug text with more detailed information
        if (this.debugInfoText) {
          this.debugInfoText.setText(
            `Remote Player ${remotePlayerIndex} (${this.isHost ? 'Guest' : 'Host'})\n` +
            `Action: Move ${action.direction}\n` +
            `Position: (${Math.round(remoteSprite.x)}, ${Math.round(remoteSprite.y)})\n` +
            `Velocity: (${Math.round(remoteSprite.body.velocity.x)}, ${Math.round(remoteSprite.body.velocity.y)})\n` +
            `Animation: ${remoteSprite.anims.currentAnim?.key || 'none'}`
          );
        }
        break;
        
      case 'jump':
        if (remoteSprite.body.touching.down) {
          remoteSprite.setVelocityY(-500); // Use a constant jump velocity
          
          // Add visual indicator for debugging
          const jumpMarker = this.add.text(remoteSprite.x, remoteSprite.y - 50, 'JUMP', {
            fontSize: '16px',
            color: '#ff0000',
            backgroundColor: '#000000',
            padding: { x: 5, y: 2 }
          }).setOrigin(0.5).setDepth(9999).setAlpha(0.8);
          
          // Remove the text after a short delay
          this.time.delayedCall(800, () => {
            jumpMarker.destroy();
          });
          
          // Play jump animation - use walk animation since there's no specific jump animation
          const jumpAnim = `p${remotePlayerIndex+1}_walk_${spriteKey}`;
          remoteSprite.anims.play(jumpAnim, true);
        }
        break;
        
      case 'attack':
        const currentTime = this.time.now;
        
        // Add visual indicator for debugging
        const attackMarker = this.add.text(
          remoteSprite.x,
          remoteSprite.y - 50,
          'ATTACK',
          {
            fontSize: '16px',
            color: '#ff0000',
            backgroundColor: '#000000',
            padding: { x: 5, y: 2 }
          }
        ).setOrigin(0.5).setDepth(9999).setAlpha(0.8);
        
        // Remove the text after a short delay
        this.time.delayedCall(800, () => {
          attackMarker.destroy();
        });
        
        // Play attack animation
        const attackAnim = `p${remotePlayerIndex+1}_attack_${spriteKey}`;
        remoteSprite.anims.play(attackAnim, true);
        
        // CRITICAL FIX: Apply damage to the local player when remote player attacks
        // Determine which player is the defender (the local player)
        const defenderIndex = this.localPlayerIndex;
        const defender = defenderIndex === 0 ? this.player1 : this.player2;
        
        // Apply damage if players are close enough
        const ATTACK_RANGE = 180;
        if (Math.abs(remoteSprite.x - defender.x) <= ATTACK_RANGE) {
          // Apply damage to the local player
          this.playerHealth[defenderIndex] = Math.max(0, this.playerHealth[defenderIndex] - ATTACK_DAMAGE);
          
          // Update the health bar
          const healthBar = defenderIndex === 0 ? this.healthBar1 : this.healthBar2;
          const healthRatio = Math.max(0, this.playerHealth[defenderIndex] / MAX_HEALTH);
          if (healthBar) healthBar.width = 200 * healthRatio;
          
          // Visual feedback for taking damage
          if (this.cameras && this.cameras.main) {
            this.cameras.main.shake(100, 0.01);
          }
          
          console.log(`[CRITICAL] Local player ${defenderIndex} took damage. Health: ${this.playerHealth[defenderIndex]}`);
        }
        
        // Reset to idle after attack animation completes
        remoteSprite.once('animationcomplete', () => {
          const idleAnim = `p${remotePlayerIndex+1}_idle_${spriteKey}`;
          remoteSprite.anims.play(idleAnim, true);
        });
        break;
        
      case 'special':
        // Add visual indicator for debugging
        const specialMarker = this.add.text(remoteSprite.x, remoteSprite.y - 50, 'SPECIAL', {
          fontSize: '16px',
          color: '#ff0000',
          backgroundColor: '#000000',
          padding: { x: 5, y: 2 }
        }).setOrigin(0.5).setDepth(9999).setAlpha(0.8);
        
        // Remove the text after a short delay
        this.time.delayedCall(800, () => {
          specialMarker.destroy();
        });
        
        // Play special attack animation
        const specialAnim = `p${remotePlayerIndex+1}_special_${spriteKey}`;
        remoteSprite.anims.play(specialAnim, true);
        
        // CRITICAL FIX: Apply special attack damage to the local player
        // Determine which player is the defender (the local player)
        const specialDefenderIndex = this.localPlayerIndex;
        const specialDefender = specialDefenderIndex === 0 ? this.player1 : this.player2;
        
        // Apply damage if players are close enough (special has slightly longer range)
        const SPECIAL_RANGE = 200;
        if (Math.abs(remoteSprite.x - specialDefender.x) <= SPECIAL_RANGE) {
          // Apply damage to the local player (special does more damage)
          this.playerHealth[specialDefenderIndex] = Math.max(0, this.playerHealth[specialDefenderIndex] - SPECIAL_DAMAGE);
          
          // Update the health bar
          const specialHealthBar = specialDefenderIndex === 0 ? this.healthBar1 : this.healthBar2;
          const specialHealthRatio = Math.max(0, this.playerHealth[specialDefenderIndex] / MAX_HEALTH);
          if (specialHealthBar) specialHealthBar.width = 200 * specialHealthRatio;
          
          // Visual feedback for taking damage (stronger for special)
          if (this.cameras && this.cameras.main) {
            this.cameras.main.shake(250, 0.03);
          }
          
          console.log(`[CRITICAL] Local player ${specialDefenderIndex} took SPECIAL damage. Health: ${this.playerHealth[specialDefenderIndex]}`);
        }
        
        // Reset to idle after special animation completes
        remoteSprite.once('animationcomplete', () => {
          const idleAnim = `p${remotePlayerIndex+1}_idle_${spriteKey}`;
          remoteSprite.anims.play(idleAnim, true);
        });
        
        // Show special effect if the method exists
        if (typeof this.showSpecialEffect === 'function') {
          this.showSpecialEffect(remoteSprite.x, remoteSprite.y);
        }
        break;
        
      case 'crouch':
        // Add visual indicator for debugging
        const crouchMarker = this.add.text(remoteSprite.x, remoteSprite.y - 50, 'CROUCH', {
          fontSize: '16px',
          color: '#ff0000',
          backgroundColor: '#000000',
          padding: { x: 5, y: 2 }
        }).setOrigin(0.5).setDepth(9999).setAlpha(0.8);
        
        // Remove the text after a short delay
        this.time.delayedCall(800, () => {
          crouchMarker.destroy();
        });
        
        // Play crouch animation (using down animation which is what's available)
        const crouchAnim = `p${remotePlayerIndex+1}_down_${spriteKey}`;
        remoteSprite.anims.play(crouchAnim, true);
        break;
        
      case 'stand':
        // Add visual indicator for debugging
        const standMarker = this.add.text(remoteSprite.x, remoteSprite.y - 50, 'STAND', {
          fontSize: '16px',
          color: '#ff0000',
          backgroundColor: '#000000',
          padding: { x: 5, y: 2 }
        }).setOrigin(0.5).setDepth(9999).setAlpha(0.8);
        
        // Remove the text after a short delay
        this.time.delayedCall(800, () => {
          standMarker.destroy();
        });
        
        // Play stand animation (idle)
        const standAnim = `p${remotePlayerIndex+1}_idle_${spriteKey}`;
        remoteSprite.anims.play(standAnim, true);
        break;
        
      case 'test_sync':
        // Special test action to verify synchronization
        console.log('[DEBUG] Received test_sync action with timestamp:', action.timestamp);
        
        // Visual feedback - make the player jump and flash
        remoteSprite.setVelocityY(-400); // Jump
        
        // Flash the player sprite
        this.tweens.add({
          targets: remoteSprite,
          alpha: 0.2,
          duration: 100,
          yoyo: true,
          repeat: 5
        });
        
        // Show a text indicator
        const syncText = this.add.text(
          remoteSprite.x,
          remoteSprite.y - 50,
          'SYNC TEST!',
          {
            fontSize: '16px',
            color: '#ffff00',
            backgroundColor: '#000000',
            padding: { x: 5, y: 2 }
          }
        ).setOrigin(0.5);
        
        // Remove the text after a delay
        this.time.delayedCall(1000, () => {
          syncText.destroy();
        });
        break;
    }
  }

  handleDisconnection() {
    // Show disconnection message and return to menu
    const text = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      'Jogador desconectado!\nVoltando ao menu...',
      {
        fontSize: '32px',
        color: '#ff0000',
        align: 'center',
        fontFamily: 'monospace'
      }
    ).setOrigin(0.5);
    
    this.time.delayedCall(2000, () => {
      if (this.ws) {
        this.ws.close();
      }
      this.scene.start('GameModeScene');
    });
  }

  sendGameAction(type, data = {}) {
    if (this.gameMode !== 'online' || !this.wsManager || !this.wsManager.ws) {
      return;
    }
    
    // Get the local player sprite to include position data
    const localPlayer = this.localPlayerIndex === 0 ? this.player1 : this.player2;
    
    // Include current position data with every action
    const action = {
      type,
      ...data,
      timestamp: Date.now(),
      player: this.localPlayerIndex,
      position: {
        x: localPlayer.x,
        y: localPlayer.y,
        velocityX: localPlayer.body.velocity.x,
        velocityY: localPlayer.body.velocity.y
      }
    };
    
    console.log(`[CRITICAL] Sending game action: ${type}, direction: ${data.direction || 'N/A'}, player: ${this.localPlayerIndex}, position: (${localPlayer.x}, ${localPlayer.y})`);
    this.wsManager.sendGameAction(action);
    
    // Add visual indicator for sent actions (debugging)
    if (localPlayer) {
      this.add.text(
        localPlayer.x,
        localPlayer.y - 70,
        `SENT: ${type}${data.direction ? ' ' + data.direction : ''}`,
        {
          fontSize: '14px',
          color: '#ff00ff',
          backgroundColor: '#000000',
          padding: { x: 3, y: 2 }
        }
      ).setOrigin(0.5).setDepth(9999).setAlpha(0.8);
    }
  }

  update(time, delta) {
    // Only show debug overlay in development mode
    const DEV = (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') || (typeof __DEV__ !== 'undefined' && __DEV__);

    if (DEV) {
      if (!this.debugText || !this.debugText.scene) {
        if (this.add && this.add.text) {
          this.debugText = this.add.text(10, 10, '', { fontSize: '16px', color: '#fff', backgroundColor: 'rgba(0,0,0,0.5)', fontFamily: 'monospace' }).setDepth(99999).setScrollFactor(0).setOrigin(0,0);
        } else {
          return;
        }
      }
      // Debug overlay: show only in landscape (DEV only)
      const w = this.scale.width;
      const h = this.scale.height;
      if (w > h) {
        const PLATFORM_Y = h * 0.55;
        const PLATFORM_HEIGHT = h * 0.045;
        const PLAYER_PLATFORM_OFFSET = 0;
        const scale = (h * 0.28) / 512;
        const playerY = PLATFORM_Y + PLAYER_PLATFORM_OFFSET;
        let player1y = (this.player1 && this.player1.scene) ? this.player1.y : 'n/a';
        let player1h = (this.player1 && this.player1.scene) ? this.player1.displayHeight : 'n/a';
        let player1bodyy = (this.player1 && this.player1.body && this.player1.scene) ? this.player1.body.y : 'n/a';
        if (this.debugText && this.debugText.scene) {
          this.debugText.setText([
            `w: ${w}, h: ${h}`,
            `PLATFORM_Y: ${PLATFORM_Y}`,
            `playerY: ${playerY}`,
            `scale: ${scale}`,
            `player1.y: ${player1y}`,
            `player1.displayHeight: ${player1h}`,
            `player1.body.y: ${player1bodyy}`
          ].join('\n')).setVisible(true);
        }
      } else {
        if (this.debugText && this.debugText.scene) this.debugText.setVisible(false);
      }
    } else {
      if (this.debugText && this.debugText.scene) this.debugText.setVisible(false);
    }

    if (this.gameOver) return;
    // --- SPECIAL PIPS UPDATE LOGIC ---
    // Helper: update special pips and indicators for a player
    const updateSpecialPips = (playerIdx) => {
      const attackCount = this.attackCount?.[playerIdx] || 0;
      const pips = playerIdx === 0 ? this.specialPips1 : this.specialPips2;
      const specialReady = playerIdx === 0 ? this.specialReady1 : this.specialReady2;
      const specialReadyText = playerIdx === 0 ? this.specialReadyText1 : this.specialReadyText2;
      // Show yellow for each attack landed, up to 3, but hide all after 3
      if (attackCount >= 3) {
        // Hide all pips
        for (let i = 0; i < 3; i++) {
          if (pips[i]) pips[i].setVisible(false);
        }
        if (specialReady) specialReady.setVisible(true);
        if (specialReadyText) specialReadyText.setVisible(true);
      } else {
        for (let i = 0; i < 3; i++) {
          if (pips[i]) {
            pips[i].setFillStyle(i < attackCount ? 0xffd700 : 0x888888).setVisible(true);
          }
        }
        if (specialReady) specialReady.setVisible(false);
        if (specialReadyText) specialReadyText.setVisible(false);
      }
    };
    // Call for both players
    updateSpecialPips(0);
    updateSpecialPips(1);
    // console.log('[DEBUG] update() this:', this, 'scene key:', this.sys && this.sys.settings && this.sys.settings.key);
    if (!this.keys || !this.keys.v) {
      // console.log('[DEBUG] this.keys or this.keys.v is undefined in update()');
      return;
    }
    // Debug: confirm update is running
    // console.log('[DEBUG] Update running');
    // --- TOUCH CONTROLS: map to key states ---
    // --- TOUCH CONTROLS: custom justPressed for attack/special ---
    if (this.isTouch && this.touchFlags) {
      // Setup justPressed logic for attack/special
      if (!this._touchWasDownP1A && this.touchFlags.p1.attack) {
        this._touchJustPressedP1A = true;
      }
      this._touchWasDownP1A = this.touchFlags.p1.attack;
      if (!this._touchWasDownP1S && this.touchFlags.p1.special) {
        this._touchJustPressedP1S = true;
      }
      this._touchWasDownP1S = this.touchFlags.p1.special;
      if (!this._touchWasDownP2A && this.touchFlags.p2.attack) {
        this._touchJustPressedP2A = true;
      }
      this._touchWasDownP2A = this.touchFlags.p2.attack;
      if (!this._touchWasDownP2S && this.touchFlags.p2.special) {
        this._touchJustPressedP2S = true;
      }
      this._touchWasDownP2S = this.touchFlags.p2.special;

      // Map movement keys from touch to key states
      this.keys.a.isDown = this.touchFlags.p1.left;
      this.keys.d.isDown = this.touchFlags.p1.right;
      this.keys.w.isDown = this.touchFlags.p1.jump;
      this.keys.s.isDown = this.touchFlags.p1.down;
      this.cursors.left.isDown = this.touchFlags.p2.left;
      this.cursors.right.isDown = this.touchFlags.p2.right;
      this.cursors.up.isDown = this.touchFlags.p2.jump;
      this.cursors.down.isDown = this.touchFlags.p2.down;
    }
    // On desktop, do not overwrite keyboard input




    // Timer logic (regressive)
    if (!this.gameOver && this.fightStarted) {
      if (typeof this.lastTimerUpdate !== 'number' || isNaN(this.lastTimerUpdate)) this.lastTimerUpdate = time;
      if (typeof this.timeLeft !== 'number' || isNaN(this.timeLeft)) {
        this.timeLeft = ROUND_TIME;
      }
      const timerElapsed = Math.floor((time - this.lastTimerUpdate) / 1000);
      if (timerElapsed > 0) {
        this.timeLeft = Math.max(0, this.timeLeft - timerElapsed);
        this.lastTimerUpdate += timerElapsed * 1000;
        // Update timer display only when it changes
        if (this.timerText) this.timerText.setText(Math.ceil(this.timeLeft));
      }
    }

    // Invert frames if players cross each other
    if (this.player1 && this.player2) {
      if (this.player1.x > this.player2.x) {
        this.player1.setFlipX(true);  // Face left
        this.player2.setFlipX(false); // Face right
      } else {
        this.player1.setFlipX(false); // Face right
        this.player2.setFlipX(true);  // Face left
      }
    }
    // Check win/lose by health
    // Health-based win detection
    if (!this.gameOver && this.player1 && this.player2) {
      if (this.playerHealth[0] <= 0) {
        // Player 2 won (Player 1 health is 0)
        // Get the correct character name based on sprite key
        const winner = this.getCharacterName(this.p2SpriteKey);
        return this.endGame(`${winner} Venceu!`);
      } else if (this.playerHealth[1] <= 0) {
        // Player 1 won (Player 2 health is 0)
        // Get the correct character name based on sprite key
        const winner = this.getCharacterName(this.p1SpriteKey);
        return this.endGame(`${winner} Venceu!`);
      }
    }
    if (this.timeLeft === 0) {
      if (this.playerHealth[0] > this.playerHealth[1]) {
        // Get the correct character name based on sprite key
        const winner = this.getCharacterName(this.p1SpriteKey);
        this.endGame(`${winner} Venceu!`);
      } else if (this.playerHealth[1] > this.playerHealth[0]) {
        // Get the correct character name based on sprite key
        const winner = this.getCharacterName(this.p2SpriteKey);
        this.endGame(`${winner} Venceu!`);
      } else {
        this.endGame('Empate!');
      }
      return;
    }
    // Timer logic (regressive)
    if (this.timeLeft <= 0 && !this.gameOver) {
      this.endGame("Tempo Esgotado! Empate!");
      return;
    }
    // Player 1 movement
    let p1Moving = false;
    if (this.player1 && this.player1.body) {
      const p1 = this.player1.body;
      if (this.lungeTimer[0] > 0) {
        this.lungeTimer[0] -= delta;
      } else {
        p1.setVelocityX(0);
        
        // CRITICAL FIX: Only control player1 if in local mode or if we're the host in online mode
        if (this.gameMode === 'local' || (this.gameMode === 'online' && this.localPlayerIndex === 0)) {
          if (this.keys.a.isDown) {
            p1.setVelocityX(-PLAYER_SPEED);
            p1Moving = true;
            
            // Send movement action to other player if in online mode
            if (this.gameMode === 'online') {
              this.sendGameAction('move', { direction: 'left' });
            }
          } else if (this.keys.d.isDown) {
            p1.setVelocityX(PLAYER_SPEED);
            p1Moving = true;
            
            // Send movement action to other player if in online mode
            if (this.gameMode === 'online') {
              this.sendGameAction('move', { direction: 'right' });
            }
          } else if (this.gameMode === 'online') {
            // Only send stop action in online mode
            this.sendGameAction('move', { direction: 'stop' });
          }
          
          if (this.keys.w.isDown && p1.onFloor()) {
            p1.setVelocityY(JUMP_VELOCITY);
            
            // Send jump action to other player if in online mode
            if (this.gameMode === 'online') {
              this.sendGameAction('jump');
            }
          }
        }
      }
      // Player 1 walk animation
      if (
        this.player1State === 'idle' &&
        p1Moving &&
        p1.onFloor() &&
        !this.gameOver
      ) {
        const p1WalkKey = 'p1_walk_' + this.p1SpriteKey;
        if (this.player1.anims.currentAnim?.key !== p1WalkKey) {
          this.player1.play(p1WalkKey, true);
        }
      } else if (
        this.player1State === 'idle' &&
        this.player1.anims.currentAnim?.key === ('p1_walk_' + this.p1SpriteKey) &&
        !this.gameOver
      ) {
        if (!this.gameOver) this.player1.play('p1_idle_' + this.p1SpriteKey, true);
      }
    }
    // Player 2 movement
    let p2Moving = false;
    if (this.player2 && this.player2.body) {
      const p2 = this.player2.body;
      if (this.lungeTimer[1] > 0) {
        this.lungeTimer[1] -= delta;
      } else {
        p2.setVelocityX(0);
        
        // Handle player 2 movement in both local and online modes
        if (this.gameMode === 'local' || (this.gameMode === 'online' && this.localPlayerIndex === 1)) {
          // Local mode: player 2 controls with arrow keys
          // Online mode: guest (player 2) controls with arrow keys
          if (this.cursors.left.isDown) {
            p2.setVelocityX(-PLAYER_SPEED);
            this.player2.setFlipX(true);
            p2Moving = true;
            if (this.gameMode === 'online') {
              this.sendGameAction('move', { direction: 'left' });
            }
          } else if (this.cursors.right.isDown) {
            p2.setVelocityX(PLAYER_SPEED);
            this.player2.setFlipX(false);
            p2Moving = true;
            if (this.gameMode === 'online') {
              this.sendGameAction('move', { direction: 'right' });
            }
          } else if (this.gameMode === 'online') {
            // Only send stop action in online mode
            this.sendGameAction('move', { direction: 'stop' });
          }
          
          if (this.cursors.up.isDown && p2.onFloor()) {
            p2.setVelocityY(JUMP_VELOCITY);
            if (this.gameMode === 'online') {
              this.sendGameAction('jump');
            }
          }
        } else if (this.gameMode === 'online' && this.localPlayerIndex === 0) {
          // Online mode: host (player 1) doesn't control player 2
          // Player 2 movement is controlled by remote actions
        }
      }
      // Player 2 walk animation
      if (
        this.player2State === 'idle' &&
        p2Moving &&
        p2.onFloor() &&
        !this.gameOver
      ) {
        const p2WalkKey = 'p2_walk_' + this.p2SpriteKey;
        if (this.player2.anims.currentAnim?.key !== p2WalkKey) {
          this.player2.play(p2WalkKey, true);
        }
      } else if (
        this.player2State === 'idle' &&
        this.player2.anims.currentAnim?.key === ('p2_walk_' + this.p2SpriteKey) &&
        !this.gameOver
      ) {
        if (!this.gameOver) this.player2.play('p2_idle_' + this.p2SpriteKey, true);
      }
    }

    // Player 1 crouch (S or N key)
    if (!this.gameOver) {
      if (this.player1State === 'attack' || this.player1State === 'special') {
        // Do not interrupt attack/special
      } else if (this.keys && ((this.keys.n && this.keys.n.isDown) || (this.keys.s && this.keys.s.isDown))) {
        if (this.player1State !== 'down') {
          this.player1.play('p1_down_' + this.p1SpriteKey, true);
          this.player1State = 'down';
          
          // Send crouch action in online mode if player 1 is controlled by local player
          if (this.gameMode === 'online' && (this.localPlayerIndex === 0 || this.localPlayerIndex === undefined)) {
            this.sendGameAction('crouch');
          }
        }
      } else {
        if (this.player1State !== 'idle') {
          // Only play idle if game is not over
          if (!this.gameOver) this.player1.play('p1_idle_' + this.p1SpriteKey, true);
          this.player1State = 'idle';
          
          // Send stand action in online mode if player was previously crouching
          if (this.gameMode === 'online' && (this.localPlayerIndex === 0 || this.localPlayerIndex === undefined)) {
            this.sendGameAction('stand');
          }
        }
      }
    }
    // Player 2 crouch (Down arrow or ; key)
    if (!this.gameOver) {
      if (this.player2State === 'attack' || this.player2State === 'special') {
        // Do not interrupt attack/special
      } else if ((this.cursors && this.cursors.down && this.cursors.down.isDown) || (this.keys && this.keys.semicolon && this.keys.semicolon.isDown)) {
        if (this.player2State !== 'down') {
          this.player2.play('p2_down_' + this.p2SpriteKey, true);
          this.player2.setFlipX(true);
          this.player2State = 'down';
          
          // Send crouch action in online mode if player 2 is controlled by local player
          if (this.gameMode === 'online' && this.localPlayerIndex === 1) {
            this.sendGameAction('crouch');
          }
        }
      } else {
        if (this.player2State !== 'idle') {
          // Only play idle if game is not over
          if (!this.gameOver) this.player2.play('p2_idle_' + this.p2SpriteKey, true);
          this.player2.setFlipX(true);
          this.player2State = 'idle';
          
          // Send stand action in online mode if player was previously crouching
          if (this.gameMode === 'online' && this.localPlayerIndex === 1) {
            this.sendGameAction('stand');
          }
        }
      }
    }

    // Debug: log V key state and player1State
    if (this.keys && this.keys.v) {
      // console.log('[DEBUG] V key isDown:', this.keys.v.isDown, 'JustDown:', Phaser.Input.Keyboard.JustDown(this.keys.v));
    }
    // console.log('[DEBUG] player1State:', this.player1State);
    // Debug: check if we reach attack check
    // console.log('[DEBUG] Before attack check');
    // Use isDown + cooldown for V key
    const now = time;
    const attackCondition = (this.keys && this.keys.v && this.keys.v.isDown && now > (this.lastAttackTime?.[0] || 0) + ATTACK_COOLDOWN && this.player1State !== 'attack' && this.player1State !== 'special') || (this._touchJustPressedP1A && this.player1State !== 'attack' && this.player1State !== 'special');
    // console.log('[DEBUG] Attack condition:', attackCondition, 'isDown:', this.keys.v.isDown, 'lastAttackTime:', this.lastAttackTime?.[0], 'now:', now, '_touchJustPressedP1A:', this._touchJustPressedP1A);
    // Player 1 attack (V key or touch)
    if (attackCondition) {
      // Always reset touch flag after attack (fixes mobile bug)
      this._touchJustPressedP1A = false;
      // console.log('[DEBUG] Attack block entered, player1:', this.player1);
      // Now always allowed to attack here, no further state check needed
        // console.log('[DEBUG] Triggering attack animation');
        const p1AttackKey = 'p1_attack_' + this.p1SpriteKey;
        // console.log('[DEBUG] Using attack animation key:', p1AttackKey);
        this.player1.play(p1AttackKey, true);
        this.player1State = 'attack';
        
        // Send attack action in online mode if player 1 is controlled by local player
        if (this.gameMode === 'online' && (this.localPlayerIndex === 0 || this.localPlayerIndex === undefined)) {
          this.sendGameAction('attack');
        }
        
        // console.log('[DEBUG] player1State set to:', this.player1State);
        // Deal damage to player2 if in range
        console.log('[DEBUG-BEFORE] Player 1 attacks Player 2. Player 2 health:', this.playerHealth[1]);
        tryAttack(this, 0, this.player1, this.player2, now, false);
        console.log('[DEBUG-AFTER] Player 1 attacks Player 2. Player 2 health:', this.playerHealth[1]);
        const healthRatio = Math.max(0, this.playerHealth[1] / MAX_HEALTH);
        this.healthBar2.width = 200 * healthRatio;
        // Manually switch to idle after 400ms
        this.time.delayedCall(400, () => {
          if (this.player1State === 'attack' && !this.gameOver) {
            this.player1.play('p1_idle_' + this.p1SpriteKey, true);
            this.player1State = 'idle';
          }
        });
    }

    // Handle keyboard input for attacks and special moves
    const controlIndex = this.gameMode === 'online' ? this.localPlayerIndex : 0;
    
    if (this.cursors.space.isDown && time - this.lastAttackTime[controlIndex] >= 500) { // 500ms cooldown
      this[controlIndex === 0 ? 'player1State' : 'player2State'] = 'attack';
      this.lastAttackTime[controlIndex] = time;
      
      if (this.gameMode === 'online') {
        this.sendGameAction('attack');
      }
    }

    // Handle player 2 attacks in local mode only
    if (this.gameMode === 'local' && this.keyF.isDown && time - this.lastAttackTime[1] >= 500) { // 500ms cooldown
      this.player2State = 'attack';
      this.lastAttackTime[1] = time;
    }

    // Handle special attacks
    const specialCondition = (
      (this.cursors.shift.isDown || this._touchJustPressedP1S) &&
      (this.gameMode === 'online' ? 
        this[controlIndex === 0 ? 'player1State' : 'player2State'] !== 'attack' &&
        this[controlIndex === 0 ? 'player1State' : 'player2State'] !== 'special' &&
        this.attackCount[controlIndex] >= 3
        :
        this.player1State !== 'attack' &&
        this.player1State !== 'special' &&
        this.attackCount[0] >= 3
      )
    );

    if (specialCondition) {
      this._touchJustPressedP1S = false;
      
      if (this.gameMode === 'online') {
        this[controlIndex === 0 ? 'player1State' : 'player2State'] = 'special';
        
        // Send special attack action to the other player
        this.sendGameAction('special');
        this.attackCount[controlIndex] = 0;
        this.specialPips[controlIndex] = 0;
        this.showSpecialEffect(this.players[controlIndex].x, this.players[controlIndex].y);
        this.sendGameAction('special');
      } else {
        const p1SpecialKey = 'p1_special_' + this.p1SpriteKey;
        this.player1.play(p1SpecialKey, true);
        this.player1State = 'special';
        this.attackCount[0] = 0;
        this.specialPips[0] = 0;
        this.showSpecialEffect(this.players[0].x, this.players[0].y);
      }
      tryAttack(this, 0, this.player1, this.player2, now, true);
      const healthRatio = Math.max(0, this.playerHealth[1] / MAX_HEALTH);
      this.healthBar2.width = 200 * healthRatio;
      this.showSpecialEffect(this.player1.x, this.player1.y - 60);
      this.time.delayedCall(700, () => {
          if (this.player1State === 'special' && !this.gameOver) {
           this.player1.play('p1_idle_' + this.p1SpriteKey, true);
           this.player1State = 'idle';
           // Reset special pips after special is used
           this.attackCount[0] = 0;
         }
       });
    }

    // Player 2 attack (M key or touch)
    const attackConditionP2 = (
      this.keys &&
      this.keys.m && this.keys.m.isDown && now > (this.lastAttackTime?.[1] || 0) + ATTACK_COOLDOWN && this.player2State !== 'attack' && this.player2State !== 'special') || (this._touchJustPressedP2A && this.player2State !== 'attack' && this.player2State !== 'special');
    if (attackConditionP2) {
      // Always reset touch flag after attack (fixes mobile bug for Player 2)
      this._touchJustPressedP2A = false;
      const p2AttackKey = 'p2_attack_' + this.p2SpriteKey;
      this.player2.play(p2AttackKey, true);
      this.player2State = 'attack';
      
      // Send attack action in online mode if player 2 is controlled by local player
      if (this.gameMode === 'online' && this.localPlayerIndex === 1) {
        this.sendGameAction('attack');
      }
      
      tryAttack(this, 1, this.player2, this.player1, now, false);
      const healthRatio1 = Math.max(0, this.playerHealth[0] / MAX_HEALTH);
      this.healthBar1.width = 200 * healthRatio1;
      this.time.delayedCall(400, () => {
         if (this.player2State === 'attack' && !this.gameOver) {
           this.player2.play('p2_idle_' + this.p2SpriteKey, true);
           this.player2State = 'idle';
         }
       });
    }

    // Player 2 special (L key or touch)
    const specialConditionP2 = (
      this.keys &&
      this.keys.l && this.keys.l.isDown &&
      this.player2State !== 'attack' &&
      this.player2State !== 'special' &&
      this.attackCount[1] >= 3
    ) || (this._touchJustPressedP2S && this.player2State !== 'attack' && this.player2State !== 'special' && this.attackCount[1] >= 3);
    if (specialConditionP2) {
      this._touchJustPressedP2S = false;
      const p2SpecialKey = 'p2_special_' + this.p2SpriteKey;
      this.player2.play(p2SpecialKey, true);
      this.player2State = 'special';
      
      // Send special attack action in online mode if player 2 is controlled by local player
      if (this.gameMode === 'online' && this.localPlayerIndex === 1) {
        this.sendGameAction('special');
      }
      tryAttack(this, 1, this.player2, this.player1, now, true);
      const healthRatio1 = Math.max(0, this.playerHealth[0] / MAX_HEALTH);
      this.healthBar1.width = 200 * healthRatio1;
      this.showSpecialEffect(this.player2.x, this.player2.y - 60);
      this.time.delayedCall(700, () => {
        if (this.player2State === 'special' && !this.gameOver) {
          this.player2.play('p2_idle_' + this.p2SpriteKey, true);
          this.player2State = 'idle';
          // Reset special pips after special is used
          this.attackCount[1] = 0;
        }
      });
    }
  }

  updateSceneLayout() {
    console.log('=== [KidsFight] updateSceneLayout called ===')
    return updateSceneLayout(this);
    console.log('=== [KidsFight] updateSceneLayout finish called ===')
  }

  // --- GAME OVER HANDLER ---
  endGame(phrase) {
    if (this.gameOver) return;
    this.gameOver = true;

    // Centered winning phrase
    const winText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 - 50,
      phrase,
      {
        fontSize: Math.max(20, Math.min(36, Math.round(this.cameras.main.width * 0.055))) + 'px',
        color: '#fff',
        fontFamily: 'monospace',
        stroke: '#000',
        strokeThickness: 8,
        align: 'center',
        backgroundColor: 'rgba(0,0,0,0.35)',
        padding: {
          left: Math.round(this.cameras.main.width * 0.025),
          right: Math.round(this.cameras.main.width * 0.025),
          top: Math.round(this.cameras.main.width * 0.012),
          bottom: Math.round(this.cameras.main.width * 0.012)
        }
      }
    ).setOrigin(0.5).setDepth(10001);

    // Create replay buttons
    const buttonStyle = {
      fontSize: Math.max(16, Math.min(24, Math.round(this.cameras.main.width * 0.035))) + 'px',
      color: '#fff',
      fontFamily: 'monospace',
      backgroundColor: '#4a4a4a',
      padding: {
        left: 20,
        right: 20,
        top: 10,
        bottom: 10
      }
    };

    // Button to replay with same players
    const replayButton = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 + 50,
      'Jogar Novamente (Mesmos Jogadores)',
      buttonStyle
    );
    replayButton.setOrigin(0.5);
    replayButton.setInteractive({ useHandCursor: true });
    replayButton.on('pointerover', () => replayButton.setStyle({ backgroundColor: '#666666' }));
    replayButton.on('pointerout', () => replayButton.setStyle({ backgroundColor: '#4a4a4a' }));
    replayButton.on('pointerdown', () => {
      // Reset the game with the same players
      this.scene.restart({
        p1: this.selected.p1,
        p2: this.selected.p2,
        scenario: this.selectedScenario
      });
    });


    // Button to choose different players
    const newPlayersButton = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 + 100,
      'Escolher Outros Jogadores',
      buttonStyle
    );
    newPlayersButton.setOrigin(0.5);
    newPlayersButton.setInteractive({ useHandCursor: true });
    newPlayersButton.on('pointerover', () => newPlayersButton.setStyle({ backgroundColor: '#666666' }));
    newPlayersButton.on('pointerout', () => newPlayersButton.setStyle({ backgroundColor: '#4a4a4a' }));
    newPlayersButton.on('pointerdown', () => {
      // Clean up current scene and go back to player select scene
      if (this.ws) {
        this.ws.close();
      }
      this.scene.stop();
      // Only start PlayerSelectScene if it exists
      if (this.scene.get('PlayerSelectScene')) {
        this.scene.start('PlayerSelectScene');
      }
    });

// ... (rest of the code remains the same)

    // Optionally, fade in the text
    winText.setAlpha(0);
    this.tweens.add({
      targets: winText,
      alpha: 1,
      duration: 400
    });



    // Winner celebrates, loser lays down
    if (this.player1 && this.player2) {
      const p1Dead = this.playerHealth[0] <= 0;
      const p2Dead = this.playerHealth[1] <= 0;
      if (p1Dead && !p2Dead) {
        // Player 2 wins
        this.player2.setFrame(3); // Winner celebrates
        this.player2.setFlipX(true);
        this.player2.setAngle(0);
        this.player1.setFrame(4); // Loser lays down (frame 4)
        this.player1.setFlipX(false);
        this.player1.setAngle(270);
        this.showSpecialEffect(this.player1.x, this.player1.y);
      } else if (p2Dead && !p1Dead) {
        // Player 1 wins
        this.player1.setFrame(3); // Winner celebrates
        this.player1.setFlipX(false);
        this.player1.setAngle(0);
        this.player2.setFrame(4); // Loser lays down (frame 4)
        this.player2.setFlipX(true);
        this.player2.setAngle(270);
        this.showSpecialEffect(this.player2.x, this.player2.y);
      } else {
        // Draw or both dead: both use frame 5
        this.player1.setFrame(5); // Both use frame 5 for draw
        this.player1.setFlipX(false);
        // No rotation for draw
        this.player2.setFrame(5);
        this.player2.setFlipX(true);
        // No rotation for draw
        this.showSpecialEffect(this.player1.x, this.player1.y);
        this.showSpecialEffect(this.player2.x, this.player2.y);
      }
    }
    if (this.player1 && this.player1.anims) this.player1.anims.stop();
    if (this.player2 && this.player2.anims) this.player2.anims.stop();

    // Freeze winner in frame 3 (celebration) after win
    if (this.player1.frame.name === 3) {
      this.player1.setFrame(3);
    }
    if (this.player2.frame.name === 3) {
      this.player2.setFrame(3);
    }

    // Do not remove input listeners; rely on this.gameOver = true to block input after game over.
    // This avoids breaking keyboard input after scene restart.
  }
}

export default KidsFightScene;
