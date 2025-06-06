import Phaser from 'phaser';
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
import player9RawImg from './sprites-d_isa.png';

import { WebSocketManager } from './websocket_manager'; // This is a singleton instance, not a class
import { tryAttack, KidsFightScene as KidsFightSceneTest } from './gameUtils.cjs';
import { time } from 'console';
const getCharacterName = KidsFightSceneTest.prototype.getCharacterName;

interface PlayerProps {
  isAttacking: boolean;
  isBlocking: boolean;
  health: number;
  special: number;
  direction: 'left' | 'right';
  walkAnimData?: {
    frameTime: number;
    currentFrame: number;
    frameDelay: number;
  };
}

// Combined Player type with both our properties and Phaser sprite properties
// Extended Player interface with all required properties
interface Player extends Phaser.Physics.Arcade.Sprite {
  // Core properties
  playerNum: number;
  health: number;
  special: number;
  isAttacking: boolean;
  isBlocking: boolean;
  facingRight: boolean;
  direction: 'left' | 'right';
  walkAnimData?: {
    frameTime: number;
    currentFrame: number;
    frameDelay: number;
  };
  // Phaser sprite overrides
  setGravityY(value: number): this;
  setBounce(value: number): this;
  setCollideWorldBounds(value: boolean): this;
  setSize(width: number, height: number): this;
  setOffset(x: number, y: number): this;
  play(key: string, ignoreIfPlaying?: boolean): this;
}

interface SceneData {
  selected: { p1: string; p2: string };
  p1: string;
  p2: string;
  selectedScenario: string;
  scenario?: string; // Add this property to support legacy code
  roomCode?: string;
  isHost?: boolean;
  gameMode: 'single' | 'online';
  p1Char?: string;
  p2Char?: string;
  wsManager?: WebSocketManager;
}

// --- Replay/Restart Data Types ---
interface ReplayData {
  action: string;
  [key: string]: any;
}

// Utility: Detect if the screen is in landscape orientation
export function isLandscape(): boolean {
  // In test, window may not exist
  if (typeof window === 'undefined') return true;
  return window.innerWidth > window.innerHeight;
}

// Extracted: Utility to stretch a background image to fill a given area
export function stretchBackgroundToFill(bg: any, width: number, height: number): void {
  if (!bg) return;
  const sprite = bg as Phaser.GameObjects.Sprite;
  sprite.displayWidth = width;
  sprite.displayHeight = height;
}

const GAME_WIDTH = 800;
const GAME_HEIGHT = 480;
const MAX_HEALTH = 100; // Each health bar represents this amount of health
const TOTAL_HEALTH = MAX_HEALTH; // Total health per player
const SECONDS_BETWEEN_ATTACKS = 0.5;
const ATTACK_DAMAGE = 5; // Reduced to make game longer (20 hits to win)
const SPECIAL_DAMAGE = 10; // Reduced to maintain 2x ratio
const ATTACK_COOLDOWN = 500; // ms
const SPECIAL_COOLDOWN = 1000; // ms
const SPECIAL_ANIMATION_DURATION = 900; // ms
const REGULAR_ANIMATION_DURATION = 200; // ms
const DEV = true; // Debug mode flag

// Accept Phaser as a constructor parameter for testability
interface GameObject extends Phaser.GameObjects.GameObject {
  text?: string;
  setText?: (text: string) => void;
  setColor?: (color: string) => void;
  setAlpha?: (alpha: number) => void;
  setVisible?: (visible: boolean) => void;
}

interface RemoteAction {
  type: 'move' | 'jump' | 'attack' | 'special' | 'block' | 'position_update';
  playerIndex: number;
  direction?: number;
  active?: boolean;
  // For position_update
  x?: number;
  y?: number;
  velocityX?: number;
  velocityY?: number;
  flipX?: boolean;
  frame?: number;
}

interface ReplayData {
  // Add any replay-specific data here
}

// Add Phaser type declaration to fix TypeScript errors
declare module 'phaser' {
  namespace Phaser {
    interface Scene {
      add: InstanceType<typeof Phaser.GameObjects.GameObjectFactory>;
      physics: InstanceType<typeof Phaser.Physics.Arcade.ArcadePhysics>;
      input: InstanceType<typeof Phaser.Input.InputPlugin>;
      sys: any;
      load: InstanceType<typeof Phaser.Loader.LoaderPlugin>;
    }
  }
}

class KidsFightScene extends Phaser.Scene {
  // Game constants - marked as static readonly since they don't change
  public static readonly GAME_WIDTH: number = 800;
  public static readonly GAME_HEIGHT: number = 600;
  public static readonly PLATFORM_HEIGHT: number = 20;
  public static readonly UPPER_PLATFORM_Y: number = 300;
  public static readonly UPPER_PLATFORM_Y2: number = 450;
  public static readonly PLAYER_SPEED: number = 200;
  public static readonly JUMP_FORCE: number = -500;
  public static readonly ATTACK_RANGE: number = 50;
  public static readonly ATTACK_DAMAGE: number = 5;
  public static readonly SPECIAL_DAMAGE: number = 10;
  public static readonly BLOCK_DURATION: number = 1000;
  public static readonly HIT_STUN_DURATION: number = 500;
  public static readonly MAX_HEALTH: number = 100;
  public static readonly MAX_SPECIAL: number = 100;
  public static readonly SPECIAL_COST: number = 30;
  public static readonly ROUND_TIME: number = 99;
  public static readonly POSITION_UPDATE_INTERVAL: number = 100; // ms
  
  // Game state
  private playersReady: boolean = false;
  private gameOver: boolean = false;
  private isReady: boolean = false;
  private gameStarted: boolean = false;
  // Removed duplicate declarations for replayRequested, restarting, and replayPopupShown. These are already declared above in the class.
  private touchControlsVisible: boolean = false;
  private isInitialized: boolean = false;
  private sceneInitialized: boolean = false;
  
  // Player state
  public players: [Player | null, Player | null] = [null, null];
  public localPlayerIndex: number = 0;
  private playerHealth: number[] = [KidsFightScene.MAX_HEALTH, KidsFightScene.MAX_HEALTH];
  private playerSpecial: number[] = [0, 0];
  private playerDirection: ('left' | 'right')[] = ['right', 'left'];
  private isAttacking: boolean[] = [false, false];
  private playerBlocking: boolean[] = [false, false];
  private lastAttackTime: number[] = [0, 0];
  private lastSpecialTime: number[] = [0, 0];
  private attackCount: number[] = [0, 0];
  // (all other duplicate player state fields later in the class are removed)
  
  // Timing
  private roundStartTime: number = 0;
  private roundEndTime: number = 0;
  private lastUpdateTime: number = 0;
  private lastPositionUpdate: number = 0;
  private timeLeft: number = KidsFightScene.ROUND_TIME;
  
  // Game objects and UI
  private platform?: Phaser.GameObjects.Rectangle;
  private background?: Phaser.GameObjects.Image;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private attackHitboxes!: Phaser.Physics.Arcade.Group;
  private specialHitboxes!: Phaser.Physics.Arcade.Group;
  private healthBarBg1?: Phaser.GameObjects.Rectangle;
  private healthBarBg2?: Phaser.GameObjects.Rectangle;
  private healthBar1?: Phaser.GameObjects.Graphics;
  private healthBar2?: Phaser.GameObjects.Graphics;
  private scoreText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private countdownText!: Phaser.GameObjects.Text;
  private winnerText!: Phaser.GameObjects.Text;
  private healthBars: Phaser.GameObjects.Graphics[] = [];
  private specialBars: Phaser.GameObjects.Graphics[] = [];
  // Removed duplicate property declarations for specialPips1, specialPips2, specialReadyText1, specialReadyText2, cursors, keys, touchControls, touchStartY, touchControlsVisible, wsManager, roomCode, isHost, gameMode, selected, selectedScenario, and p1. These are already declared above in the class.
  private p2: string = 'player2';
  private p1SpriteKey: string = 'player1';
  private p2SpriteKey: string = 'player2';
  
  // Character and animation data
  private characterFrameWidths: Record<string, number[]> = {};
  private _cascade_prevScenarioCallback: ((event: MessageEvent) => void) | null = null;
  private _lastSentPosition: { 
    x: number; 
    y: number; 
    velocityX: number; 
    velocityY: number; 
    flipX: boolean; 
    frame: any 
  } | null = null;
  
  // Effects and UI state
  private hitEffects: Phaser.GameObjects.Arc[] = [];
  private replayPopupElements: Phaser.GameObjects.GameObject[] = [];
  // Removed duplicate declarations for replayRequested, restarting, and replayPopupShown. These are already declared above in the class.
  
  // Custom keyboard support
  private customKeyboard: any = null;

  /**
   * Returns the current timestamp in ms. Used for attack cooldowns and timing.
   */
  private getTime(): number {
    return Date.now();
  }

  private syncLegacyPlayerRefs() {
    if (this.players[0]) this.player1 = this.players[0];
    if (this.players[1]) this.player2 = this.players[1];
  }

  // Initialization methods
  init(data: SceneData): void {
    console.log('[KidsFightScene][init] Initializing with data:', data);
    
    // Validate and set player character keys
    this.p1 = this.validateCharacterKey(data?.p1Char || data?.p1 || data?.selected?.p1 || 'player1');
    this.p2 = this.validateCharacterKey(data?.p2Char || data?.p2 || data?.selected?.p2 || 'player2');
    
    // Set scenario
    this.selectedScenario = data?.scenario || data?.selectedScenario || 'scenario1';
    
    // Set game mode and online properties
    this.gameMode = data?.gameMode || 'single';
    this.isHost = data?.isHost || false;
    this.roomCode = data?.roomCode;
    
    // Set WebSocket manager if provided
    if (data?.wsManager) {
      this.wsManager = data.wsManager;
      console.log('[KidsFightScene][init] WebSocket manager set');
    }
    
    // Set local player index based on host status in online mode
    if (this.gameMode === 'online') {
      this.localPlayerIndex = this.isHost ? 0 : 1;
    } else {
      this.localPlayerIndex = 0; // In local mode, player 1 is always the local player
    }
    
    // Reset health and special meters
    this.playerHealth = [KidsFightScene.MAX_HEALTH, KidsFightScene.MAX_HEALTH];
    this.playerSpecial = [0, 0];
    
    // Reset initialization flags
    this.isInitialized = false;
    this.sceneInitialized = false;
    this.playersReady = false;
    this.gameStarted = false;
    
    console.log('[KidsFightScene][init] Initialization complete:', {
      p1: this.p1,
      p2: this.p2,
      selectedScenario: this.selectedScenario,
      gameMode: this.gameMode,
      isHost: this.isHost,
      localPlayerIndex: this.localPlayerIndex
    });
  }

  preload(): void {
    console.log('[KidsFightScene][preload] Starting asset loading');
    
    try {
      // Load scenario images
      console.log('[KidsFightScene][preload] Loading scenario images');
      this.load.image('scenario1', scenario1Img);
      this.load.image('scenario2', scenario2Img);
      console.log('[KidsFightScene][preload] Scenario images loaded');
      
      // Verify load queue
      const queue = this.load.list.getQueue();
      console.log('[KidsFightScene][preload] Current load queue:', queue);
    } catch (error) {
      console.error('[KidsFightScene][preload] Error during preload:', error);
      throw error;
    }
    
    // Load player spritesheets with consistent frame sizes
    const characterSprites = [
      { key: 'player1', img: player1RawImg },
      { key: 'player2', img: player2RawImg },
      { key: 'bento', img: player3RawImg },
      { key: 'davir', img: player4RawImg },
      { key: 'jose', img: player5RawImg },
      { key: 'davis', img: player6RawImg },
      { key: 'carol', img: player7RawImg },
      { key: 'roni', img: player8RawImg },
      { key: 'jacqueline', img: player9RawImg },
      { key: 'ivan', img: player1RawImg },
      { key: 'd_isa', img: player2RawImg }
    ];

    // Load each character's spritesheet
    characterSprites.forEach(char => {
      this.load.spritesheet(char.key, char.img, { 
        frameWidth: 410, 
        frameHeight: 400 
      });
    });

    // Debug log for loaded keys
    const loadedKeys = characterSprites.map(c => c.key);
    console.log('[KidsFightScene][preload] Loaded character keys:', loadedKeys);

    // Wait for all files to load before creating spritesheets
    this.load.once('complete', () => {
      console.log('[KidsFightScene][preload] All assets loaded, creating spritesheets');
      // Process spritesheets and continue with game setup
      this.createVariableWidthSpritesheets();
    });
  }

  // Removed duplicate property declarations. All these properties are already declared above in the class. This block is deleted to ensure only one declaration per property exists.  private touchControlsVisible = false;
  private touchStartY = 0;
  private attackCount: number[] = [0, 0];
  private replayRequested = false;
  private restarting = false;
  private replayPopupShown = false;
  private lastPositionUpdate = 0;
  
  // Input
  private keys!: {
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    up: Phaser.Input.Keyboard.Key;
    attack: Phaser.Input.Keyboard.Key;
    special: Phaser.Input.Keyboard.Key;
    block: Phaser.Input.Keyboard.Key;
    v: Phaser.Input.Keyboard.Key;
    b: Phaser.Input.Keyboard.Key;
    k: Phaser.Input.Keyboard.Key;
    l: Phaser.Input.Keyboard.Key;
  };
  
  // Multiplayer
  private wsManager!: WebSocketManager;
  private roomCode?: string;
  private isHost = false;
  private gameMode: 'single' | 'online' = 'single';
  private selected: { p1: string; p2: string } = { p1: 'player1', p2: 'player2' };
  private p1SpriteKey = 'player1';
  private p2SpriteKey = 'player2';
  private players: [Player | null, Player | null] = [null, null];
  
  // Physics groups
  private attackHitboxes!: Phaser.Physics.Arcade.Group;
  private specialHitboxes!: Phaser.Physics.Arcade.Group;
  
  // Animation data
  private characterFrameWidths: Record<string, number[]> = {};
  
  // Touch controls
  private touchControls: {
    left?: Phaser.GameObjects.Zone | Phaser.GameObjects.Rectangle;
    right?: Phaser.GameObjects.Zone | Phaser.GameObjects.Rectangle;
    jump?: Phaser.GameObjects.Zone | Phaser.GameObjects.Rectangle;
    attack?: Phaser.GameObjects.Zone | Phaser.GameObjects.Rectangle;
    special?: Phaser.GameObjects.Zone | Phaser.GameObjects.Rectangle;
    block?: Phaser.GameObjects.Zone | Phaser.GameObjects.Rectangle;
    leftButton?: Phaser.GameObjects.Rectangle;
    rightButton?: Phaser.GameObjects.Rectangle;
    jumpButton?: Phaser.GameObjects.Rectangle;
    attackButton?: Phaser.GameObjects.Rectangle;
    specialButton?: Phaser.GameObjects.Rectangle;
    blockButton?: Phaser.GameObjects.Rectangle;
  } = {};
  
  // Custom keyboard support
  private customKeyboard: any = null;

  /**
   * Sets up the game scene after assets are loaded and validated
   */
  private setupScene(): void {
    if (this.sceneInitialized) {
      console.log('[KidsFightScene][setupScene] Scene already set up, skipping');
      return;
    }

    console.log('[KidsFightScene][setupScene] Starting scene setup');
    
    try {
      // Set up camera and world bounds
      this.cameras.main.setBackgroundColor('#000000');
      this.physics.world.setBounds(0, 0, 4000, 800);
      this.cameras.main.setBounds(0, 0, 4000, 800);
      
      // Set up background
      this.setupBackground();
      
      // Set up platforms
      this.setupPlatforms();
      
      // Set up players
      this.setupPlayers();
      
      // Set up UI
      this.setupUI();
      
      // Set up input handlers
      this.setupInput();
      
      // Set up collision detection
      this.setupCollisions();
      
      this.sceneInitialized = true;
      console.log('[KidsFightScene][setupScene] Scene setup complete');
      
    } catch (error) {
      console.error('[KidsFightScene][setupScene] Error during scene setup:', error);
      throw error;
    }
  }
  
  private setupBackground(): void {
    // Add background based on selected scenario
    const bgKey = `background-${this.selectedScenario}`;
    if (this.textures.exists(bgKey)) {
      this.add.image(0, 0, bgKey).setOrigin(0, 0);
      console.log(`[KidsFightScene] Added background: ${bgKey}`);
    } else {
      console.warn(`[KidsFightScene] Background not found: ${bgKey}`);
      // Fallback to a solid color background
      this.cameras.main.setBackgroundColor('#87CEEB'); // Sky blue
    }
  }
  
  private setupPlatforms(): void {
    // Add platforms based on the selected scenario
    const platforms = this.physics.add.staticGroup();
    
    // Add ground
    platforms.create(2000, 750, 'ground').setScale(100, 2).refreshBody();
    
    // Add some platforms
    platforms.create(600, 600, 'ground');
    platforms.create(50, 450, 'ground');
    platforms.create(750, 400, 'ground');
    
    // Store platforms for collision detection
    this.platforms = platforms;
  }
  
  private createPlayer(characterKey: string, x: number, y: number, playerNum: number): Player {
    console.log(`[KidsFightScene] Creating player ${playerNum} with character: ${characterKey}`);
    
    // Create player sprite with physics
    const player = this.physics.add.sprite(x, y, characterKey) as Player;
    
    // Set up player physics
    player.setCollideWorldBounds(true);
    player.setBounce(0.2);
    player.setGravityY(300);
    
    // Set up player properties
    player.playerNum = playerNum;
    player.health = 100;
    player.isAttacking = false;
    player.isBlocking = false;
    player.facingRight = playerNum === 1; // Player 1 faces right, Player 2 faces left
    
    // Set up player animations
    this.anims.create({
      key: `${characterKey}-idle`,
      frames: this.anims.generateFrameNumbers(characterKey, { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1
    });
    
    this.anims.create({
      key: `${characterKey}-run`,
      frames: this.anims.generateFrameNumbers(characterKey, { start: 4, end: 7 }),
      frameRate: 10,
      repeat: -1
    });
    
    this.anims.create({
      key: `${characterKey}-jump`,
      frames: [{ key: characterKey, frame: 8 }],
      frameRate: 10
    });
    
    this.anims.create({
      key: `${characterKey}-attack`,
      frames: this.anims.generateFrameNumbers(characterKey, { start: 9, end: 11 }),
      frameRate: 10,
      repeat: 0
    });
    
    // Play idle animation by default
    player.play(`${characterKey}-idle`);
    
    return player;
  }

  private setupPlayers(): void {
    // Create player 1
    const player1 = this.createPlayer(this.p1, 300, 450, 1);
    this.players[0] = player1;
    
    // Create player 2
    const player2 = this.createPlayer(this.p2, 700, 450, 2);
    this.players[1] = player2;
    
    // Set up camera to follow players
    this.cameras.main.startFollow(player1, true, 0.1, 0.1);
    this.cameras.main.setZoom(1.5);
  }
  
  private setupUI(): void {
    // Add score text
    this.scoreText = this.add.text(16, 16, 'Player 1: 0  Player 2: 0', { 
      fontSize: '32px', 
      fill: '#fff',
      backgroundColor: 'rgba(0,0,0,0.5)',
      padding: { left: 10, right: 10, top: 5, bottom: 5 }
    });
    this.scoreText.setScrollFactor(0);
    
    // Add timer
    this.timerText = this.add.text(400, 16, 'Time: 99', {
      fontSize: '32px',
      fill: '#fff',
      backgroundColor: 'rgba(0,0,0,0.5)',
      padding: { left: 10, right: 10, top: 5, bottom: 5 }
    });
    this.timerText.setScrollFactor(0);
  }
  
  private setupInput(): void {
    // Set up keyboard input
    this.cursors = this.input.keyboard.createCursorKeys();
    
    // Set up gamepad input
    this.input.gamepad.on('down', (pad: Phaser.Input.Gamepad.Gamepad, button: Phaser.Input.Gamepad.Button) => {
      // Handle gamepad input
    });
  }
  
  private setupCollisions(): void {
    // Set up collision between players and platforms
    this.physics.add.collider(this.players[0], this.platforms);
    this.physics.add.collider(this.players[1], this.platforms);
    
    // Set up collision between players
    this.physics.add.collider(this.players[0], this.players[1]);
  }

  create() {
    console.log('[KidsFightScene][create] Starting scene creation');
    
    // Prevent multiple initializations
    if (this.sceneInitialized) {
      console.log('[KidsFightScene][create] Scene already initialized, skipping');
      return;
    }
    
    try {
      if (!this.sys) {
        throw new Error('Scene system not initialized');
      }
      
      console.log('[KidsFightScene][create] Scene system initialized, checking required properties', {
        p1: this.p1,
        p2: this.p2,
        selectedScenario: this.selectedScenario,
        gameMode: this.gameMode,
        roomCode: this.roomCode,
        isHost: this.isHost
      });
      
      // Validate required properties
      if (!this.p1 || !this.p2) {
        throw new Error(`Missing player character keys: p1=${this.p1}, p2=${this.p2}`);
      }
      
      if (!this.selectedScenario) {
        this.selectedScenario = 'scenario1';
        console.warn('[KidsFightScene][create] No scenario selected, using default');
      }
      
      // Mark scene as being initialized but not fully initialized yet
      this.sceneInitialized = true;
      
      // Initialize the scene
      this.setupScene();
      
    } catch (error) {
      console.error('[KidsFightScene][create] Error during initialization:', error);
      throw error;
    }
    
    try {
      // Set up camera and world bounds first
      const { width, height } = this.cameras.main;
      this.cameras.main.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
      this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
      
      // Set camera zoom to fit the game area
      const scaleX = width / GAME_WIDTH;
      const scaleY = height / GAME_HEIGHT;
      const zoomLevel = Math.min(scaleX, scaleY);
      this.cameras.main.setZoom(zoomLevel);
      this.cameras.main.centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
      
      // Initialize physics groups
      // Removed duplicate property assignments for platforms and background. These are already declared at the top of the class. Only assign values here, do not redeclare.
      
      console.log(`[KidsFightScene][create] Added and scaled scenario background: ${this.selectedScenario}`);
      
      // Platform setup
      const platformY = GAME_HEIGHT - 60; // Position platform near bottom of screen
      this.platform = this.add.rectangle(GAME_WIDTH / 2, platformY, GAME_WIDTH, 32, 0x999999);
      
      // Platform positions
      const upperPlatformY = GAME_HEIGHT - GAME_HEIGHT * 0.2;
      const upperPlatformY2 = 380;
      
      // --- PHYSICS PLATFORMS ---
      const upperPlatform = this.physics.add.staticGroup();
      upperPlatform.create(GAME_WIDTH / 2, upperPlatformY, null)
        .setDisplaySize(GAME_WIDTH, 32)
        .setVisible(false)
        .refreshBody();
      
      const upperPlatformVisual = this.add.rectangle(
        GAME_WIDTH / 2,
        upperPlatformY,
        GAME_WIDTH,
        32,
        0x888888
      );
      upperPlatformVisual.setDepth(0);
      upperPlatformVisual.setAlpha(0);

      const upperPlatform2 = this.physics.add.staticGroup();
      upperPlatform2.create(GAME_WIDTH / 2, upperPlatformY2, null)
        .setDisplaySize(GAME_WIDTH, 32)
        .setVisible(false)
        .refreshBody();
        
      const upperPlatformVisual2 = this.add.rectangle(
        GAME_WIDTH / 2,
        upperPlatformY2,
        GAME_WIDTH,
        32,
        0x888888
      );

      // Create player sprites
      console.log('[KidsFightScene][create] Creating player sprites with:', {
        p1: this.p1,
        p2: this.p2,
        selected: this.selected
      });
      
      if (!this.p1 || !this.p2) {
        console.error('Player keys not properly initialized:', { p1: this.p1, p2: this.p2 });
        return;
      }
      
      const playerScale = 0.4;
      const widerPlayers = ['player6', 'player7', 'player8', 'player9'];
      this.players = [null, null];
      
      try {
        // Create player 1
        const player1 = this.physics.add.sprite(
          GAME_WIDTH * 0.25,
          upperPlatformY2,
          this.p1
        );
        if (player1) {
          player1.setOrigin(0.5, 1.0);
          player1.setScale(playerScale);
          player1.y = upperPlatformY2;
          this.players[0] = player1 as Phaser.Physics.Arcade.Sprite & PlayerProps;
        }

        // Create player 2
        const player2 = this.physics.add.sprite(
          GAME_WIDTH * 0.75,
          upperPlatformY2,
          this.p2
        );
        if (player2) {
          player2.setOrigin(0.5, 1.0);
          player2.setScale(playerScale);
          player2.y = upperPlatformY2;
          player2.setFlipX(true);
          this.players[1] = player2 as Phaser.Physics.Arcade.Sprite & PlayerProps;
        }
        
        // Initialize legacy player refs
        this.syncLegacyPlayerRefs();
        
        console.log('[KidsFightScene][create] Player sprites created:', {
          p1: this.players[0] ? { x: this.players[0].x, y: this.players[0].y, texture: this.players[0].texture.key } : null,
          p2: this.players[1] ? { x: this.players[1].x, y: this.players[1].y, texture: this.players[1].texture.key } : null
        });
        
        // Enable collision between players and platforms
        if (this.players[0]) {
          this.physics.add.collider(this.players[0], upperPlatform);
          this.physics.add.collider(this.players[0], upperPlatform2);
        }
        if (this.players[1]) {
          this.physics.add.collider(this.players[1], upperPlatform);
          this.physics.add.collider(this.players[1], upperPlatform2);
        }
      } catch (error) {
        console.error('[KidsFightScene][create] Error creating player sprites:', error);
      }

      // Initialize player properties
      // --- FORCE HEALTH INIT TO 200 ---
      this.players.forEach((player, index) => {
        if (!player) return;
        const isPlayer1 = index === 0;
        player.setCollideWorldBounds?.(true);
        player.setBounce?.(0.2);
        player.setGravityY?.(300);
        player.setSize?.(80, 200);
        player.setOffset?.(92, 32);
        player.health = MAX_HEALTH;
        this.playerHealth[index] = MAX_HEALTH;
        player.special = 0;
        player.isBlocking = false;
        player.isAttacking = false;
        player.direction = isPlayer1 ? 'right' : 'left';
        console.log(`Created player ${index + 1} with sprite: ${isPlayer1 ? this.p1 : this.p2}`, {
          position: { x: player.x, y: player.y },
          direction: player.direction,
          health: player.health
        });
      });

      // After both players are assigned, mark them as ready
      this.playersReady = !!(this.players[0] && this.players[1]);
      console.log('[DEBUG] Both players assigned:', this.players);

      // Initialize the round time properly
      this.timeLeft = this.ROUND_TIME;
      this.roundStartTime = this.getTime();
      console.log('[DEBUG] Round time initialized to', this.timeLeft);

      // --- UI AND CONTROLS ---
      if (this.playersReady) {
        this.createUI();
        this.createTouchControls();
        console.log('[KidsFightScene][onSpritesheetsReady] UI and controls created');
      } else {
        console.warn('[DEBUG] Tried to create UI/controls before players were ready:', this.players);
      }

      // --- MULTIPLAYER HANDLING ---
      if (this.gameMode === 'online' && this.wsManager && typeof this.wsManager.connect === 'function') {
        console.log('[DEBUG][KidsFightScene] Registering message handler, players:', this.players);
        this.wsManager.connect().then(() => {
          console.log('[DEBUG] wsManager.onMessage callback registered in KidsFightScene.create');
          const prevCallback = this.wsManager._cascade_prevScenarioCallback || null;
          const self = this;
          this.wsManager.setMessageCallback(function(event: MessageEvent) {
            let handled = false;
            try {
              const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
              if (data && data.type === 'scenario_selected' && (data.scenario === 'scenario1' || data.scenario === 'scenario2')) {
                self.handleScenarioChange(data.scenario);
                handled = true;
              }
            } catch (e) {}
            if (prevCallback && typeof prevCallback === 'function' && !handled) prevCallback(event);
          });
          this.wsManager._cascade_prevScenarioCallback = prevCallback;
        });
      }

      // --- CONSOLIDATED HEALTH INITIALIZATION ---
      this.playerHealth = [MAX_HEALTH, MAX_HEALTH];
      if (this.players[0]) this.players[0].health = MAX_HEALTH;
      if (this.players[1]) this.players[1].health = MAX_HEALTH;
      console.log('[DEBUG] playerHealth and player objects initialized to MAX_HEALTH:', this.playerHealth);

      // Legacy compatibility for tests
      this.syncLegacyPlayerRefs();
    } catch (e) {
      console.error(e);
    }
    
    // Initialize character frame widths and continue with game setup
    this.createVariableWidthSpritesheets();
    
    // Mark as fully initialized only after everything is done
    this.isInitialized = true;
    
    console.log('[KidsFightScene][create] Scene creation complete, isInitialized =', this.isInitialized);
  }

  // After spritesheets are created, continue with game setup
  private afterSpritesheetsReady(): void {
    console.log('[KidsFightScene] Spritesheets ready, continuing game setup');
    
    // If we're already fully initialized, don't proceed
    if (this.isInitialized) {
      console.log('[KidsFightScene] Scene already fully initialized, skipping afterSpritesheetsReady');
      return;
    }
    
    try {
      // Set up the scene if not already done
      if (!this.sceneInitialized) {
        console.log('[KidsFightScene] Setting up scene from afterSpritesheetsReady');
        this.setupScene();
        this.sceneInitialized = true;
      }
      
      // Mark as fully initialized
      this.isInitialized = true;
      console.log('[KidsFightScene] Scene setup complete, isInitialized =', this.isInitialized);
    } catch (error) {
      console.error('[KidsFightScene] Error in afterSpritesheetsReady:', error);
      // Try to recover by restarting the scene
      try {
        console.log('[KidsFightScene] Attempting to restart scene...');
        this.scene.restart();
      } catch (restartError) {
        console.error('[KidsFightScene] Failed to restart scene:', restartError);
      }
      throw error; // Re-throw to ensure we see the original error in the console
    }
  }

  private handleScenarioChange(scenario: string): void {
    console.log('[KidsFightScene] Received scenario change:', scenario);
    if (typeof scenario === 'string' && (scenario === 'scenario1' || scenario === 'scenario2')) {
      this.selectedScenario = scenario;
      // Update the background if it's already created
      if (this.add && this.background) {
        this.background.setTexture(scenario);
      }
    }
  }
  
  // Update function runs every frame
  update(time: number, delta: number): void {
  // Don't update if game is over
  if (this.gameOver) {
    return;
  }
  

    // Only count down timer when players are ready
    if (this.playersReady && this.timeLeft > 0) {
      // Calculate elapsed time and update timer
      this.timeLeft -= delta / 1000; // Convert milliseconds to seconds
      
      // Ensure timeLeft never goes below 0
      if (this.timeLeft < 0) {
        this.timeLeft = 0;
      }
      
      // Debug: Log time every second (or when it changes by at least 1 unit)
      if (Math.floor(this.timeLeft) !== Math.floor((this.timeLeft + delta / 1000))) {
        console.log('[KidsFightScene][update] Time left:', this.timeLeft.toFixed(1));
      }
    }

    // Check for winner (but only if game is ready and not over yet)
    if (this.playersReady && !this.gameOver) {
      if (this.timeLeft <= 0) {
        console.log('[KidsFightScene][update] Time up! Checking winner.');
        // Time is up, determine the winner based on health
        let winnerIndex = -1;
        
        // Player 1 has more health
        if (this.playerHealth[0] > this.playerHealth[1]) {
          winnerIndex = 0;
        }
        // Player 2 has more health
        else if (this.playerHealth[1] > this.playerHealth[0]) {
          winnerIndex = 1;
        }
        // Both players have the same health - it's a draw
        else {
          winnerIndex = -1;
        }
        
        this.endGame(winnerIndex);
      } 
      // Check if either player's health is 0
      else if (this.playerHealth[0] <= 0) {
        console.log('[KidsFightScene][update] Player 1 health is 0, Player 2 wins.');
        this.endGame(1); // Player 2 wins
      } 
      else if (this.playerHealth[1] <= 0) {
        console.log('[KidsFightScene][update] Player 2 health is 0, Player 1 wins.');
        this.endGame(0); // Player 1 wins
      }
    }

    // Only continue with player updates if players are ready
    if (!this.playersReady) {
      return;
    }

    // Handle keyboard input for local players
    this.handleKeyboardInput();

    // Handle animation updates for player sprites
    this.updatePlayerAnimations();

    // Check for collisions between players and attacks
    this.handleCollisions();

    // Send position updates in online mode
    this.sendPositionUpdatesIfNeeded(time);
  }

  // Handle keyboard input
  private handleKeyboardInput(): void {
    // Process input only for the local player(s)
    if (!this.players || !this.players[this.localPlayerIndex]) {
      return;
    }

    const player = this.players[this.localPlayerIndex];
    
    // Skip input processing if player is null
    if (!player) return;
    
    // Get keyboard status
    const keyboardLeft = this.input.keyboard?.addKey('A');
    const keyboardRight = this.input.keyboard?.addKey('D');
    const keyboardJump = this.input.keyboard?.addKey('W');
    const keyboardAttack = this.input.keyboard?.addKey('J');
    const keyboardSpecial = this.input.keyboard?.addKey('K');
    const keyboardBlock = this.input.keyboard?.addKey('L');
    
    // Left movement
    if (keyboardLeft?.isDown) {
      player.setVelocityX(-160);
      player.setFlipX(true);
      this.playerDirection[this.localPlayerIndex] = 'left';
      if (this.gameMode === 'online' && this.wsManager) {
        this.wsManager.send({
          type: 'move',
          direction: -1,
          playerIndex: this.localPlayerIndex
        });
      }
    }
    // Right movement
    else if (keyboardRight?.isDown) {
      player.setVelocityX(160);
      player.setFlipX(false);
      this.playerDirection[this.localPlayerIndex] = 'right';
      if (this.gameMode === 'online' && this.wsManager) {
        this.wsManager.send({
          type: 'move',
          direction: 1,
          playerIndex: this.localPlayerIndex
        });
      }
    }
    // No horizontal movement
    else {
      player.setVelocityX(0);
    }
    
    // Jump (only if touching the ground)
    if (keyboardJump?.isDown && player.body?.touching?.down) {
      player.setVelocityY(-330);
      if (this.gameMode === 'online' && this.wsManager) {
        this.wsManager.send({
          type: 'jump',
          playerIndex: this.localPlayerIndex
        });
      }
    }
    
    // Attack
    if (keyboardAttack?.isDown && !this.isAttacking[this.localPlayerIndex]) {
      this.handleAttack();
    }
    
    // Special attack
    if (keyboardSpecial?.isDown && this.playerSpecial[this.localPlayerIndex] >= this.SPECIAL_COST) {
      this.handleSpecial();
    }
    
    // Blocking
    this.playerBlocking[this.localPlayerIndex] = keyboardBlock?.isDown || false;
  }

  // Update animations for both players
  private updatePlayerAnimations(): void {
    // Skip if players aren't ready
    if (!this.playersReady) return;
    
    // Update both players' animations
    this.players.forEach((player, index) => {
      if (!player) return;
      
      // Update player animation based on state
      this.updatePlayerAnimation(index);
    });
  }
  
  // Update a single player's animation
  private updatePlayerAnimation(playerIndex: number): void {
    const player = this.players[playerIndex];
    if (!player || !player.body) return;

    // Update animation based on player state
    if (player.getData('isAttacking')) {
      player.anims.play(`${player.texture.key}-attack`, true);
    } else if (player.getData('isBlocking')) {
      player.anims.play(`${player.texture.key}-block`, true);
    } else if (Math.abs(player.body.velocity.x) > 0) {
      player.anims.play(`${player.texture.key}-walk`, true);
    } else {
      player.anims.play(`${player.texture.key}-idle`, true);
    }
  
    
    // Determine current animation based on player state
    if (player.body?.velocity.y < 0) {
      // Jumping
      player.setFrame(1);
    } else if (player.body?.velocity.y > 0) {
      // Falling
      player.setFrame(2);
    } else if (player.body?.velocity.x !== 0) {
      // Walking
      if (!player.walkAnimData) {
        player.walkAnimData = {
          frameTime: 0,
          currentFrame: 0,
          frameDelay: 200 // milliseconds between frames
        };
      }
      
      // Update walk animation frames
      player.walkAnimData.frameTime += this.game.loop.delta;
      if (player.walkAnimData.frameTime >= player.walkAnimData.frameDelay) {
        player.walkAnimData.frameTime = 0;
        player.walkAnimData.currentFrame = (player.walkAnimData.currentFrame + 1) % 2;
        player.setFrame(player.walkAnimData.currentFrame);
      }
    } else if (this.playerBlocking[playerIndex]) {
      // Blocking
      player.setFrame(4);
    } else if (player.getData('isAttacking')) {
      // Attacking
      player.setFrame(3);
    } else if (player.getData('isSpecialAttacking')) {
      // Special attack
      player.setFrame(5);
    } else {
      // Idle
      player.setFrame(0);
    }
  }

  // Handle collisions between players, attacks, and platforms
  private handleCollisions(): void {
    // Skip if players aren't ready
    if (!this.playersReady) return;
    
    // Add collision handling as needed
    // This would typically check for attack hitboxes, special attacks, etc.
  }

  // Send position updates in online mode
  private sendPositionUpdatesIfNeeded(time: number): void {
    // Skip if not in online mode
    if (this.gameMode !== 'online' || !this.wsManager) return;
    
    // Only send updates for the local player
    const player = this.players[this.localPlayerIndex];
    if (!player) return;
    
    // Send position update every 100ms
    if (!this._lastSentPosition || time - (this._lastSentPosition.time || 0) > 100) {
      const curr = {
        time,
        x: player.x,
        y: player.y,
        velocityX: player.body?.velocity.x || 0,
        velocityY: player.body?.velocity.y || 0,
        flipX: player.flipX,
        frame: player.frame?.name || 0
      };
      
      // Only send if position has changed significantly
      const lastPos = this._lastSentPosition;
      if (!lastPos || 
          Math.abs(curr.x - lastPos.x) > 2 || 
          Math.abs(curr.y - lastPos.y) > 2 ||
          Math.abs(curr.velocityX - lastPos.velocityX) > 10 ||
          Math.abs(curr.velocityY - lastPos.velocityY) > 10 ||
          curr.flipX !== lastPos.flipX ||
          curr.frame !== lastPos.frame) {
        
        this.wsManager.send({
          type: 'position_update',
          playerIndex: this.localPlayerIndex,
          ...curr
        });
        
        this._lastSentPosition = { ...curr };
      }
    }
  }

  // End the game with specified winner
  private endGame(winnerIndex: number, message: string = ''): void {
    console.log(`[KidsFightScene][endGame] Game over! Winner: ${winnerIndex}`);
    
    // Set game over flag
    this.gameOver = true;
    
    // Stop physics
    this.physics.pause();
    
    // Determine winner message
    let winMsg = message;
    if (!message) {
      if (winnerIndex === 0) {
        winMsg = `${this.getDisplayName(this.p1)} Venceu!`;
      } else if (winnerIndex === 1) {
        winMsg = `${this.getDisplayName(this.p2)} Venceu!`;
      } else {
        winMsg = 'Empate!';
      }
    }
    
    // Visual effects for winner/loser
    if (winnerIndex === 0 || winnerIndex === 1) {
      const winner = this.players[winnerIndex];
      const loser = this.players[1 - winnerIndex];
      if (winner && loser) {
        winner.setFrame(0); // Victory pose
        loser.setFrame(2); // Defeated pose
        loser.setAngle(90); // Lay down loser
      }
    }
    
    // Show winner text
    const winnerText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      winMsg,
      {fontSize: '48px', fill: '#fff'}
    ).setOrigin(0.5).setDepth(100);
    
    // Add rematch and menu buttons
    this.createEndGameButtons();
  }

  // Create buttons for rematch and returning to menu
  private createEndGameButtons(): void {
    // Add rematch button
    const rematchBtn = this.add.text(
      this.cameras.main.width / 2 - 100,
      this.cameras.main.height / 2 + 80,
      'Jogar Novamente',
      {fontSize: '32px', fill: '#0f0', backgroundColor: '#222', padding: {left: 20, right: 20, top: 10, bottom: 10}}
    ).setOrigin(0.5).setInteractive().setDepth(101);
    
    // Add menu button
    const menuBtn = this.add.text(
      this.cameras.main.width / 2 + 100,
      this.cameras.main.height / 2 + 80,
      'Voltar ao Menu',
      {fontSize: '32px', fill: '#fff', backgroundColor: '#222', padding: {left: 20, right: 20, top: 10, bottom: 10}}
    ).setOrigin(0.5).setInteractive().setDepth(101);
    
    // Button click handlers
    rematchBtn.on('pointerdown', () => {
      if (this.gameMode === 'online' && this.wsManager) {
        // Online mode - send replay request
        const roomCode = this.roomCode || '';
        this.wsManager.sendReplayRequest(roomCode, this.isHost ? 'host' : 'guest');
        rematchBtn.setText('Aguardando...');
        rematchBtn.disableInteractive();
      } else {
        // Local mode - just restart
        this.scene.restart();
      }
    });
    
    menuBtn.on('pointerdown', () => {
      this.scene.start('GameModeScene');
    });
  }

  // Helper for display name - used throughout the class
  private getDisplayName(key: string): string {
    // Map known keys to real names, fallback to key if not found
    const nameMap: Record<string, string> = {
      player1: 'Player 1',
      player2: 'Player 2',
      bento: 'Bento',
      davir: 'Davir',
      jose: 'José',
      davis: 'Davis',
      carol: 'Carol',
      roni: 'Roni',
      jacqueline: 'Jacqueline',
      ivan: 'Ivan',
      d_isa: 'D. Isa'
    };
    return nameMap[key] || key;
  }

  // Validate and normalize character keys
  validateCharacterKey(key: string): string {
    console.log(`[KidsFightScene][validateCharacterKey] Validating key: ${key}`);
    
    // If key is undefined or null, use default
    if (!key) {
      console.warn('[KidsFightScene][validateCharacterKey] Key is undefined or null, using default player1');
      return 'player1';
    }
    
    // Check if the texture exists
    const exists = this.textures.exists(key);
    console.log(`[KidsFightScene][validateCharacterKey] Texture exists for ${key}: ${exists}`);
    
    // If texture exists, return the key
    if (exists) {
      return key;
    }
    
    // If texture doesn't exist, use default based on player position
    console.warn(`[KidsFightScene][validateCharacterKey] Texture for ${key} not found, using fallback`);
    return key === this.p2 ? 'player2' : 'player1';
  }
    
  private createVariableWidthSpritesheets(): void {
    console.log('[KidsFightScene] Initializing character frame widths');
    
    // Define character frame widths - using the actual frame width from the spritesheets
    this.characterFrameWidths = {
      player1: [410, 410, 410, 410, 410, 410],
      player2: [410, 410, 410, 410, 410, 410],
      bento: [410, 410, 410, 410, 410, 410],
      davir: [410, 410, 410, 410, 410, 410],
      jose: [410, 410, 410, 410, 410, 410],
      davis: [410, 410, 410, 410, 410, 410],
      carol: [410, 410, 410, 410, 410, 410],
      roni: [410, 410, 410, 410, 410, 410],
      jacqueline: [410, 410, 410, 410, 410, 410],
      ivan: [410, 410, 410, 410, 410, 410],
      d_isa: [410, 410, 410, 410, 410, 410]
    };
    
    console.log('[KidsFightScene] Character frame widths initialized');
    
    // Continue with the game setup
    this.afterSpritesheetsReady();
  }

  // Handle attack action
  private handleAttack(): void {
    try {
      console.debug('[KidsFightScene][handleAttack] CALLED', { localPlayerIndex: this.localPlayerIndex, gameMode: this.gameMode });
      const player = this.players[this.localPlayerIndex];
      if (player) {
        player.setData('isAttacking', true);
      }
      this.tryAttack(this.localPlayerIndex, 'attack', false);
      if (this.gameMode === 'online' && this.wsManager) {
        this.wsManager.send({
          type: 'attack',
          playerIndex: this.localPlayerIndex
        });
      }
      setTimeout(() => {
        const p = this.players[this.localPlayerIndex];
        if (p) p.setData('isAttacking', false);
      }, 250);
    } catch (error) {
      console.error('[KidsFightScene][handleAttack] ERROR', error);
    }
  }

  // Handle special attack action
  private handleSpecial(): void {
    if (this.playerSpecial[this.localPlayerIndex] < 3) return;
    const player = this.players[this.localPlayerIndex];
    if (player) player.setData('isSpecialAttacking', true);
    this.tryAction(this.localPlayerIndex, 'special', true);
    if (this.gameMode === 'online' && this.wsManager) {
      this.wsManager.send({ 
        type: 'special', 
        playerIndex: this.localPlayerIndex 
      });
    }
    setTimeout(() => {
      const p = this.players[this.localPlayerIndex];
      if (p) p.setData('isSpecialAttacking', false);
    }, 300);
  }

  // Try to perform an action (attack or special attack)
  private tryAction(playerIndex: number, actionType: 'attack' | 'special', isSpecial: boolean): void {
    // Validate player index
    if (playerIndex < 0 || playerIndex >= this.players.length) {
      console.error(`[tryAction] Invalid player index: ${playerIndex}`);
      return;
    }

    // Check if players are ready and game is not over
    if (!this.playersReady || this.gameOver) {
      console.log(`[tryAction] Players not ready or game over`);
      return;
    }

    const player = this.players[playerIndex];
    if (!player) {
      console.error(`[tryAction] Player ${playerIndex} not found`);
      return;
    }

    // Special attack cost check
    if (isSpecial && this.playerSpecial[playerIndex] < this.SPECIAL_COST) {
      console.log(`[tryAction] Not enough special pips for player ${playerIndex + 1}: ${this.playerSpecial[playerIndex]}/${this.SPECIAL_COST}`);
      return;
    }
    
    // Reset special pips if special attack is used
    if (isSpecial) {
      console.log('[tryAction] Resetting playerSpecial', playerIndex, this.playerSpecial[playerIndex]);
      this.playerSpecial[playerIndex] = 0;
      this.updateSpecialPips();
    }

    // Get target player index (opposite of attacker)
    const targetIndex = playerIndex === 0 ? 1 : 0;
    const opponent = this.players[targetIndex];
    
    if (!opponent) {
      console.error(`[tryAction] Opponent not found for player ${playerIndex}`);
      return;
    }

    // Set attacking state
    player.setData('isAttacking', true);
    
    // Reset attacking state after animation duration
    setTimeout(() => {
      if (player) {
        player.setData('isAttacking', false);
      }
    }, isSpecial ? this.SPECIAL_ANIMATION_DURATION : this.REGULAR_ANIMATION_DURATION);

    // Play attack animation
    const animKey = isSpecial ? 'special' : 'attack';
    if (player.anims) {
      player.anims.play(animKey, true);
    }

    // Check if attack hits
    const hit = this.checkAttackHit(player, opponent, isSpecial);
    if (hit) {
      this.handleHit(player, opponent, isSpecial);
    }
    
    // Update player animation
    this.updatePlayerAnimation(playerIndex);
  }

  // Handle remote actions from WebSocket
  private handleRemoteAction(action: RemoteAction): void {
    // Validate action and player
    if (action.playerIndex === undefined || action.playerIndex < 0 || action.playerIndex >= this.players.length) {
      console.error(`[handleRemoteAction] Invalid player index: ${action.playerIndex}`);
      return;
    }

    const player = this.players[action.playerIndex];
    if (!player || !player.body) {
      console.error(`[handleRemoteAction] Player ${action.playerIndex} not found or missing body`);
      return;
    }

    // Process the action
    switch (action.type) {
      case 'move':
        if (action.direction !== undefined) {
          const velocityX = action.direction * 200;
          player.setVelocityX(velocityX);
          player.flipX = action.direction < 0;
        }
        break;

      case 'jump':
        if (player.body.touching.down) {
          player.setVelocityY(-400);
        }
        break;

      case 'attack':
        this.tryAction(action.playerIndex, 'attack', false);
        break;

      case 'special':
        this.tryAction(action.playerIndex, 'special', true);
        break;

      case 'block':
        player.setData('isBlocking', !!action.active);
        break;

      case 'position_update':
        // Only update position if the game is in online mode and not in a local match
        if (this.gameMode === 'online') {
          if (action.x !== undefined) player.x = action.x;
          if (action.y !== undefined) player.y = action.y;
          if (action.velocityX !== undefined) player.setVelocityX(action.velocityX);
          if (action.velocityY !== undefined) player.setVelocityY(action.velocityY);
          if (action.flipX !== undefined) player.setFlipX(action.flipX);
          if (action.frame !== undefined && player.anims) {
            player.anims.stop();
            player.setFrame(action.frame);
          }
        }
        break;

      default:
        console.warn(`[handleRemoteAction] Unknown action type: ${(action as any).type}`);
        return;
    }
    
    // Update player animation after processing the action
    this.updatePlayerAnimation(action.playerIndex);
  
    // Special attack cost check
    if (actionType === 'special' && this.playerSpecial[playerIndex] < this.SPECIAL_COST) {
      console.log(`[DEBUG][tryAction] Not enough special pips for player ${playerIndex + 1}: ${this.playerSpecial[playerIndex]}/${this.SPECIAL_COST}`);
      return;
    }
    
    // Reset special pips if special attack is used
    if (actionType === 'special') {
      console.log('[DEBUG] Resetting playerSpecial', playerIndex, this.playerSpecial[playerIndex]);
      this.playerSpecial[playerIndex] = 0;
      console.log('[DEBUG] After reset', playerIndex, this.playerSpecial[playerIndex]);
      this.updateSpecialPips();
    }

    // Get target player index (opposite of attacker)
    const targetIndex = playerIndex === 0 ? 1 : 0;

    // Try attack with the current time
    const now = this.getTime();
    this.tryAttack(playerIndex, targetIndex, now, actionType === 'special');
  }

  // Expose tryAttack as a method for testability
  public tryAttack(...args: any[]): any {
    // Use the imported tryAttack function, binding 'this' to the scene instance
    return (tryAttack as any).apply(this, args);
  }

  // Create UI elements like health bars and special meters
  private createUI(): void {
    // Create health bar backgrounds
    const healthBarWidth = 200;
    const healthBarHeight = 20;
    const padding = 20;
    const yPos = 30;

    // Player 1 health bar (left side)
    this.healthBarBg1 = this.add.rectangle(
      padding + healthBarWidth / 2,
      yPos,
      healthBarWidth,
      healthBarHeight,
      0x333333
    ).setDepth(10);

    this.healthBar1 = this.add.graphics()
      .fillStyle(0xff0000)
      .fillRect(
        padding,
        yPos - healthBarHeight / 2,
        healthBarWidth,
        healthBarHeight
      )
      .setDepth(11);

    // Player 2 health bar (right side)
    this.healthBarBg2 = this.add.rectangle(
      GAME_WIDTH - padding - healthBarWidth / 2,
      yPos,
      healthBarWidth,
      healthBarHeight,
      0x333333
    ).setDepth(10);

    this.healthBar2 = this.add.graphics()
      .fillStyle(0xff0000)
      .fillRect(
        GAME_WIDTH - padding - healthBarWidth,
        yPos - healthBarHeight / 2,
        healthBarWidth,
        healthBarHeight
      )
      .setDepth(11);

    // Update health bars with initial values
    this.updateHealthBars();
  }

  // Update health bars based on current player health
  private updateHealthBars(): void {
    if (!this.healthBar1 || !this.healthBar2) return;
    
    const healthBarWidth = 200;
    const healthBarHeight = 20;
    const padding = 20;
    const yPos = 30;

    // Clear previous drawings
    this.healthBar1.clear();
    this.healthBar2.clear();

    // Draw player 1 health (left to right)
    const p1HealthWidth = (this.playerHealth[0] / MAX_HEALTH) * healthBarWidth;
    this.healthBar1
      .fillStyle(0x00ff00) // Green for full health
      .fillRect(
        padding,
        yPos - healthBarHeight / 2,
        p1HealthWidth,
        healthBarHeight
      );

    // Draw player 2 health (right to left)
    const p2HealthWidth = (this.playerHealth[1] / MAX_HEALTH) * healthBarWidth;
    this.healthBar2
      .fillStyle(0x00ff00) // Green for full health
      .fillRect(
        GAME_WIDTH - padding - p2HealthWidth,
        yPos - healthBarHeight / 2,
        p2HealthWidth,
        healthBarHeight
      );
  }

  // Create on-screen touch controls for mobile devices
  private createTouchControls(): void {
    if (!this.sys.game.device.os.desktop) {
      const buttonSize = 60;
      const padding = 20;
      const yPos = GAME_HEIGHT - buttonSize - padding;
      
      // Movement buttons (left side)
      this.touchControls = {
        leftButton: this.createButton(
          padding + buttonSize / 2,
          yPos,
          buttonSize,
          '←',
          () => this.handleButtonPress('left'),
          () => this.handleButtonRelease('left')
        ),
        rightButton: this.createButton(
          padding * 2 + buttonSize * 1.5,
          yPos,
          buttonSize,
          '→',
          () => this.handleButtonPress('right'),
          () => this.handleButtonRelease('right')
        ),
        jumpButton: this.createButton(
          GAME_WIDTH - padding - buttonSize / 2,
          yPos,
          buttonSize,
          '↑',
          () => this.handleButtonPress('up'),
          () => this.handleButtonRelease('up')
        ),
        attackButton: this.createButton(
          GAME_WIDTH - padding * 2 - buttonSize * 1.5,
          yPos - buttonSize - padding,
          buttonSize,
          'A',
          () => this.handleAttack(),
          null
        ),
        specialButton: this.createButton(
          GAME_WIDTH - padding * 3 - buttonSize * 2.5,
          yPos - buttonSize - padding,
          buttonSize,
          'S',
          () => this.handleSpecial(),
          null
        )
      };
      
      this.touchControlsVisible = true;
    }
  }

  // Helper to create touch buttons
  private createButton(
    x: number,
    y: number,
    size: number,
    text: string,
    onDown: () => void,
    onUp: (() => void) | null
  ): Phaser.GameObjects.Rectangle {
    const button = this.add.rectangle(x, y, size, size, 0x333333, 0.5)
      .setInteractive()
      .setDepth(100);
      
    this.add.text(x, y, text, { 
      fontSize: '24px', 
      color: '#ffffff',
      fontFamily: 'Arial'
    })
    .setOrigin(0.5)
    .setDepth(101);
    
    button.on('pointerdown', onDown);
    if (onUp) {
      button.on('pointerup', onUp);
      button.on('pointerout', onUp);
    }
    
    return button;
  }

  // Handle button press events
  private handleButtonPress(button: 'left' | 'right' | 'up'): void {
    const player = this.players[this.localPlayerIndex];
    if (!player) return;
    
    switch (button) {
      case 'left':
        player.setVelocityX(-200);
        player.direction = 'left';
        break;
      case 'right':
        player.setVelocityX(200);
        player.direction = 'right';
        break;
      case 'up':
        if (player.body?.touching.down) {
          player.setVelocityY(-400);
        }
        break;
    }
  }

  // Handle button release events
  private handleButtonRelease(button: 'left' | 'right' | 'up'): void {
    const player = this.players[this.localPlayerIndex];
    if (!player) return;
    
    if ((button === 'left' && player.body?.velocity.x < 0) || 
        (button === 'right' && player.body?.velocity.x > 0)) {
      player.setVelocityX(0);
    }
  }

  // Update special attack pips display
  private updateSpecialPips(): void {
    // Clear existing pips
    this.specialPips1.forEach(pip => pip.destroy());
    this.specialPips2.forEach(pip => pip.destroy());
    this.specialPips1 = [];
    this.specialPips2 = [];

    const pipSize = 10;
    const padding = 5;
    const totalWidth = this.SPECIAL_COST * (pipSize + padding) - padding;
    const startX1 = 20 + totalWidth / 2;
    const startX2 = GAME_WIDTH - 20 - totalWidth / 2;
    const yPos = 60;

    // Create pips for player 1
    for (let i = 0; i < this.SPECIAL_COST; i++) {
      const x = startX1 + i * (pipSize + padding);
      const pip = this.add.rectangle(
        x,
        yPos,
        pipSize,
        pipSize,
        i < this.playerSpecial[0] ? 0x00ffff : 0x666666
      ).setDepth(10);
      this.specialPips1.push(pip);
    }

    // Create pips for player 2
    for (let i = 0; i < this.SPECIAL_COST; i++) {
      const x = startX2 - (this.SPECIAL_COST - 1 - i) * (pipSize + padding);
      const pip = this.add.rectangle(
        x,
        yPos,
        pipSize,
        pipSize,
        i < this.playerSpecial[1] ? 0x00ffff : 0x666666
      ).setDepth(10);
      this.specialPips2.push(pip);
    }
  }
  // Handle left movement (used in tests and online mode)
  public handleLeftDown(): void {
    if (this.gameMode === 'online' && this.wsManager) {
      this.wsManager.send({ type: 'move', direction: -1, playerIndex: this.localPlayerIndex });
    }
    // Local movement logic can be added if needed
  }

  // Handle right movement (used in tests and online mode)
  public handleRightDown(): void {
    if (this.gameMode === 'online' && this.wsManager) {
      this.wsManager.send({ type: 'move', direction: 1, playerIndex: this.localPlayerIndex });
    }
    // Local movement logic can be added if needed
  }

  // Handle jump action (used in tests and online mode)
  public handleJumpDown(): void {
    if (this.gameMode === 'online' && this.wsManager) {
      this.wsManager.send({ type: 'jump', playerIndex: this.localPlayerIndex });
    }
    // Local jump logic can be added if needed
  }
}

// Export the KidsFightScene class so it can be imported by other modules
export default KidsFightScene;