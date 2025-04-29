// Dynamically set game size based on viewport, accounting for mobile browser UI
const GAME_WIDTH = window.innerWidth;
const GAME_HEIGHT = window.innerHeight;

const PLAYER_SIZE = 192;
const PLAYER_SPEED = 200;
const JUMP_VELOCITY = -400;
const GRAVITY = 900;
const ATTACK_RANGE = 100;
const ATTACK_COOLDOWN = 500;
const MAX_HEALTH = 100;

const ROUND_TIME = 60;

// import PlayerSelectScene from './player_select_scene.js';


class KidsFightScene extends Phaser.Scene {
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
    this.player1State = 'idle'; // 'idle', 'down', 'attack', 'special'
    this.player2State = 'idle';
    // console.log('[constructor] timeLeft:', this.timeLeft, 'ROUND_TIME:', typeof ROUND_TIME !== 'undefined' ? ROUND_TIME : 'undefined');
  }

  init(data) {
    this.selected = data || { p1: 0, p2: 1 };
  }

  preload() {
    // Load player sprite sheets (256x256)
    this.load.image('player1_raw', 'sprites-bento3.png');
    this.load.image('player2_raw', 'sprites-davir3.png');
    // Load scenario background
    this.load.image('scenario1', 'scenario1.png');
    // Load particle spritesheet for effects
    //this.load.atlas('flares', 'flares.png', 'flares.json');
  }

  create() {
    // --- CREATE CUSTOM SPRITESHEETS FIRST ---
    // Player 1
    if (!this.textures.exists('player1')) {
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
      const frameWidths2 = [300, 300, 400, 460, 500, 400, 400, 400];
      const frameHeight2 = 512;
      const player2Texture = this.textures.get('player2_raw').getSourceImage();
      this.textures.addSpriteSheet('player2', player2Texture, {
        frameWidth: 400,
        frameHeight: frameHeight2,
        startFrame: 0,
        endFrame: frameWidths2.length - 1
      });
      const tex2 = this.textures.get('player2');
      tex2.frames = { __BASE: tex2.frames['__BASE'] };
      let x2 = 0;
      for (let i = 0; i < frameWidths2.length; i++) {
        tex2.add(i, 0, x2, 0, frameWidths2[i], frameHeight2);
        x2 += frameWidths2[i];
      }
    }
    // Add background image
    const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'scenario1').setOrigin(0.5, 0.5);
    bg.displayWidth = GAME_WIDTH;
    bg.displayHeight = GAME_HEIGHT;

    // Ensure world and camera bounds match the visible area (for mobile/responsive)
    const cam = this.cameras.main;
    if (this.isTouch) {
      // Decrease bounds by 10% on each side for mobile
      const padX = cam.width * 0.1;
      const padY = cam.height * 0.05;
      this.physics.world.setBounds(padX, padY, cam.width - 2 * padX, cam.height - 2 * padY);
      this.cameras.main.setBounds(padX, padY, cam.width - 2 * padX, cam.height - 2 * padY);
    } else {
      this.physics.world.setBounds(0, 0, cam.width, cam.height);
      this.cameras.main.setBounds(0, 0, cam.width, cam.height);
    }
    // --- TOUCH CONTROLS ---
    this.touchControls = { p1: {}, p2: {} };
    // Robust touch detection (works on iOS and all browsers)
    const debugAlwaysShowTouch = false; // set to true to force show for debugging
    this.isTouch = debugAlwaysShowTouch || (typeof window !== 'undefined' && (
      (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
      ('ontouchstart' in window)
    ));
    if (this.isTouch) {
      const cam = this.cameras.main;
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
        btn.on('pointerdown', ()=>{flagObj[flag]=true;});
        btn.on('pointerup', ()=>{flagObj[flag]=false;});
        btn.on('pointerout', ()=>{flagObj[flag]=false;});
        btn.on('pointerupoutside', ()=>{flagObj[flag]=false;});
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
  const playerSprites = ['player1', 'player2'];
  const scale = 0.4;
  const frameHeight = 512;
  const player1FrameWidths = [300, 300, 430, 580, 580, 440, 440, 440];

  // Align player feet to the ground (bottom of the screen)
  const frameWidth = player1FrameWidths[0];
  const bodyWidth = frameWidth * scale;
  const bodyHeight = frameHeight * scale;
  // player.y is the center, so set: playerY = GAME_HEIGHT - (this.textures.get('player1').getSourceImage().height * scale) / 2;
// But we can use the actual sprite height after creation for precision
  let playerY;
  // We'll set playerY after creating the sprite and scaling it.
  const PLATFORM_Y = 230;
  const PLATFORM_HEIGHT = 20;
  // Add background image
  
  bg.displayWidth = GAME_WIDTH;
  bg.displayHeight = GAME_HEIGHT;

  // Draw the platform rectangle above the background
  const platformRect = this.add.rectangle(GAME_WIDTH / 2, PLATFORM_Y + PLATFORM_HEIGHT / 2, GAME_WIDTH, PLATFORM_HEIGHT, 0x8B5A2B).setDepth(2).setVisible(false);
  // Add static physics body for the platform
  const platform = this.physics.add.staticGroup();
  platform.create(GAME_WIDTH / 2, PLATFORM_Y + PLATFORM_HEIGHT / 2, null)
    .setDisplaySize(GAME_WIDTH, PLATFORM_HEIGHT)
    .setVisible(false)
    .refreshBody();

  // --- DEFENSIVE: Ensure valid selected and sprite keys ---
  const playerSpritesSafe = ['player1', 'player2'];
  const selectedSafe = (this.selected && typeof this.selected.p1 === 'number' && typeof this.selected.p2 === 'number') ? this.selected : { p1: 0, p2: 1 };
  const p1Key = playerSpritesSafe[selectedSafe.p1] || 'player1';
  const p2Key = playerSpritesSafe[selectedSafe.p2] || 'player2';
  const PLAYER_PLATFORM_OFFSET = 20;
  this.player1 = this.physics.add.sprite(200, PLATFORM_Y + PLAYER_PLATFORM_OFFSET, p1Key, 0);
  this.player1.setScale(scale);
  this.player1.setOrigin(0.5, 1); // bottom center
  this.player1.body.setSize(this.player1.displayWidth, this.player1.displayHeight);
  this.player1.body.setOffset(0, 0);
  // Enable collision with platform
  this.physics.add.collider(this.player1, platform);
  this.player1.setCollideWorldBounds(true);
  this.player1.setBounce(0.1);
  this.player1.health = MAX_HEALTH;
  this.player1.facing = 1;

      this.player2 = this.physics.add.sprite(600, PLATFORM_Y + PLAYER_PLATFORM_OFFSET, p2Key, 0);
  this.player2.setScale(scale);
  this.player2.setOrigin(0.5, 1); // bottom center
  this.player2.body.setSize(this.player2.displayWidth, this.player2.displayHeight);
  this.player2.body.setOffset(0, 0);
  // Enable collision with platform
  this.physics.add.collider(this.player2, platform);
  this.player2.setCollideWorldBounds(true);
  this.player2.setBounce(0.1);
  this.player2.health = MAX_HEALTH;
  this.player2.facing = -1;
  this.player2.setFlipX(true); // Invert horizontally

    // Player 1 Animations (custom frames)
    if (!this.anims.exists('p1_idle')) {
      this.anims.create({
        key: 'p1_idle',
        frames: [{ key: 'player1', frame: 0 }],
        frameRate: 1,
        repeat: -1
      });
    }
    if (!this.anims.exists('p1_walk')) {
      this.anims.create({
        key: 'p1_walk',
        frames: [
          { key: 'player1', frame: 1 },
          { key: 'player1', frame: 2 }
        ],
        frameRate: 6,
        repeat: -1
      });
    }
    if (!this.anims.exists('p1_attack')) {
      this.anims.create({
        key: 'p1_attack',
        frames: [{ key: 'player1', frame: 4 }], // Use frame 4 for hit
        frameRate: 1,
        repeat: 0,
        duration: 200 // Show hit frame for 200ms
      });
    }
    if (!this.anims.exists('p1_special')) {
      this.anims.create({
        key: 'p1_special',
        frames: [{ key: 'player1', frame: 6 }], // Use frame 6 for special
        frameRate: 1,
        repeat: 0,
        duration: 900 // Show special frame for 900ms
      });
    }
    // Down/crouch animations
    if (!this.anims.exists('p1_down')) {
      this.anims.create({
        key: 'p1_down',
        frames: [{ key: 'player1', frame: 5 }], // Use 6th image (index 5)
        frameRate: 1,
        repeat: -1
      });
    }

    // Animations
    if (!this.anims.exists('p2_idle')) {
      this.anims.create({
        key: 'p2_idle',
        frames: [{ key: 'player2', frame: 0 }],
        frameRate: 1,
        repeat: -1
      });
    }
    if (!this.anims.exists('p2_walk')) {
      this.anims.create({
        key: 'p2_walk',
        frames: [
          { key: 'player2', frame: 0 },
          { key: 'player2', frame: 1 }
        ],
        frameRate: 6,
        repeat: -1
      });
    }
    if (!this.anims.exists('p2_attack')) {
      this.anims.create({
        key: 'p2_attack',
        frames: [{ key: 'player2', frame: 4 }], // Use frame 4 for hit
        frameRate: 1,
        repeat: 0,
        duration: 200 // Show hit frame for 200ms
      });
    }
    if (!this.anims.exists('p2_down')) {
      this.anims.create({
        key: 'p2_down',
        frames: [{ key: 'player2', frame: 5 }], // Use 6th image (index 5)
        frameRate: 1,
        repeat: -1
      });
    }
    if (!this.anims.exists('p2_special')) {
      this.anims.create({
        key: 'p2_special',
        frames: [{ key: 'player2', frame: 6 }], // Use frame 6 for special
        frameRate: 1,
        repeat: 0,
        duration: 900 // Show special frame for 900ms
      });
    }
    this.player1.play('p1_idle');
    this.player1.angle = 0;
    this.player2.angle = 0;
    // Reset loser y offset (in case of rematch)
    this.playerY = playerY; // Store globally for use in endGame
    if (!this.gameOver) this.player2.play('p2_idle');
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
    // Global keydown debug (disable for touch)
    if (!this.isTouch) {
      window.addEventListener('keydown', function(e) {
        ('Key pressed:', e.key, 'code:', e.code);
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

    // Timer text display
    this.timerText = this.add.text(GAME_WIDTH / 2, 50, Math.ceil(this.timeLeft), {
      fontSize: '32px',
      color: '#fff',
      fontFamily: 'monospace',
      align: 'center',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // --- FORCE RESIZE after scene (re)start ---
    if (typeof resizeGame === 'function') {
      resizeGame(this.game);
    }
    // Update all scene layout to match new size
    this.updateSceneLayout();
    // Listen for Phaser's resize event and re-apply CSS AND update layout
    this.scale.on('resize', () => {
      if (typeof applyGameCss === 'function') {
        applyGameCss();
      }
      if (typeof this.updateSceneLayout === 'function') {
        this.updateSceneLayout();
      }
    });
  }


  update(time, delta) {
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
    if (!this.gameOver) {
      if (typeof this.lastTimerUpdate !== 'number' || isNaN(this.lastTimerUpdate)) this.lastTimerUpdate = time;
      if (typeof this.timeLeft !== 'number' || isNaN(this.timeLeft)) {
        this.timeLeft = ROUND_TIME;
      }
      const timerElapsed = Math.floor((time - this.lastTimerUpdate) / 1000);
      if (timerElapsed > 0) {
        this.timeLeft = Math.max(0, this.timeLeft - timerElapsed);
        this.lastTimerUpdate += timerElapsed * 1000;
      }
    }
    // Update timer display
    if (this.timerText) this.timerText.setText(Math.ceil(this.timeLeft));
    // Check win/lose by health
    // Health-based win detection
    if (!this.gameOver && this.player1 && this.player2) {
      if (this.player1.health <= 0) {
        this.endGame('Davi R Venceu!');
        return;
      } else if (this.player2.health <= 0) {
        this.endGame('Bento Venceu!');
        return;
      }
    }
    if (this.timeLeft === 0) {
      if (this.player1.health > this.player2.health) {
        this.endGame('Bento Venceu!');
      } else if (this.player2.health > this.player1.health) {
        this.endGame('Davi R Venceu!');
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
        if (this.keys.a.isDown) {
          p1.setVelocityX(-PLAYER_SPEED);
          p1Moving = true;
        }
        if (this.keys.d.isDown) {
          p1.setVelocityX(PLAYER_SPEED);
          p1Moving = true;
        }
        if (this.keys.w.isDown && p1.onFloor()) p1.setVelocityY(JUMP_VELOCITY);
      }
      // Player 1 walk animation
      if (
        this.player1State === 'idle' &&
        p1Moving &&
        p1.onFloor() &&
        !this.gameOver
      ) {
        if (this.player1.anims.currentAnim?.key !== 'p1_walk') {
          this.player1.play('p1_walk', true);
        }
      } else if (
        this.player1State === 'idle' &&
        this.player1.anims.currentAnim?.key === 'p1_walk' &&
        !this.gameOver
      ) {
        this.player1.play('p1_idle', true);
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
        if (this.cursors.left.isDown) {
          p2.setVelocityX(-PLAYER_SPEED);
          p2Moving = true;
        }
        if (this.cursors.right.isDown) {
          p2.setVelocityX(PLAYER_SPEED);
          p2Moving = true;
        }
        if (this.cursors.up.isDown && p2.onFloor()) p2.setVelocityY(JUMP_VELOCITY);
      }
      // Player 2 walk animation
      if (
        this.player2State === 'idle' &&
        p2Moving &&
        p2.onFloor() &&
        !this.gameOver
      ) {
        if (this.player2.anims.currentAnim?.key !== 'p2_walk') {
          this.player2.play('p2_walk', true);
        }
      } else if (
        this.player2State === 'idle' &&
        this.player2.anims.currentAnim?.key === 'p2_walk' &&
        !this.gameOver
      ) {
        this.player2.play('p2_idle', true);
      }
    }

    // Player 1 crouch (S or N key)
    if (!this.gameOver) {
      if (this.player1State === 'attack' || this.player1State === 'special') {
        // Do not interrupt attack/special
      } else if (this.keys && ((this.keys.n && this.keys.n.isDown) || (this.keys.s && this.keys.s.isDown))) {
        if (this.player1State !== 'down') {
          this.player1.play('p1_down', true);
          this.player1State = 'down';
        }
      } else {
        if (this.player1State !== 'idle') {
          this.player1.play('p1_idle', true);
          this.player1State = 'idle';
        }
      }
    }
    // Player 2 crouch (Down arrow or ; key)
    if (!this.gameOver) {
      if (this.player2State === 'attack' || this.player2State === 'special') {
        // Do not interrupt attack/special
      } else if ((this.cursors && this.cursors.down && this.cursors.down.isDown) || (this.keys && this.keys.semicolon && this.keys.semicolon.isDown)) {
        if (this.player2State !== 'down') {
          this.player2.play('p2_down', true);
          this.player2.setFlipX(true);
          this.player2State = 'down';
        }
      } else {
        if (this.player2State !== 'idle') {
          this.player2.play('p2_idle', true);
          this.player2.setFlipX(true);
          this.player2State = 'idle';
        }
      }
    }

    // Player 1 attack (V key or touch)
    if ((this.keys && this.keys.v && Phaser.Input.Keyboard.JustDown(this.keys.v)) || this._touchJustPressedP1A) {
      this._touchJustPressedP1A = false;
      if (this.player1State !== 'attack' && this.player1State !== 'special') {
        this.player1.play('p1_attack', true);
        this.player1State = 'attack';
        // Manually switch to idle after 400ms
        this.time.delayedCall(200, () => {
    });
  }
}

// ...

// Import pure utilities for testability
const { updateSceneLayout, applyGameCss, tryAttack } = require('./gameUtils');

// Dynamically update all scene layout to match current viewport size
KidsFightScene.prototype.updateSceneLayout = function() {
  return updateSceneLayout(this);
}

// ...
    parent.style.width = 'calc(100vw - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px))';
    parent.style.height = 'calc(100vh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))';
    parent.style.maxWidth = '100vw';
    parent.style.maxHeight = '100vh';
    parent.style.background = '#222';
  }
}

function resizeGame(game) {
  // Use window.innerWidth/innerHeight for true viewport size (accounts for mobile browser UI)
  const w = window.innerWidth;
  const h = window.innerHeight;
  game.scale.resize(w, h);
  applyGameCss();
}


// --- Responsive Touch Controls Positioning ---
KidsFightScene.prototype.updateControlPositions = function() {
  if (!this.isTouch || !this.touchControls || !this.cameras || !this.cameras.main) return;
  const cam = this.cameras.main;
  const w = cam.width;
  const h = cam.height;
  // Player 1
  this.touchControls.p1.left.setPosition(w * 0.08, h * 0.85);
  this.touchControls.p1.right.setPosition(w * 0.18, h * 0.85);
  this.touchControls.p1.jump.setPosition(w * 0.13, h * 0.7);
  this.touchControls.p1.down.setPosition(w * 0.13, h * 0.97);
  this.touchControls.p1.attack.setPosition(w * 0.28, h * 0.89);
  this.touchControls.p1.special.setPosition(w * 0.36, h * 0.89);
  // Player 2
  this.touchControls.p2.left.setPosition(w * 0.82, h * 0.85);
  this.touchControls.p2.right.setPosition(w * 0.92, h * 0.85);
  this.touchControls.p2.jump.setPosition(w * 0.87, h * 0.7);
  this.touchControls.p2.down.setPosition(w * 0.87, h * 0.97);
  this.touchControls.p2.attack.setPosition(w * 0.72, h * 0.89);
  this.touchControls.p2.special.setPosition(w * 0.64, h * 0.89);
  // Labels (order must match creation)
  if (this.touchLabels && this.touchLabels.length === 12) {
    this.touchLabels[0].setPosition(w * 0.06, h * 0.83);
    this.touchLabels[1].setPosition(w * 0.16, h * 0.83);
    this.touchLabels[2].setPosition(w * 0.11, h * 0.68);
    this.touchLabels[3].setPosition(w * 0.11, h * 0.95);
    this.touchLabels[4].setPosition(w * 0.25, h * 0.87);
    this.touchLabels[5].setPosition(w * 0.33, h * 0.87);
    this.touchLabels[6].setPosition(w * 0.79, h * 0.83);
    this.touchLabels[7].setPosition(w * 0.89, h * 0.83);
    this.touchLabels[8].setPosition(w * 0.84, h * 0.68);
    this.touchLabels[9].setPosition(w * 0.84, h * 0.95);
    this.touchLabels[10].setPosition(w * 0.69, h * 0.87);
    this.touchLabels[11].setPosition(w * 0.61, h * 0.87);
  }
}

window.onload = () => {
  // Set initial size to fit screen
  config.width = window.innerWidth;
  config.height = window.innerHeight;
  config.scale.width = window.innerWidth;
  config.scale.height = window.innerHeight;
  const game = new Phaser.Game(config);
  // Initial resize to account for mobile browser UI
  resizeGame(game);

  // Helper: double-resize to fix mobile browser chrome issues
  function resizeWithDelay() {
    resizeGame(game);
    setTimeout(() => resizeGame(game), 250); // Second resize after browser chrome settles
  }

  window.addEventListener('resize', resizeWithDelay);
  window.addEventListener('orientationchange', resizeWithDelay);
};
