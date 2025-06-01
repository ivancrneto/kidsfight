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
interface Player extends Phaser.Physics.Arcade.Sprite, PlayerProps {
  // Add any additional methods or properties specific to Player
  health: number;
  special: number;
  isBlocking: boolean;
  isAttacking: boolean;
  direction: 'left' | 'right';
  walkAnimData?: {
    frameTime: number;
    currentFrame: number;
    frameDelay: number;
  };
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
  // Added to fix TypeScript lint error
  playersReady: boolean = false;
  public players: [ (Phaser.Physics.Arcade.Sprite & PlayerProps)?, (Phaser.Physics.Arcade.Sprite & PlayerProps)? ] = [undefined, undefined];
  private platform?: Phaser.GameObjects.Rectangle;
  private background?: Phaser.GameObjects.Image;
  private healthBarBg1?: Phaser.GameObjects.Rectangle;
  private healthBarBg2?: Phaser.GameObjects.Rectangle;
  private healthBar1?: Phaser.GameObjects.Graphics;
  private healthBar2?: Phaser.GameObjects.Graphics;
  private specialPips1: Phaser.GameObjects.Graphics[] = [];
  private specialPips2: Phaser.GameObjects.Graphics[] = [];
  private specialReadyText1?: Phaser.GameObjects.Text;
  private specialReadyText2?: Phaser.GameObjects.Text;
  private wsManager: WebSocketManager = WebSocketManager.getInstance(); // Use the singleton instance
  private selected!: { p1: string; p2: string };
  p1: string;
  p2: string;
  private selectedScenario!: string;
  private roomCode?: string;
  private isHost?: boolean;
  gameOver: boolean = false;
  private isReady: boolean = false;
  gameMode!: 'single' | 'online';
  private roundStartTime!: number;
  private roundEndTime!: number;
  private lastUpdateTime!: number;
  playerHealth: number[] = [MAX_HEALTH, MAX_HEALTH];
  private playerSpecial: number[] = [0, 0];
  playerDirection: ('left' | 'right')[] = ['right', 'left'];
  isAttacking: boolean[] = [false, false];
  playerBlocking: boolean[] = [false, false];
  lastAttackTime: number[] = [0, 0];
  private lastSpecialTime: number[] = [0, 0];
  private hitEffects: Phaser.GameObjects.Arc[] = [];
  private replayPopupElements: Phaser.GameObjects.GameObject[] = [];
  private touchControlsVisible: boolean = false;
  private touchStartY: number = 0;
  attackCount: number[] = [0, 0];
  private p1SpriteKey: string = '';
  private p2SpriteKey: string = '';
  private attackHitboxes!: Phaser.Physics.Arcade.Group;
  private specialHitboxes!: Phaser.Physics.Arcade.Group;
  private replayRequested: boolean = false;
  private restarting: boolean = false;
  private replayPopupShown: boolean = false;
  timeLeft: number = 0;
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
  private customKeyboard: any = null; // For testing

  private touchControls?: {
    leftButton?: Phaser.GameObjects.Rectangle;
    rightButton?: Phaser.GameObjects.Rectangle;
    jumpButton?: Phaser.GameObjects.Rectangle;
    attackButton?: Phaser.GameObjects.Rectangle;
    specialButton?: Phaser.GameObjects.Rectangle;
    blockButton?: Phaser.GameObjects.Rectangle;
  };

  private readonly TOTAL_HEALTH: number = MAX_HEALTH;
  private readonly DAMAGE: number = ATTACK_DAMAGE;
  private readonly SPECIAL_DAMAGE: number = SPECIAL_DAMAGE;
  private readonly SPECIAL_COST: number = 3;
  private readonly ROUND_TIME: number = 99;

  private player1: Phaser.Physics.Arcade.Sprite & PlayerProps | undefined;
  private player2: Phaser.Physics.Arcade.Sprite & PlayerProps | undefined;

  localPlayerIndex: number = 0;

  // Store last sent position/frame for sync efficiency
  private _lastSentPosition: { x: number, y: number, velocityX: number, velocityY: number, flipX: boolean, frame: any } | null = null;

  constructor(config?: Phaser.Types.Scenes.SettingsConfig & { customKeyboard?: any }) {
    super({key: 'KidsFightScene', ...config});
    this.wsManager = WebSocketManager.getInstance(); // Assign the singleton instance
    this.selected = {p1: 'player1', p2: 'player2'};
    this.selectedScenario = 'scenario1';
    this.gameMode = 'single';
    this.roundStartTime = 0;
    this.roundEndTime = 0;
    this.lastUpdateTime = 0;
    this.gameOver = false;
    this.isReady = false;
    this.isHost = false;
    this.touchControls = {};
    this.touchControlsVisible = false;
    this.playerHealth = [MAX_HEALTH, MAX_HEALTH]; // Always 200
    this.playerSpecial = [0, 0];
    this.playerDirection = ['right', 'left'];
    this.isAttacking = [false, false];
    this.playerBlocking = [false, false];
    this.lastAttackTime = [0, 0];
    this.lastSpecialTime = [0, 0];
    this.hitEffects = [];
    this.replayPopupElements = [];
    this.p1 = 'player1';
    this.p2 = 'player2';
    this.attackCount = [0, 0];
    this.customKeyboard = config?.customKeyboard || null;
    // Legacy compatibility for tests
    this.player1 = undefined;
    this.player2 = undefined;
  }

  private syncLegacyPlayerRefs() {
    this.player1 = this.players[0];
    this.player2 = this.players[1];
  }

  // Initialization methods
  init(data: SceneData): void {
    console.log('KidsFightScene init with data:', data);
    // Accept both p1/p2 and p1Char/p2Char for compatibility
    const p1Key = data.p1Char || data.p1 || (data.selected?.p1) || 'player1';
    const p2Key = data.p2Char || data.p2 || (data.selected?.p2) || 'player2';
    this.selected = { p1: p1Key, p2: p2Key };
    this.p1 = p1Key;
    this.p2 = p2Key;
    // DEBUG: Log incoming player keys
    console.log('[DEBUG][KidsFightScene.init] incoming p1:', this.p1, 'p2:', this.p2);
    // Fallback: if p1 or p2 is not a valid sprite key, set default
    const validKeys = ['player1','player2','bento','davir','jose','davis','carol','roni','jacqueline','ivan','d_isa'];
    if (!validKeys.includes(this.p1)) {
      console.warn('[KidsFightScene] Invalid p1 key:', this.p1, 'Defaulting to player1');
      this.p1 = 'player1';
    }
    if (!validKeys.includes(this.p2)) {
      console.warn('[KidsFightScene] Invalid p2 key:', this.p2, 'Defaulting to player2');
      this.p2 = 'player2';
    }
    this.selectedScenario = data.scenario || data.selectedScenario || 'scenario1';
    this.gameMode = data.gameMode || 'single'; // <-- CRITICAL: set gameMode from data
    if (data.wsManager) {
      this.wsManager = data.wsManager; // <-- CRITICAL: set wsManager from data
    }
    this.roomCode = data.roomCode;
    this.isHost = data.isHost;
    // Set localPlayerIndex based on host/guest
    this.localPlayerIndex = this.isHost ? 0 : 1;
  }

  preload(): void {
    // Load scenario backgrounds
    this.load.image('scenario1', scenario1Img);
    this.load.image('scenario2', scenario2Img);
    // Load character spritesheets with correct keys for each character
    this.load.spritesheet('bento', player1RawImg, { frameWidth: 410, frameHeight: 512 });
    this.load.spritesheet('davir', player2RawImg, { frameWidth: 410, frameHeight: 512 });
    this.load.spritesheet('jose', player3RawImg, { frameWidth: 410, frameHeight: 512 });
    this.load.spritesheet('davis', player4RawImg, { frameWidth: 410, frameHeight: 512 });
    this.load.spritesheet('carol', player5RawImg, { frameWidth: 410, frameHeight: 512 });
    this.load.spritesheet('roni', player6RawImg, { frameWidth: 410, frameHeight: 512 });
    this.load.spritesheet('jacqueline', player7RawImg, { frameWidth: 410, frameHeight: 512 });
    this.load.spritesheet('ivan', player8RawImg, { frameWidth: 410, frameHeight: 512 });
    this.load.spritesheet('d_isa', player9RawImg, { frameWidth: 410, frameHeight: 512 });
    // Debug log for loaded keys
    console.log('[KidsFightScene][preload] Loaded character keys:', [
      'player1','player2','bento','davir','jose','davis','carol','roni','jacqueline','ivan','d_isa'
    ]);
  }

  create(): void {
    // DEBUG: Log player array and local player index at scene start
    console.log('[DEBUG][KidsFightScene] Player array at start:', this.players, 'Local index:', this.localPlayerIndex);

    // Initialize round start time immediately
    this.roundStartTime = Date.now();

    // Log camera info
    if (this.cameras && this.cameras.main) {
      const cam = this.cameras.main;
      console.log('[KidsFightScene] Camera info:', {
        x: cam.x, y: cam.y, width: cam.width, height: cam.height, scrollX: cam.scrollX, scrollY: cam.scrollY, zoom: cam.zoom
      });
    }
    // Reset game state
    this.gameOver = false;
    this.timeLeft = this.ROUND_TIME;
    // CRITICAL FIX: Force health to max at scene start
    this.playerHealth = [MAX_HEALTH, MAX_HEALTH]; // Always 200
    this.playerSpecial = [0, 0];
    this.isAttacking = [false, false];
    this.playerBlocking = [false, false];
    this.attackCount = [0, 0];
    
    // Get the current game dimensions
    const gameWidth = this.sys.game.canvas.width;
    const gameHeight = this.sys.game.canvas.height;
    
    console.log('[KidsFightScene][create] FULL INIT DUMP', {
      mode: this.gameMode,
      selected: this.selected,
      p1: this.p1,
      p2: this.p2,
      selectedScenario: this.selectedScenario,
      playerHealth: this.playerHealth,
      isHost: this.isHost,
      roomCode: this.roomCode,
      playersReady: this.playersReady,
      timeLeft: this.timeLeft,
      gameOver: this.gameOver
    });
    
    console.log('Creating KidsFightScene with settings:', {
      dimensions: `${gameWidth}x${gameHeight}`,
      isMobile: this.sys.game.device.os.android || this.sys.game.device.os.iOS,
      selectedScenario: this.selectedScenario,
      p1: this.p1,
      p2: this.p2,
      selected: this.selected,
      gameMode: this.gameMode,
      playerHealth: this.playerHealth,
      gameOver: this.gameOver
    });
    
    console.log('[KidsFightScene gameMode:', this.gameMode);
    console.log('[KidsFightScene] wsManager:', this.wsManager);
    
    // Setup scene with proper scaling
    this.background = this.add.image(0, 0, this.selectedScenario)
      .setOrigin(0, 0)
      .setDisplaySize(gameWidth, gameHeight) as Phaser.GameObjects.Image;

    // Set camera and physics bounds to match the actual game size
    if (this.cameras && this.cameras.main && typeof this.cameras.main.setBounds === 'function') {
      this.cameras.main.setBounds(0, 0, gameWidth, gameHeight);
    }
    if (this.physics && this.physics.world && typeof this.physics.world.setBounds === 'function') {
      this.physics.world.setBounds(0, 0, gameWidth, gameHeight);
    }

    // Calculate platform height ONCE
    const platformHeight = this.sys.game.device.os.android || this.sys.game.device.os.iOS ?
      gameHeight - (gameHeight * 0.15) :
      gameHeight - 100;

    // Add extreme debugging - LOOK FOR THIS IN CONSOLE
    console.log('******** ATTEMPTING TO POSITION PLAYERS MUCH HIGHER - IMPORTANT *********');
    console.log('platformHeight:', platformHeight, 'gameHeight:', gameHeight);

    // Calculate new upper platform height (move platform down to 20% up from bottom)
    const upperPlatformY = gameHeight - gameHeight * 0.2;

    // Create new physics platform at upper position
    const upperPlatform = this.physics.add.staticGroup();
    upperPlatform.create(gameWidth / 2, upperPlatformY, null)
      .setDisplaySize(gameWidth, 32)
      .setVisible(false)
      .refreshBody();

    // Visual representation of the upper platform
    const upperPlatformVisual = this.add.rectangle(
      gameWidth / 2,
      upperPlatformY,
      gameWidth,
      32,
      0x888888
    );
    upperPlatformVisual.setDepth(0);
    upperPlatformVisual.setAlpha(0); // Make the platform fully transparent

    // --- PATCH: Ensure player feet are visible in ALL MODES (esp. online) ---
    // Set upper platform Y position to match test expectations
    const upperPlatformY2 = 380;
    // Create physics platform
    const upperPlatform2 = this.physics.add.staticGroup();
    upperPlatform2.create(gameWidth / 2, upperPlatformY2, null)
      .setDisplaySize(gameWidth, 32)
      .setVisible(false)
      .refreshBody();
    // Visual (transparent) platform
    const upperPlatformVisual2 = this.add.rectangle(
      gameWidth / 2,
      upperPlatformY2,
      gameWidth,
      32,
      0x888888
    );
    upperPlatformVisual2.setDepth(0);
    upperPlatformVisual2.setAlpha(0);
    // --- PLAYER SPRITES ---
    // Use consistent scale and origin for all modes
    const playerScale = 0.4;
    this.players[0] = this.physics.add.sprite(gameWidth * 0.25, upperPlatformY2, this.p1) as Phaser.Physics.Arcade.Sprite & PlayerProps;
    this.players[1] = this.physics.add.sprite(gameWidth * 0.75, upperPlatformY2, this.p2) as Phaser.Physics.Arcade.Sprite & PlayerProps;
    // Debug log for sprite creation
    console.log('[DEBUG][SpriteCreation] Player 1:', {
      key: this.p1,
      width: this.players[0].width,
      height: this.players[0].height,
      displayWidth: this.players[0].displayWidth,
      displayHeight: this.players[0].displayHeight,
      frame: this.players[0].frame ? this.players[0].frame.name : undefined
    });
    console.log('[DEBUG][SpriteCreation] Player 2:', {
      key: this.p2,
      width: this.players[1].width,
      height: this.players[1].height,
      displayWidth: this.players[1].displayWidth,
      displayHeight: this.players[1].displayHeight,
      frame: this.players[1].frame ? this.players[1].frame.name : undefined
    });
    this.players[0].setOrigin(0.5, 1.0);
    this.players[1].setOrigin(0.5, 1.0);
    this.players[0].y = upperPlatformY2;
    this.players[1].y = upperPlatformY2;
    this.players[0].setScale(playerScale);
    this.players[1].setScale(playerScale);
    // Flip player 2
    this.players[1]?.setFlipX(true);
    // Colliders
    this.physics.add.collider(this.players[0], upperPlatform2);
    this.physics.add.collider(this.players[1], upperPlatform2);

    // After creating player2 sprite, ensure it is flipped horizontally
    if (this.players[1]) {
      this.players[1]?.setFlipX(true);
    }

    // Enable collision between players and the new upper platform
    this.physics.add.collider(this.players[0], upperPlatform);
    this.physics.add.collider(this.players[1], upperPlatform);

    // --- FORCE HEALTH INIT TO 200 ---
    this.players.forEach((player, index) => {
      if (!player) return;
      const isPlayer1 = index === 0;
      player.setCollideWorldBounds?.(true);
      player.setBounce?.(0.2);
      player.setGravityY?.(300);
      player.setSize?.(80, 200);
      player.setOffset?.(92, 32);
      // Set custom properties
      player.health = MAX_HEALTH; // Always 200
      this.playerHealth[index] = MAX_HEALTH; // Always 200
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
    // Register WebSocket message handler after players are created
    if (this.gameMode === 'online' && this.wsManager && typeof this.wsManager.connect === 'function') {
      console.log('[DEBUG][KidsFightScene] Registering message handler, players:', this.players);
      console.log('[DEBUG] About to call wsManager.connect and setMessageCallback in KidsFightScene.create');
      this.wsManager.connect().then(() => {
        console.log('[DEBUG] wsManager.onMessage callback registered in KidsFightScene.create');
        this.wsManager.onMessage((event: MessageEvent) => {
          console.debug('[WSM][KidsFightScene] Message received (raw):', event);
          try {
            const action = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
            console.debug('[WSM][KidsFightScene] Message received (parsed):', action);
            // Only handle gameplay actions here
            if (action.type === 'attack') {
              if (typeof action.playerIndex === 'number') {
                // Only the host should process the attack and apply damage
                if (this.wsManager.isHost) {
                  console.debug('[KidsFightScene][WS HANDLE ATTACK][HOST]', action);
                  this.tryAction(action.playerIndex, 'attack', !!action.isSpecial);
                } else {
                  console.debug('[KidsFightScene][WS HANDLE ATTACK][GUEST] Ignoring attack action, waiting for health_update', action);
                }
              }
            } else if (action.type === 'health_update') {
              console.debug('[KidsFightScene][WS HEALTH UPDATE][RECEIVED]', action);
              const idx = action.playerIndex;
              if (idx !== undefined && this.players[idx]) {
                console.debug('[KidsFightScene][WS HEALTH UPDATE][BEFORE]', {
                  playerIndex: idx,
                  playerObjectHealth: this.players[idx].health,
                  playerHealthArray: this.playerHealth[idx],
                  allPlayers: [
                    this.players[0] ? {health: this.players[0].health} : null,
                    this.players[1] ? {health: this.players[1].health} : null
                  ],
                  allHealthArray: this.playerHealth.slice(),
                });
                
                // Only update if we're receiving a health update for the remote player
                // or if the health value is significantly different
                const isRemotePlayer = idx !== this.localPlayerIndex;
                const significantDifference = Math.abs(this.playerHealth[idx] - action.health) > 10;
                
                if (isRemotePlayer || significantDifference) {
                  // Update both the player object AND the health array
                  this.players[idx].health = action.health;
                  this.playerHealth[idx] = action.health;
                  console.debug('[KidsFightScene][WS HEALTH UPDATE][AFTER]', {
                    playerIndex: idx,
                    newHealth: action.health,
                    playerObjectHealth: this.players[idx].health,
                    playerHealthArray: this.playerHealth[idx],
                    allPlayers: [
                      this.players[0] ? {health: this.players[0].health} : null,
                      this.players[1] ? {health: this.players[1].health} : null
                    ],
                    allHealthArray: this.playerHealth.slice(),
                  });
                  
                  console.debug('[KidsFightScene][WS HEALTH UPDATE] Updating health bars...');
                  this.updateHealthBar(0);
                  this.updateHealthBar(1);
                  this.checkWinner();
                } else {
                  console.debug('[KidsFightScene][WS HEALTH UPDATE] Ignoring echo for local player update', {
                    localPlayerIndex: this.localPlayerIndex,
                    updatedPlayerIndex: idx,
                    currentHealth: this.playerHealth[idx],
                    receivedHealth: action.health
                  });
                }
              } else {
                console.warn('[KidsFightScene][WS HEALTH UPDATE] Player object missing for index', idx, action);
              }
              return;
            } else if ([
              'move',
              'jump',
              'attack',
              'special',
              'block',
              'replay_request',
              'position_update'
            ].includes(action.type)) {
              if (action.type === 'replay_request') {
                this.showReplayRequestPopup(action);
              } else {
                this.handleRemoteAction(action);
              }
            } else if (action.type === 'replay_response') {
              console.log('[KidsFightScene][RECV replay_response]', action);
              if (action.accepted) {
                this.scene.restart();
              }
            } else {
              // Ignore navigation/scene actions
              console.log('Ignoring non-gameplay action:', action.type);
            }
          } catch (e) {
            console.error('[KidsFightScene] Failed to parse remote action:', e, event);
          }
        });
      });
    }

    // --- CONSOLIDATED HEALTH INITIALIZATION ---
    // Always set playerHealth and player objects to MAX_HEALTH before any UI or health bar rendering
    this.playerHealth = [MAX_HEALTH, MAX_HEALTH];
    if (this.players[0]) this.players[0].health = MAX_HEALTH;
    if (this.players[1]) this.players[1].health = MAX_HEALTH;
    console.log('[DEBUG] playerHealth and player objects initialized to MAX_HEALTH:', this.playerHealth);

    // After both players are ready, create UI and touch controls (input handlers)
    if (this.playersReady) {
      this.createUI();
      this.createTouchControls();
    } else {
      console.warn('[DEBUG] Tried to create UI/controls before players were ready:', this.players);
    }

// Legacy compatibility for tests
this.syncLegacyPlayerRefs();

// --- ONLINE MODE: Set up WebSocket message handler ---
if (this.gameMode === 'online' && this.wsManager && typeof this.wsManager.connect === 'function') {
  console.log('[DEBUG] About to call wsManager.connect and setMessageCallback in KidsFightScene.create');
  this.wsManager.connect().then(() => {
    console.log('[DEBUG] wsManager.onMessage callback registered in KidsFightScene.create');
    this.wsManager.onMessage((event: MessageEvent) => {
      console.debug('[WSM][KidsFightScene] Message received (raw):', event);
      try {
        const action = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        console.debug('[WSM][KidsFightScene] Message received (parsed):', action);
        // Only handle gameplay actions here
        if (action.type === 'attack') {
          if (typeof action.playerIndex === 'number') {
            console.debug('[KidsFightScene][WS HANDLE ATTACK]', action);
            this.tryAction(action.playerIndex, 'attack', !!action.isSpecial);
          }
        } else if (action.type === 'health_update') {
          console.debug('[KidsFightScene][WS HEALTH UPDATE][RECEIVED]', action);
          const idx = action.playerIndex;
          if (idx !== undefined && this.players[idx]) {
            console.debug('[KidsFightScene][WS HEALTH UPDATE][BEFORE]', {
              playerIndex: idx,
              playerObjectHealth: this.players[idx].health,
              playerHealthArray: this.playerHealth[idx],
              allPlayers: [
                this.players[0] ? {health: this.players[0].health} : null,
                this.players[1] ? {health: this.players[1].health} : null
              ],
              allHealthArray: this.playerHealth.slice(),
            });
            
            // Only update if we're receiving a health update for the remote player
            // or if the health value is significantly different
            const isRemotePlayer = idx !== this.localPlayerIndex;
            const significantDifference = Math.abs(this.playerHealth[idx] - action.health) > 10;
            
            if (isRemotePlayer || significantDifference) {
              // Update both the player object AND the health array
              this.players[idx].health = action.health;
              this.playerHealth[idx] = action.health;
              console.debug('[KidsFightScene][WS HEALTH UPDATE][AFTER]', {
                playerIndex: idx,
                newHealth: action.health,
                playerObjectHealth: this.players[idx].health,
                playerHealthArray: this.playerHealth[idx],
                allPlayers: [
                  this.players[0] ? {health: this.players[0].health} : null,
                  this.players[1] ? {health: this.players[1].health} : null
                ],
                allHealthArray: this.playerHealth.slice(),
              });
              
              console.debug('[KidsFightScene][WS HEALTH UPDATE] Updating health bars...');
              this.updateHealthBar(0);
              this.updateHealthBar(1);
              this.checkWinner();
            } else {
              console.debug('[KidsFightScene][WS HEALTH UPDATE] Ignoring echo for local player update', {
                localPlayerIndex: this.localPlayerIndex,
                updatedPlayerIndex: idx,
                currentHealth: this.playerHealth[idx],
                receivedHealth: action.health
              });
            }
          } else {
            console.warn('[KidsFightScene][WS HEALTH UPDATE] Player object missing for index', idx, action);
          }
          return;
        } else if ([
          'move',
          'jump',
          'attack',
          'special',
          'block',
          'replay_request',
          'position_update'
        ].includes(action.type)) {
          if (action.type === 'replay_request') {
            this.showReplayRequestPopup(action);
          } else {
            this.handleRemoteAction(action);
          }
        } else if (action.type === 'replay_response') {
          console.log('[KidsFightScene][RECV replay_response]', action);
          if (action.accepted) {
            this.scene.restart();
          }
        } else {
          // Ignore navigation/scene actions
          console.log('Ignoring non-gameplay action:', action.type);
        }
      } catch (e) {
        console.error('[KidsFightScene] Failed to parse remote action:', e, event);
      }
    });
  });
    // Make hitbox slightly smaller than visual sprite for better gameplay
    if (this.players[0].body && this.players[1].body) {
      this.players[0].body.setSize(this.players[0].width * 0.6, this.players[0].height * 0.5);
      this.players[1].body.setSize(this.players[1].width * 0.6, this.players[1].height * 0.5);

      // Set offset to center the hitbox
      this.players[0].body.setOffset(this.players[0].width * 0.2, this.players[0].height * 0.25);
      this.players[1].body.setOffset(this.players[1].width * 0.2, this.players[1].height * 0.25);

      // Increase gravity on mobile for better feel
      if (this.sys.game.device.os.android || this.sys.game.device.os.iOS) {
        this.players[0].body.setGravityY(300);
        this.players[1].body.setGravityY(300);
      }
    }
  }
}

  // <-- Added closing brace for create()

  private createUI(): void {
    // Get the current game dimensions for proper UI scaling
    const gameWidth = this.sys.game.canvas.width;
    const gameHeight = this.sys.game.canvas.height;

    // Calculate scale factor
    const scaleX = gameWidth / GAME_WIDTH;
    const scaleY = gameHeight / GAME_HEIGHT;

    // Create health bars
    this.createHealthBars(scaleX, scaleY);

    // Create special bars
    this.createSpecialPips(scaleX, scaleY);
    this.updateSpecialPips(); // Update special pips after creating

    // Create player names
    this.createPlayerNames(scaleX, scaleY);
  }

  private createHealthBars(scaleX: number, scaleY: number): void {
    try {
      console.log('[createHealthBars] Creating health bars with scale:', { scaleX, scaleY });
      
      const gameWidth = this.sys.game.canvas.width;
      const barWidth = 300 * scaleX;
      const barHeight = 24 * scaleY;
      const barY = 20 * scaleY;
      const barX1 = 60 * scaleX + barWidth / 2;
      const barX2 = gameWidth - (60 * scaleX + barWidth / 2);

      // Clean up existing bars if they exist
      if (this.healthBar1) this.healthBar1.destroy();
      if (this.healthBar2) this.healthBar2.destroy();
      if (this.healthBarBg1) this.healthBarBg1.destroy();
      if (this.healthBarBg2) this.healthBarBg2.destroy();

      // Create health bar backgrounds (gray)
      this.healthBarBg1 = this.add.rectangle(barX1, barY, barWidth, barHeight, 0x444444)
        .setScrollFactor(0)
        .setDepth(999);
      
      this.healthBarBg2 = this.add.rectangle(barX2, barY, barWidth, barHeight, 0x444444)
        .setScrollFactor(0)
        .setDepth(999);

      // Create health bars (initially empty, will be filled by updateHealthBar)
      this.healthBar1 = this.add.graphics()
        .setScrollFactor(0)
        .setDepth(1000);
      
      this.healthBar2 = this.add.graphics()
        .setScrollFactor(0)
        .setDepth(1000);

      console.log('[createHealthBars] Health bars created, updating...');
      
      // Update both health bars
      this.updateHealthBar(0);
      this.updateHealthBar(1);
      
      console.log('[createHealthBars] Health bars initialized:', {
        playerHealth: this.playerHealth,
        barsExist: {
          bar1: !!this.healthBar1,
          bar2: !!this.healthBar2,
          bg1: !!this.healthBarBg1,
          bg2: !!this.healthBarBg2
        }
      });
    } catch (error) {
      console.error('[createHealthBars] Error creating health bars:', error);
    }
  }

  private updateHealthBar(playerIndex: number): void {
    try {
      // Guard for test environments
      if (!this.sys?.game?.canvas) {
        console.warn('[updateHealthBar] Game canvas not available');
        return;
      }

      // Ensure health bars exist, recreate if needed
      if (!this.healthBar1 || !this.healthBar2 || !this.healthBarBg1 || !this.healthBarBg2) {
        console.warn('[updateHealthBar] Health bars not found, recreating...');
        const gameWidth = this.sys.game.canvas.width;
        const gameHeight = this.sys.game.canvas.height;
        const scaleX = gameWidth / 800;
        const scaleY = gameHeight / 480;
        this.createHealthBars(scaleX, scaleY);
        // Wait for next frame to ensure health bars are created
        return;
      }
      
      // Ensure health value is valid and within bounds
      const currentHealth = this.playerHealth[playerIndex];
      if (typeof currentHealth !== 'number' || isNaN(currentHealth) || currentHealth < 0 || currentHealth > MAX_HEALTH) {
        console.warn(`[HEALTH] Invalid health value for player ${playerIndex + 1}: ${currentHealth}, resetting to max`);
        const fixedHealth = Math.max(0, Math.min(MAX_HEALTH, isNaN(currentHealth) ? MAX_HEALTH : currentHealth));
        this.playerHealth[playerIndex] = fixedHealth;
        if (this.players[playerIndex]) {
          this.players[playerIndex].health = fixedHealth;
        }
      }
      
      // Calculate dimensions and positions
      const gameWidth = this.sys.game.canvas.width;
      const scaleX = gameWidth / 800;
      const barWidth = 300 * scaleX;
      const barHeight = 24 * scaleX;
      const barY = 20 * scaleX;
      const barX1 = 60 * scaleX + barWidth / 2;
      const barX2 = gameWidth - (60 * scaleX + barWidth / 2);
      const healthPercent = Math.max(0, Math.min(1, this.playerHealth[playerIndex] / MAX_HEALTH));
      
      // Get the target health bar and background
      const healthBar = playerIndex === 0 ? this.healthBar1 : this.healthBar2;
      const healthBarBg = playerIndex === 0 ? this.healthBarBg1 : this.healthBarBg2;
      const barX = playerIndex === 0 ? barX1 : barX2;
      const healthColor = playerIndex === 0 ? 0x00ff00 : 0xff0000; // Green for P1, Red for P2

      // Update background position and visibility
      if (healthBarBg) {
        healthBarBg.setPosition(barX, barY);
        healthBarBg.setSize(barWidth, barHeight);
        healthBarBg.setVisible(true);
        healthBarBg.setDepth(999);
      }

      // Clear and redraw health bar
      if (healthBar) {
        healthBar.clear();
        healthBar.setVisible(true);
        healthBar.setDepth(1000);
        
        // Draw health bar background (dark gray)
        healthBar.fillStyle(0x444444);
        healthBar.fillRect(
          barX - barWidth / 2,
          barY - barHeight / 2,
          barWidth,
          barHeight
        );
        
        // Draw health fill (green/red)
        healthBar.fillStyle(healthColor);
        healthBar.fillRect(
          barX - barWidth / 2,
          barY - barHeight / 2,
          barWidth * healthPercent,
          barHeight
        );
        
        // Draw border
        healthBar.lineStyle(2, 0xffffff, 1);
        healthBar.strokeRect(
          barX - barWidth / 2,
          barY - barHeight / 2,
          barWidth,
          barHeight
        );
      }

      // Debug logging
      console.log(`[updateHealthBar] Player ${playerIndex + 1} health:`, {
        health: this.playerHealth[playerIndex],
        percent: (healthPercent * 100).toFixed(1) + '%',
        position: { x: barX, y: barY },
        size: { width: barWidth, height: barHeight },
        timestamp: Date.now()
      });
      
      // The health bar was already drawn above with the correct colors:
      // - Player 1 (index 0): Green (0x00ff00)
      // - Player 2 (index 1): Red (0xff0000)

      // Mark as dirty to ensure redraw
      if (this.healthBar1) this.healthBar1.dirty = true;
      if (this.healthBar2) this.healthBar2.dirty = true;
      
    } catch (error) {
      console.error('[updateHealthBar] Error updating health bar:', error);
    }
  }

  private createSpecialPips(scaleX: number, scaleY: number): void {
    // Clear previous pips
    this.specialPips1.forEach(pip => pip.destroy());
    this.specialPips2.forEach(pip => pip.destroy());
    this.specialPips1 = [];
    this.specialPips2 = [];

    const gameWidth = this.sys.game.canvas.width;
    const pipRadius = 10 * scaleX;
    const pipSpacing = 30 * scaleX;
    const pipY = 48 * scaleY;
    for (let i = 0; i < 3; i++) {
      // Player 1 (left)
      const pip1 = this.add.graphics();
      pip1.fillStyle(0xffffff, 0.3);
      pip1.fillCircle(40 * scaleX + pipSpacing * i, pipY, pipRadius);
      pip1.setDepth(10);
      this.specialPips1.push(pip1);

      // Player 2 (right)
      const pip2 = this.add.graphics();
      pip2.fillStyle(0xffffff, 0.3);
      pip2.fillCircle(gameWidth - (40 * scaleX + pipSpacing * i), pipY, pipRadius);
      pip2.setDepth(10);
      this.specialPips2.push(pip2);
    }
  }

  private updateSpecialPips(): void {
    // Update fill color based on playerSpecial count
    for (let i = 0; i < 3; i++) {
      // Player 1
      if (this.specialPips1[i]) {
        this.specialPips1[i].clear();
        // Fill with yellow if this pip is filled (earned), white if not
        this.specialPips1[i].fillStyle(i < this.playerSpecial[0] ? 0xffe066 : 0xffffff, i < this.playerSpecial[0] ? 1 : 0.3);
        this.specialPips1[i].fillCircle(40 * (this.sys.game.canvas.width/800) + 30 * (this.sys.game.canvas.width/800) * i, 48 * (this.sys.game.canvas.height/480), 10 * (this.sys.game.canvas.width/800));
      }
      // Player 2
      if (this.specialPips2[i]) {
        this.specialPips2[i].clear();
        this.specialPips2[i].fillStyle(i < this.playerSpecial[1] ? 0xffe066 : 0xffffff, i < this.playerSpecial[1] ? 1 : 0.3);
        this.specialPips2[i].fillCircle(this.sys.game.canvas.width - (40 * (this.sys.game.canvas.width/800) + 30 * (this.sys.game.canvas.width/800) * i), 48 * (this.sys.game.canvas.height/480), 10 * (this.sys.game.canvas.width/800));
      }
    }
  }

  // Helper for display name - used throughout the class
  private getDisplayName(key: string): string {
    // Map known keys to real names, fallback to key if not found
    const nameMap: Record<string, string> = {
      player1: 'Bento',
      player2: 'Davi R',
      player3: 'José',
      player4: 'Davi S',
      player5: 'Carol',
      player6: 'Roni',
      player7: 'Jacqueline',
      player8: 'Ivan',
      player9: 'D. Isa',
      bento: 'Bento',
      davir: 'Davi R',
      jose: 'José',
      davis: 'Davi S',
      carol: 'Carol',
      roni: 'Roni',
      jacqueline: 'Jacqueline',
      ivan: 'Ivan',
      d_isa: 'D. Isa'
    };
    return nameMap[key] || key;
  }

  private createPlayerNames(scaleX: number, scaleY: number): void {
    const gameWidth = this.sys.game.canvas.width;

    // Create player name texts with proper scaling
    const fontSize = Math.max(16, Math.floor(24 * scaleY)); // Ensure minimum readable size

    // Draw a semi-transparent dark rectangle behind each name for contrast
    const nameBgWidth = 160 * scaleX;
    const nameBgHeight = 36 * scaleY;
    const nameBgAlpha = 0.65;
    // Player 1 background
    const player1Bg = this.add.rectangle(
      10 * scaleX + nameBgWidth/2,
      70 * scaleY + nameBgHeight/2 - 8 * scaleY,
      nameBgWidth,
      nameBgHeight,
      0x111111,
      nameBgAlpha
    ).setOrigin(0.5).setDepth(10);
    // Player 2 background
    const player2Bg = this.add.rectangle(
      gameWidth - (210 * scaleX) + nameBgWidth/2,
      70 * scaleY + nameBgHeight/2 - 8 * scaleY,
      nameBgWidth,
      nameBgHeight,
      0x111111,
      nameBgAlpha
    ).setOrigin(0.5).setDepth(10);

    const playerName1 = this.add.text(
        10 * scaleX, 70 * scaleY, this.getDisplayName(this.p1), {
          fontSize: `${fontSize}px`,
          color: '#fff',
          fontStyle: 'bold',
          stroke: '#000',
          strokeThickness: 4,
          shadow: {
            offsetX: 0,
            offsetY: 2,
            color: '#000',
            blur: 4,
            fill: true
          }
        }) as Phaser.GameObjects.Text;
    playerName1.setDepth(11);

    const playerName2 = this.add.text(
        gameWidth - (210 * scaleX), 70 * scaleY, this.getDisplayName(this.p2), {
          fontSize: `${fontSize}px`,
          color: '#fff',
          fontStyle: 'bold',
          stroke: '#000',
          strokeThickness: 4,
          shadow: {
            offsetX: 0,
            offsetY: 2,
            color: '#000',
            blur: 4,
            fill: true
          }
        }) as Phaser.GameObjects.Text;
    playerName2.setDepth(11);
  }

  private createTouchControls(): void {
    const gameWidth = this.sys.game.canvas.width;
    const gameHeight = this.sys.game.canvas.height;
    const buttonSize = Math.floor(gameWidth * 0.13); // Responsive sizing
    const margin = Math.floor(gameWidth * 0.03);
    const bottomY = gameHeight - buttonSize/2 - margin;

    // D-Pad (left bottom corner):
    const dpadCenterX = buttonSize/2 + margin;
    const dpadCenterY = bottomY;
    // Left
    const leftButton = this.add.circle(dpadCenterX - buttonSize * 0.6, dpadCenterY, buttonSize * 0.45, 0x4444ff)
      .setAlpha(0.7).setDepth(1000).setInteractive().setScrollFactor(0);
    leftButton.on('pointerdown', this.handleLeftDown, this);
    leftButton.on('pointerup', this.handleLeftUp, this);
    leftButton.on('pointerout', this.handleLeftUp, this);
    // Right
    const rightButton = this.add.circle(dpadCenterX + buttonSize * 0.6, dpadCenterY, buttonSize * 0.45, 0x4444ff)
      .setAlpha(0.7).setDepth(1000).setInteractive().setScrollFactor(0);
    rightButton.on('pointerdown', this.handleRightDown, this);
    rightButton.on('pointerup', this.handleRightUp, this);
    rightButton.on('pointerout', this.handleRightUp, this);
    // Jump (above D-Pad)
    const jumpButton = this.add.circle(dpadCenterX, dpadCenterY - buttonSize * 0.9, buttonSize * 0.45, 0x44ff44)
      .setAlpha(0.7).setDepth(1000).setInteractive().setScrollFactor(0);
    jumpButton.on('pointerdown', this.handleJumpDown, this);
    jumpButton.on('pointerup', this.handleJumpUp, this);
    jumpButton.on('pointerout', this.handleJumpUp, this);

    // Action buttons (right bottom corner, arc layout):
    const actionArcCenterX = gameWidth - buttonSize/2 - margin;
    const actionArcCenterY = bottomY;
    const arcRadius = buttonSize * 0.9;
    // Attack (red, rightmost)
    const attackButton = this.add.circle(actionArcCenterX, actionArcCenterY, buttonSize * 0.45, 0xff4444)
      .setAlpha(0.7).setDepth(1000).setInteractive().setScrollFactor(0);
    attackButton.on('pointerdown', () => this.handleAttack());
    attackButton.on('pointerup', () => this.updateTouchControlState('attack', false));
    attackButton.on('pointerout', () => this.updateTouchControlState('attack', false));
    // Special (purple, above right)
    const specialButton = this.add.circle(actionArcCenterX - arcRadius * Math.cos(Math.PI/4), actionArcCenterY - arcRadius * Math.sin(Math.PI/4), buttonSize * 0.42, 0xff44ff)
      .setAlpha(0.7).setDepth(1000).setInteractive().setScrollFactor(0);
    specialButton.on('pointerdown', () => this.handleSpecial());
    specialButton.on('pointerup', () => this.updateTouchControlState('special', false));
    specialButton.on('pointerout', () => this.updateTouchControlState('special', false));
    // Block (yellow, above left)
    const blockButton = this.add.circle(actionArcCenterX - arcRadius * Math.cos(3*Math.PI/4), actionArcCenterY - arcRadius * Math.sin(3*Math.PI/4), buttonSize * 0.42, 0xffff44)
      .setAlpha(0.7).setDepth(1000).setInteractive().setScrollFactor(0);
    blockButton.on('pointerdown', () => {
      this.playerBlocking[this.localPlayerIndex] = true;
    });
    blockButton.on('pointerup', () => {
      this.playerBlocking[this.localPlayerIndex] = false;
    });
    blockButton.on('pointerout', () => {
      this.playerBlocking[this.localPlayerIndex] = false;
    });

    // Optional: Add icons/labels for clarity
    this.add.text(leftButton.x, leftButton.y, '<', { fontSize: `${buttonSize*0.5}px`, color: '#fff' }).setOrigin(0.5).setDepth(1001);
    this.add.text(rightButton.x, rightButton.y, '>', { fontSize: `${buttonSize*0.5}px`, color: '#fff' }).setOrigin(0.5).setDepth(1001);
    this.add.text(jumpButton.x, jumpButton.y, '⭡', { fontSize: `${buttonSize*0.45}px`, color: '#fff' }).setOrigin(0.5).setDepth(1001);
    this.add.text(attackButton.x, attackButton.y, 'A', { fontSize: `${buttonSize*0.5}px`, color: '#fff' }).setOrigin(0.5).setDepth(1001);
    this.add.text(specialButton.x, specialButton.y, 'S', { fontSize: `${buttonSize*0.45}px`, color: '#fff' }).setOrigin(0.5).setDepth(1001);
    this.add.text(blockButton.x, blockButton.y, 'B', { fontSize: `${buttonSize*0.45}px`, color: '#222' }).setOrigin(0.5).setDepth(1001);
  }

  // --- Touch Button Handlers ---
  private handleLeftDown(): void {
    console.log('[KidsFightScene] handleLeftDown called');
    this.updateTouchControlState('left', true);
    if (this.gameMode === 'online' && this.wsManager) {
      const moveMsg = {
        type: 'move',
        direction: -1,
        playerIndex: this.localPlayerIndex
      };
      console.debug('[KidsFightScene][WS SEND]', moveMsg); // DEBUG: Log outgoing move
      this.wsManager.send(moveMsg);
    }
  }
  
  private handleLeftUp(): void {
    this.updateTouchControlState('left', false);
    if (this.gameMode === 'online' && this.wsManager && this.players[this.localPlayerIndex]) {
      // Immediately send position_update on stop
      const player = this.players[this.localPlayerIndex];
      if (player) {
        const curr = {
          x: player.x,
          y: player.y,
          velocityX: player.body?.velocity.x || 0,
          velocityY: player.body?.velocity.y || 0,
          flipX: player.flipX,
          frame: (typeof player.frame === 'object' && player.frame !== null && 'name' in player.frame)
            ? player.frame.name
            : (typeof player.frame === 'string' || typeof player.frame === 'number')
              ? player.frame
              : (player.anims?.getFrameName?.() || null)
        };
        const positionMsg = {
          type: 'position_update',
          playerIndex: this.localPlayerIndex,
          ...curr
        };
        this.wsManager.send(positionMsg);
        this._lastSentPosition = { ...curr };
      }
    }
  }
  
  private handleRightDown(): void {
    this.updateTouchControlState('right', true);
    if (this.gameMode === 'online' && this.wsManager) {
      const moveMsg = {
        type: 'move',
        direction: 1,
        playerIndex: this.localPlayerIndex
      };
      console.debug('[KidsFightScene][WS SEND]', moveMsg); // DEBUG: Log outgoing move
      this.wsManager.send(moveMsg);
    }
  }

  private handleRightUp(): void {
    this.updateTouchControlState('right', false);
    if (this.gameMode === 'online' && this.wsManager && this.players[this.localPlayerIndex]) {
      // Immediately send position_update on stop
      const player = this.players[this.localPlayerIndex];
      if (player) {
        const curr = {
          x: player.x,
          y: player.y,
          velocityX: player.body?.velocity.x || 0,
          velocityY: player.body?.velocity.y || 0,
          flipX: player.flipX,
          frame: (typeof player.frame === 'object' && player.frame !== null && 'name' in player.frame)
            ? player.frame.name
            : (typeof player.frame === 'string' || typeof player.frame === 'number')
              ? player.frame
              : (player.anims?.getFrameName?.() || null)
        };
        const positionMsg = {
          type: 'position_update',
          playerIndex: this.localPlayerIndex,
          ...curr
        };
        this.wsManager.send(positionMsg);
        this._lastSentPosition = { ...curr };
      }
    }
  }

  private handleJumpDown(): void {
    this.updateTouchControlState('jump', true);
    if (this.gameMode === 'online' && this.wsManager) {
      this.wsManager.send({
        type: 'jump',
        playerIndex: this.localPlayerIndex
      });
    }
  }

  private handleJumpUp(): void {
    this.updateTouchControlState('jump', false);
  }

  public updateTouchControlState(
    control: 'left' | 'right' | 'jump' | 'attack' | 'special' | 'block',
    active: boolean
  ): void {
    // Use correct player index in all modes
    const player = this.players[this.localPlayerIndex];
    if (!player) return;
    switch (control) {
      case 'left':
        player.setVelocityX(active ? -160 : 0);
        break;
      case 'right':
        player.setVelocityX(active ? 160 : 0);
        break;
      case 'jump':
        if (active && player.body && ((player.body.blocked && player.body.blocked.down) || (player.body.touching && player.body.touching.down))) {
          player.setVelocityY(-330); // Standard jump
        }
        break;
      case 'attack':
        if (active) this.handleAttack();
        break;
      case 'special':
        if (active) this.handleSpecial();
        break;
      case 'block':
        this.playerBlocking[this.localPlayerIndex] = active;
}
}

  private handleSpecial(): void {
    if (this.playerSpecial[this.localPlayerIndex] < 3) return;
    const player = this.players[this.localPlayerIndex];
    if (player) player.setData('isSpecialAttacking', true);
    this.tryAction(this.localPlayerIndex, 'special', true);
    if (this.gameMode === 'online' && this.wsManager) {
      this.wsManager.send({ type: 'special', playerIndex: this.localPlayerIndex });
    }
    setTimeout(() => {
      const p = this.players[this.localPlayerIndex];
      if (p) p.setData('isSpecialAttacking', false);
    }, 300);
  }

  private handleAttack(): void {
    try {
      console.debug('[KidsFightScene][handleAttack] CALLED', { localPlayerIndex: this.localPlayerIndex, gameMode: this.gameMode });
      const player = this.players[this.localPlayerIndex];
      if (player) {
        player.setData('isAttacking', true);
      }
      this.tryAction(this.localPlayerIndex, 'attack', false);
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

  private endGame(winnerIndex: number, message: string = ''): void {
    this.gameOver = true;
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
    // Pause the game
    this.physics.pause();
    // this.scene.pause(); // Do NOT pause the scene, so UI remains interactive

    // Set game over state
    this.gameOver = true;

    // Lay down loser and set winner frame if not draw
    if (winnerIndex === 0 || winnerIndex === 1) {
      const winner = this.players[winnerIndex];
      const loser = this.players[1 - winnerIndex];
      if (winner && loser) {
        winner.setFrame?.(3);
        loser.setAngle?.(90);
      }
    }

    // Show winner text
    const winnerText = this.add.text(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2,
        winMsg,
        {fontSize: '48px', fill: '#fff'}
    ).setOrigin(0.5);

    // Add rematch button (works for both local and online mode)
    const rematchBtn = this.add.text(
      this.cameras.main.width / 2 - 100,
      this.cameras.main.height / 2 + 80,
      'Jogar Novamente',
      { fontSize: '32px', fill: '#0f0', backgroundColor: '#222', padding: { left: 20, right: 20, top: 10, bottom: 10 } }
    ).setOrigin(0.5).setInteractive().setDepth(1001);

    const menuBtn = this.add.text(
      this.cameras.main.width / 2 + 100,
      this.cameras.main.height / 2 + 80,
      'Voltar ao Menu',
      { fontSize: '32px', fill: '#fff', backgroundColor: '#222', padding: { left: 20, right: 20, top: 10, bottom: 10 } }
    ).setOrigin(0.5).setInteractive().setDepth(1001);

    rematchBtn.on('pointerdown', () => {
      if (this.gameMode === 'online' && this.wsManager) {
        // Ensure roomCode is a string before sending
        const roomCode = this.roomCode || '';
        this.wsManager.sendReplayRequest(roomCode, this.isHost ? 'host' : 'guest');
        rematchBtn.setText('Aguardando...');
        rematchBtn.disableInteractive();
      } else {
        this.scene.restart();
      }
    });

    menuBtn.on('pointerdown', () => {
      this.scene.start('GameModeScene');
    });
  }


private showReplayRequestPopup(data: ReplayData): void {
  // Create popup background
  const popup = this.add.rectangle(
    this.cameras.main.width / 2,
    this.cameras.main.height / 2,
    400, 200, 0x000000, 0.8
  ).setOrigin(0.5).setDepth(100);

  // Add text
  this.add.text(
    popup.x, popup.y - 40,
    'Pedido de Revanche!',
    { fontSize: '24px', fill: '#fff' }
  ).setOrigin(0.5).setDepth(101);

  // Add accept button
  const acceptButton = this.add.text(
    popup.x - 80, popup.y + 40,
    'Jogar Novamente',
    { fontSize: '20px', fill: '#0f0' }
  ).setOrigin(0.5).setInteractive().setDepth(101);

  // Add decline button
  const declineButton = this.add.text(
    popup.x + 80, popup.y + 40,
    'Rejeitar',
    { fontSize: '20px', fill: '#f00' }
  ).setOrigin(0.5).setInteractive().setDepth(101);

  // Handle button clicks
  acceptButton.on('pointerdown', () => {
    // Send accept response
    if (this.gameMode === 'online' && this.wsManager) {
      this.wsManager.send({
        type: 'replay_response',
        accepted: true
      });
    }
    popup.destroy();
    acceptButton.destroy();
    declineButton.destroy();
    this.scene.restart();
  });

  declineButton.on('pointerdown', () => {
    // Send decline response
    if (this.gameMode === 'online' && this.wsManager) {
      this.wsManager.send({
        type: 'replay_response',
        accepted: false
      });
    }
    popup.destroy();
    acceptButton.destroy();
    declineButton.destroy();
  });
}

private handleRemoteAction(action: RemoteAction): void {
  console.debug('[KidsFightScene][HANDLE REMOTE ACTION]', action); // DEBUG: Log action handling
  const player = this.players[action.playerIndex];
  if (!player) {
    console.warn('[KidsFightScene][HANDLE REMOTE ACTION] No player at index', action.playerIndex, this.players);
    return;
  }
  switch (action.type) {
    case 'move':
      if (typeof action.direction !== 'undefined') {
        console.debug('[KidsFightScene][REMOTE MOVE]', action); // DEBUG: Log remote move
        player.setVelocityX(action.direction * 160);
        player.setFlipX(action.direction < 0);
        this.playerDirection[action.playerIndex] = action.direction < 0 ? 'left' : 'right';
      }
      break;
    case 'position_update':
      // Only update position and animation, never health or attack
      if (typeof action.x === 'number' && typeof action.y === 'number') {
        player.x = action.x;
        player.y = action.y;
      }
      if (typeof action.velocityX === 'number') {
        player.setVelocityX(action.velocityX);
      }
      if (typeof action.velocityY === 'number') {
        player.setVelocityY(action.velocityY);
      }
      if (typeof action.flipX === 'boolean') {
        player.setFlipX(action.flipX);
      }
      if (typeof action.direction === 'number') {
        this.playerDirection[action.playerIndex] = action.direction < 0 ? 'left' : 'right';
      }
      // Optionally update animation frame if sent
      break;
    case 'jump':
      if (player.body?.touching?.down) {
        player.setVelocityY(-330); // Standard jump
      }
      break;
    case 'attack':
      if (this.players[0] && this.players[1]) {
        this.tryAction(action.playerIndex, 'attack', false);
      }
      break;
    case 'special':
      if (this.players[0] && this.players[1]) {
        this.tryAction(action.playerIndex, 'special', true);
      }
      break;
    case 'block':
      if (action.active !== undefined) {
        player.setData('isBlocking', action.active);
        this.playerBlocking[action.playerIndex] = action.active;
      }
      break;
    default:
      console.log('Unknown action type:', action.type);
      break;
  }

  // Update animation
  this.updatePlayerAnimation(action.playerIndex);
}

private tryAction(playerIndex: number, actionType: 'attack' | 'special', isSpecial: boolean): void {
  console.debug('[KidsFightScene][tryAction] CALLED', { playerIndex, actionType, isSpecial });
  // Defensive guard
  if (!this.players[0] || !this.players[1]) {
    console.warn('[SCENE] Players not ready for action', this.players);
    return;
  }
  const now = Date.now();
  const attacker = this.players[playerIndex];
  const targetIndex = playerIndex === 0 ? 1 : 0;
  const target = this.players[targetIndex];
  if (!attacker || !target) return;

  if (isSpecial) {
    if (this.playerSpecial[playerIndex] < 3) {
      // Not enough pips for special attack
      console.warn(`[KidsFightScene][tryAction] Player ${playerIndex + 1} tried special with only ${this.playerSpecial[playerIndex]} pips (need 3)`);
      // Optionally: Provide UI feedback here
      return;
    } else {
      // Enough pips: consume all pips
      this.playerSpecial[playerIndex] = 0;
      this.updateSpecialPips();
    }
  }
  this.tryAttack(playerIndex, targetIndex, now, isSpecial);
}

private tryAttack(attackerIdx: number, defenderIdx: number, now: number, special: boolean) {
  // EXTREMELY DETAILED LOGGING FOR DEBUGGING
  console.log('[DEBUG][tryAttack][START]', {
    attackerIdx,
    defenderIdx,
    attackerHealth: this.players[attackerIdx]?.health,
    defenderHealth: this.players[defenderIdx]?.health,
    playerHealthArray: this.playerHealth.slice(),
    DAMAGE: this.DAMAGE,
    SPECIAL_DAMAGE: this.SPECIAL_DAMAGE,
    TOTAL_HEALTH: this.TOTAL_HEALTH,
    special,
    gameMode: this.gameMode,
    isHost: this.isHost,
    localPlayerIndex: this.localPlayerIndex,
    stack: new Error().stack
  });
  if (console.trace) console.trace('[DEBUG][tryAttack][TRACE]');
  // Calculate damage using class fields, ensure hard cap
  let damage = special ? this.SPECIAL_DAMAGE : this.DAMAGE;
  if (damage > 10) {
    console.error('[DEBUG][tryAttack][ERROR] Damage value too high:', damage);
    damage = 10;
  }
  if (damage < 0) {
    console.error('[DEBUG][tryAttack][ERROR] Damage value negative:', damage);
    damage = 0;
  }
  // Defensive guard: prevent attack if players aren't ready
  if (!this.players[0] || !this.players[1]) {
    console.warn('[SCENE] Players not ready for attack', this.players);
    return;
  }
  const attacker = this.players[attackerIdx];
  const defender = this.players[defenderIdx];
  if (!attacker || !defender) {
    console.error('[TRYATTACK] Invalid attacker or defender index', attackerIdx, defenderIdx, this.players);
    return;
  }
  console.log('[TRYATTACK] BEFORE', {
    attackerIdx,
    defenderIdx,
    playerHealth: this.playerHealth.slice(),
    player1Health: this.players[0]?.health,
    player2Health: this.players[1]?.health
  });
  
  // --- FIX: Ensure health never goes below 0 and both health values stay in sync ---
  // Use playerHealth array as the source of truth to prevent double-decrement
  const currentHealth = Math.max(0, Math.min(MAX_HEALTH, this.playerHealth[defenderIdx]));
  const newHealth = Math.max(0, currentHealth - damage);
  
  console.log(`[HEALTH] Player ${defenderIdx + 1} health: ${currentHealth} -> ${newHealth} (damage: ${damage})`);
  
  // Update both the player object AND the health array
  this.playerHealth[defenderIdx] = newHealth;
  if (defender) {
    defender.health = newHealth;
  }
  
  // Force sync the other player's health reference if needed
  if (this.players[defenderIdx] && this.players[defenderIdx].health !== newHealth) {
    console.warn(`[HEALTH] Health out of sync for player ${defenderIdx + 1}, fixing...`);
    this.players[defenderIdx].health = newHealth;
  }

  console.log('[TRYATTACK] AFTER', {
    attackerIdx,
    defenderIdx,
    playerHealth: this.playerHealth.slice(),
    player1Health: this.players[0]?.health,
    player2Health: this.players[1]?.health
  });
  
  // Update health bar UI and check for winner
  console.debug('[KidsFightScene][tryAttack] Updating health bars...');
  
  try {
    // Update both health bars to ensure they're in sync
    this.updateHealthBar(0);
    this.updateHealthBar(1);
    
    // Force a render update
    this.scene.systems.displayList.depthSort();
    
    // Debug log the current health state
    console.log('[HEALTH] Updated health state:', {
      player1: { 
        health: this.playerHealth[0], 
        obj: this.players[0]?.health,
        barVisible: this.healthBar1?.visible,
        barExists: !!this.healthBar1
      },
      player2: { 
        health: this.playerHealth[1], 
        obj: this.players[1]?.health,
        barVisible: this.healthBar2?.visible,
        barExists: !!this.healthBar2
      },
      timestamp: Date.now()
    });
    
    console.debug('[KidsFightScene][tryAttack] Checking winner...');
    this.checkWinner();
  } catch (error) {
    console.error('Error updating health bars:', error);
    // Try to recreate health bars on error
    const scaleX = this.sys.game.canvas.width / 800;
    const scaleY = this.sys.game.canvas.height / 480;
    this.createHealthBars(scaleX, scaleY);
  }

  // --- Send health update to remote player in online mode ---
  if (this.gameMode === 'online' && this.wsManager && typeof this.wsManager.send === 'function') {
    // Only send health updates for attacks initiated by the local player
    // This prevents double health decrements from message echoes
    if (attackerIdx === this.localPlayerIndex) {
      const healthUpdate = {
        type: 'health_update',
        playerIndex: defenderIdx,
        health: this.playerHealth[defenderIdx]
      };
      console.debug('[KidsFightScene][tryAttack] SENDING health_update', {
        healthUpdate,
        localPlayerIndex: this.localPlayerIndex,
        attackerIdx, defenderIdx,
        playerHealth: this.playerHealth.slice(),
        players: [
          this.players[0] ? {health: this.players[0].health} : null,
          this.players[1] ? {health: this.players[1].health} : null
        ]
      });
      this.wsManager.send(JSON.stringify(healthUpdate));
    } else {
      console.debug('[KidsFightScene][tryAttack] NOT sending health_update for non-local player attack', {
        localPlayerIndex: this.localPlayerIndex,
        attackerIdx
      });
    }
  }

  // Update special pips after attack
  this.updateSpecialPips();

  // Award special points for successful hits
  if (!special && attackerIdx === 0 && this.playerSpecial[0] < 3) {
    this.playerSpecial[0] = Math.min(3, this.playerSpecial[0] + 1);
    console.debug('[KidsFightScene][tryAttack] Player 1 special awarded:', this.playerSpecial[0]);
    this.updateSpecialPips();
  }
  if (!special && attackerIdx === 1 && this.playerSpecial[1] < 3) {
    this.playerSpecial[1] = Math.min(3, this.playerSpecial[1] + 1);
    console.debug('[KidsFightScene][tryAttack] Player 2 special awarded:', this.playerSpecial[1]);
    this.updateSpecialPips();
  }
}

  private updatePlayerAnimation(playerIndex: number, isWalking?: boolean, time?: number): void {
    const player = playerIndex === 0 ? this.players[0] : this.players[1];
    
    // If player doesn't exist, do nothing
    if (!player) return;
    
    // If called with isWalking parameter (legacy call)
    if (isWalking !== undefined) {
      // Use setFrame for walk animation
      if (isWalking) {
        // Alternate between frames 1 and 2 based on current time
        const frame = (Math.floor(Date.now() / 120) % 2) + 1; // 1 or 2
        player.setFrame(frame);
      } else {
        player.setFrame(0); // Idle frame
      }
      return;
    }

    // New animation logic - safely check if player exists before each operation
    if (player && player.getData && player.getData('isHit')) {
      // Optionally set a hit frame
      player.setFrame(3); // Example: frame 3 for hit
      // DEBUG
      //console.log('ANIM: HIT', playerIndex);
    } else if (player && player.getData && player.getData('isSpecialAttacking')) {
      player.setFrame(6); // Frame 6 for special attack (last valid frame)
      // DEBUG
      //console.log('ANIM: SPECIAL ATTACK', playerIndex);
    } else if (player && player.getData && player.getData('isAttacking')) {
      player.setFrame(4); // Frame 4 for attack
      // DEBUG
      //console.log('ANIM: ATTACK', playerIndex);
    } else if (player && player.body && !player.body.blocked.down) {
      player.setFrame(0); // Use idle frame for jump (customize if needed)
      // DEBUG
      //console.log('ANIM: JUMP', playerIndex);
    } else if (player && player.body && player.body.blocked.down && Math.abs(player.body.velocity.x) > 2) {
      // Walking: alternate between frame 1 and 2
      const frame = (Math.floor(Date.now() / 120) % 2) + 1;
      player.setFrame(frame);
      // DEBUG
      //console.log('ANIM: WALK', playerIndex, player.body.velocity.x);
    } else if (player) {
      player.setFrame(0); // Idle
      // DEBUG
      //console.log('ANIM: IDLE', playerIndex);
    }
  }

  private showTouchControls(visible: boolean): void {
    // Show/hide all known touch control buttons if they exist
    const buttons = ['leftButton', 'rightButton', 'jumpButton', 'attackButton', 'specialButton', 'blockButton'];
    for (const btnName of buttons) {
      const btn = (this as any)[btnName];
      if (btn && typeof btn.setVisible === 'function') {
        btn.setVisible(visible);
      }
    }
  }

  private checkWinner(): boolean {
    if (this.gameOver) return false;
    
    // Always use playerHealth array as the source of truth for health values
    const p1Health = this.playerHealth[0] ?? MAX_HEALTH;
    const p2Health = this.playerHealth[1] ?? MAX_HEALTH;

    // Debug log health values
    console.log(`[DEBUG][checkWinner] Player 1 Health: ${p1Health}, Player 2 Health: ${p2Health}`);

    if (p1Health <= 0 || p2Health <= 0) {
      // Determine the winner based on who still has health
      if (p1Health <= 0 && p2Health <= 0) {
        // Both players hit 0 health at the same time (unlikely but possible)
        this.endGame(-1, 'Empate!');
      } else if (p1Health <= 0) {
        // Player 2 won
        this.endGame(1, `${this.getDisplayName(this.p2)} Venceu!`);
      } else {
        // Player 1 won
        this.endGame(0, `${this.getDisplayName(this.p1)} Venceu!`);
      }
      return true;
    } else if (this.timeLeft <= 0) {
      // Time's up - check who has more health
      if (p1Health > p2Health) {
        this.endGame(0, `${this.getDisplayName(this.p1)} Venceu!`);
      } else if (p2Health > p1Health) {
        this.endGame(1, `${this.getDisplayName(this.p2)} Venceu!`);
      } else {
        this.endGame(-1, 'Empate!');
      }
      return true;
    }
    
    return false;
  }

  update(time: number, delta: number): void {
    // Call animation update for both players every frame
    this.updatePlayerAnimation(0);
    this.updatePlayerAnimation(1);

    // Check for a winner
    this.checkWinner();

    // --- Player cross logic ---
    if (this.players[0] && this.players[1]) {
      // If player1 is to the right of player2, swap their directions and flipX
      if ((this.players[0].x ?? 0) > (this.players[1].x ?? 0)) {
        this.players[0].setFlipX(true);
        this.players[1].setFlipX(false);
        this.playerDirection[0] = 'left';
        this.playerDirection[1] = 'right';
      } else {
        this.players[0].setFlipX(false);
        this.players[1].setFlipX(true);
        this.playerDirection[0] = 'right';
        this.playerDirection[1] = 'left';
      }
    }

    if (this.gameMode === 'online' && this.wsManager && this.players[this.localPlayerIndex]) {
      const player = this.players[this.localPlayerIndex];
      if (!player) return; // Safety check
      
      // Create position update with null checks
      const curr = {
        x: player.x,
        y: player.y,
        velocityX: player.body?.velocity.x || 0,
        velocityY: player.body?.velocity.y || 0,
        flipX: player.flipX || false,
        frame: (typeof player.frame === 'object' && player.frame !== null && 'name' in player.frame)
          ? player.frame.name
          : (typeof player.frame === 'string' || typeof player.frame === 'number')
            ? player.frame
            : (player.anims?.getFrameName?.() || null)
      };

      if (!this._lastSentPosition ||
        (curr && this._lastSentPosition && (
          curr.x !== this._lastSentPosition.x ||
          curr.y !== this._lastSentPosition.y ||
          curr.velocityX !== this._lastSentPosition.velocityX ||
          curr.velocityY !== this._lastSentPosition.velocityY ||
          curr.flipX !== this._lastSentPosition.flipX ||
          curr.frame !== this._lastSentPosition.frame
        ))) {
        const positionMsg = {
          type: 'position_update',
          playerIndex: this.localPlayerIndex,
          ...curr
        };
        this.wsManager.send(positionMsg);
        this._lastSentPosition = { ...curr };
      }
    }
  }
}

export default KidsFightScene;
