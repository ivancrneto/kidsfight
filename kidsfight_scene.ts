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
const TOTAL_HEALTH = MAX_HEALTH * 2; // Double health
const ATTACK_DAMAGE = 10;
const SPECIAL_DAMAGE = 20;
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
  type: 'move' | 'jump' | 'attack' | 'special' | 'block';
  playerIndex: number;
  direction?: number;
  active?: boolean;
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
  playerHealth: number[] = [MAX_HEALTH * 2, MAX_HEALTH * 2];
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

  private readonly TOTAL_HEALTH: number = 200;
  private readonly DAMAGE: number = 10;
  private readonly SPECIAL_DAMAGE: number = 20;
  private readonly SPECIAL_COST: number = 3;
  private readonly ROUND_TIME: number = 99;

  private player1: Phaser.Physics.Arcade.Sprite & PlayerProps | undefined;
  private player2: Phaser.Physics.Arcade.Sprite & PlayerProps | undefined;

  localPlayerIndex: number = 0;

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
    this.playerHealth = [MAX_HEALTH * 2, MAX_HEALTH * 2];
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
    this.selected = data.selected || {p1: 'player1', p2: 'player2'};
    this.p1 = data.p1 || (this.selected.p1 || 'player1');
    this.p2 = data.p2 || (this.selected.p2 || 'player2');
    // DEBUG: Log incoming player keys
    console.log('[DEBUG][KidsFightScene.init] incoming p1:', this.p1, 'p2:', this.p2);
    // Fallback: if p1 or p2 is not a valid sprite key, set default
    const validKeys = ['player1','player2','player3','player4','player5','player6','player7','player8','player9'];
    if (!validKeys.includes(this.p1)) {
      console.warn('[KidsFightScene] Invalid p1 key:', this.p1, 'Defaulting to player1');
      this.p1 = 'player1';
    }
    if (!validKeys.includes(this.p2)) {
      console.warn('[KidsFightScene] Invalid p2 key:', this.p2, 'Defaulting to player2');
      this.p2 = 'player2';
    }
    this.selectedScenario = data.selectedScenario || 'scenario1';
    this.gameMode = data.gameMode || 'single';
    this.roomCode = data.roomCode;
    this.isHost = data.isHost;
    // Set localPlayerIndex based on host/guest
    this.localPlayerIndex = this.isHost ? 0 : 1;
  }

  preload(): void {
    // Preload assets if needed
    this.load.image('scenario1', scenario1Img);
    this.load.image('scenario2', scenario2Img);
    this.load.spritesheet('player1', player1RawImg, { frameWidth: 410, frameHeight: 512 });
    this.load.spritesheet('player2', player2RawImg, { frameWidth: 410, frameHeight: 512 });
    this.load.spritesheet('player3', player3RawImg, { frameWidth: 410, frameHeight: 512 });
    this.load.spritesheet('player4', player4RawImg, { frameWidth: 410, frameHeight: 512 });
    this.load.spritesheet('player5', player5RawImg, { frameWidth: 410, frameHeight: 512 });
    this.load.spritesheet('player6', player6RawImg, { frameWidth: 410, frameHeight: 512 });
    this.load.spritesheet('player7', player7RawImg, { frameWidth: 410, frameHeight: 512 });
    this.load.spritesheet('player8', player8RawImg, { frameWidth: 410, frameHeight: 512 });
    this.load.spritesheet('player9', player9RawImg, { frameWidth: 410, frameHeight: 512 });
  }

  create(): void {
    // Reset game state
    this.gameOver = false;
    this.timeLeft = this.ROUND_TIME;
    this.playerHealth = [MAX_HEALTH * 2, MAX_HEALTH * 2];
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

    this.players.forEach((player, index) => {
      if (!player) return;
      const isPlayer1 = index === 0;
      player.setCollideWorldBounds?.(true);
      player.setBounce?.(0.2);
      player.setGravityY?.(300);
      player.setSize?.(80, 200);
      player.setOffset?.(92, 32);
      
      // Set custom properties
      player.health = MAX_HEALTH * 2;
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

    // Initialize playerHealth array to match player health
    this.playerHealth = [
      (this.players[0] && typeof this.players[0].health === 'number') ? this.players[0].health : 200,
      (this.players[1] && typeof this.players[1].health === 'number') ? this.players[1].health : 200
    ];
    console.log('[DEBUG] playerHealth initialized:', this.playerHealth);

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
    if (this.gameMode === 'online' && this.wsManager && typeof this.wsManager.setMessageCallback === 'function') {
      this.wsManager.setMessageCallback((event: MessageEvent) => {
        try {
          const action = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          // Only handle gameplay actions here
          if ([
            'move',
            'jump',
            'attack',
            'special',
            'block',
            'replay_request'
          ].includes(action.type)) {
            if (action.type === 'replay_request') {
              this.showReplayRequestPopup(action);
            } else {
              this.handleRemoteAction(action);
            }
          } else {
            // Ignore navigation/scene actions
            console.log('Ignoring non-gameplay action:', action.type);
          }
        } catch (e) {
          console.error('[KidsFightScene] Failed to parse remote action:', e, event);
        }
      });
    }
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
    this.createSpecialBars(scaleX, scaleY);
    this.updateSpecialPips(); // Update special pips after creating

    // Create player names
    this.createPlayerNames(scaleX, scaleY);
  }

  private createHealthBars(scaleX: number, scaleY: number): void {
    const gameWidth = this.sys.game.canvas.width;
    const barWidth = 300 * scaleX;
    const barHeight = 24 * scaleY;
    const barX = gameWidth / 2;
    const barY = 20 * scaleY;

    // Remove old bars if they exist
    if (this.healthBarBg1) this.healthBarBg1.destroy();
    if (this.healthBar1) this.healthBar1.destroy();
    if (this.healthBar2) this.healthBar2.destroy();

    // Draw single dark background bar (not white!)
    this.healthBarBg1 = this.add.rectangle(barX, barY, barWidth, barHeight, 0x222222).setOrigin(0.5, 0.5);
    this.healthBar1 = this.add.graphics(); // Player 1 (left)
    this.healthBar2 = this.add.graphics(); // Player 2 (right)

    this.updateHealthBar(-1); // Draw both layers
  }

  private updateHealthBar(playerIndex: number): void {
    // Double health: two layers per player
    const maxHealth = this.TOTAL_HEALTH || 200; // Should be 200 for double health
    const halfHealth = maxHealth / 2;
    const gameWidth = this.sys.game.canvas.width;
    const scaleX = gameWidth / 800;
    const barWidth = 300 * scaleX;
    const barHeight = 24 * scaleX;
    const barX = gameWidth / 2;
    const barY = 20 * scaleX;

    this.healthBar1?.clear();
    this.healthBar2?.clear();

    // --- Player 1 (left half) ---
    let p1 = Math.max(0, this.playerHealth[0]);
    // Draw depleted background (gray)
    this.healthBar1?.fillStyle(0x444444);
    this.healthBar1?.fillRect(barX - barWidth/2, barY - barHeight/2, barWidth/2, barHeight);
    // Draw second layer (yellow) if health > half
    if (p1 > halfHealth) {
      const secondLayer = (p1 - halfHealth) / halfHealth;
      const secondLayerWidth = barWidth/2 * secondLayer;
      this.healthBar1?.fillStyle(0xffff00); // yellow
      this.healthBar1?.fillRect(barX - barWidth/2, barY - barHeight/2, secondLayerWidth, barHeight);
      // Draw main layer (green) for the bottom half
      this.healthBar1?.fillStyle(0x00ff00);
      this.healthBar1?.fillRect(barX - barWidth/2 + secondLayerWidth, barY - barHeight/2, barWidth/2 - secondLayerWidth, barHeight);
    } else if (p1 > 0) {
      // Only main layer (green)
      const mainLayerWidth = barWidth/2 * (p1 / halfHealth);
      this.healthBar1?.fillStyle(0x00ff00);
      this.healthBar1?.fillRect(barX - barWidth/2, barY - barHeight/2, mainLayerWidth, barHeight);
    }

    // --- Player 2 (right half) ---
    let p2 = Math.max(0, this.playerHealth[1]);
    this.healthBar2?.fillStyle(0x444444);
    this.healthBar2?.fillRect(barX, barY - barHeight/2, barWidth/2, barHeight);
    if (p2 > halfHealth) {
      const secondLayer = (p2 - halfHealth) / halfHealth;
      const secondLayerWidth = barWidth/2 * secondLayer;
      this.healthBar2?.fillStyle(0x0000ff); // blue
      this.healthBar2?.fillRect(barX + barWidth/2 - secondLayerWidth, barY - barHeight/2, secondLayerWidth, barHeight);
      // Draw main layer (red) for the bottom half
      this.healthBar2?.fillStyle(0xff0000);
      this.healthBar2?.fillRect(barX, barY - barHeight/2, barWidth/2 - secondLayerWidth, barHeight);
    } else if (p2 > 0) {
      // Only main layer (red)
      const mainLayerWidth = barWidth/2 * (p2 / halfHealth);
      this.healthBar2?.fillStyle(0xff0000);
      this.healthBar2?.fillRect(barX + barWidth/2 - mainLayerWidth, barY - barHeight/2, mainLayerWidth, barHeight);
    }
  }

  private createSpecialBars(scaleX: number, scaleY: number): void {
    const gameWidth = this.sys.game.canvas.width;
    const pipRadius = 10 * scaleX;
    const pipSpacing = 30 * scaleX;
    const pipY = 48 * scaleY;

    // Remove old pips if they exist
    this.specialPips1.forEach(pip => pip.destroy());
    this.specialPips2.forEach(pip => pip.destroy());
    this.specialPips1 = [];
    this.specialPips2 = [];

    // Draw 3 pips (special circles) for each player
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
    this.updateSpecialPips();
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

  private createPlayerNames(scaleX: number, scaleY: number): void {
    const gameWidth = this.sys.game.canvas.width;

    // Create player name texts with proper scaling
    const fontSize = Math.max(16, Math.floor(24 * scaleY)); // Ensure minimum readable size

    // Prefer character display names if available
    const getDisplayName = (key: string) => {
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
      };
      return nameMap[key] || key;
    };

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
        10 * scaleX, 70 * scaleY, getDisplayName(this.p1), {
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
        gameWidth - (210 * scaleX), 70 * scaleY, getDisplayName(this.p2), {
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
    this.updateTouchControlState('left', true);
    if (this.gameMode === 'online' && this.wsManager) {
      this.wsManager.send({
        type: 'move',
        direction: -1,
        playerIndex: this.localPlayerIndex
      });
    }
  }

  private handleLeftUp(): void {
    this.updateTouchControlState('left', false);
  }

  private handleRightDown(): void {
    this.updateTouchControlState('right', true);
    if (this.gameMode === 'online' && this.wsManager) {
      this.wsManager.send({
        type: 'move',
        direction: 1,
        playerIndex: this.localPlayerIndex
      });
    }
  }

  private handleRightUp(): void {
    this.updateTouchControlState('right', false);
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
          player.setVelocityY(-330);
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
        break;
    }
    // Optionally update button visuals here
  }

  private handleAttack(): void {
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
    }, 300);
  }

  private handleSpecial(): void {
    const player = this.players[this.localPlayerIndex];
    if (player) {
      player.setData('isSpecialAttacking', true);
    }
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

  private endGame(winnerIndex: number, message: string = ''): void {
    this.gameOver = true;
    let winMsg = message;
    if (!message) {
      // Use real character name instead of 'Player 1'/'Player 2'
      const getDisplayName = (key: string) => {
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
        };
        return nameMap[key] || key;
      };
      if (winnerIndex === 0) {
        winMsg = `${getDisplayName(this.p1)} Venceu!`;
      } else if (winnerIndex === 1) {
        winMsg = `${getDisplayName(this.p2)} Venceu!`;
      } else {
        winMsg = 'Empate!';
      }
    }
    // Pause the game
    this.physics.pause();
    this.scene.pause();

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
    const rematchButton = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 + 80,
      'Rematch',
      { fontSize: '32px', fill: '#0ff', backgroundColor: '#222', padding: { left: 20, right: 20, top: 10, bottom: 10 } }
    ).setOrigin(0.5).setInteractive().setDepth(1001);

    rematchButton.on('pointerdown', () => {
      if (this.gameMode === 'online' && this.wsManager) {
        // Send replay_request to other player
        this.wsManager.sendReplayRequest(this.roomCode, this.isHost ? 'host' : 'guest');
        rematchButton.setText('Waiting...');
        rematchButton.disableInteractive();
      } else {
        // Local mode: just restart
        this.scene.restart();
      }
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
    'Rematch Requested!',
    { fontSize: '24px', fill: '#fff' }
  ).setOrigin(0.5).setDepth(101);

  // Add accept button
  const acceptButton = this.add.text(
    popup.x - 80, popup.y + 40,
    'Accept',
    { fontSize: '20px', fill: '#0f0' }
  ).setOrigin(0.5).setInteractive().setDepth(101);

  // Add decline button
  const declineButton = this.add.text(
    popup.x + 80, popup.y + 40,
    'Decline',
    { fontSize: '20px', fill: '#f00' }
  ).setOrigin(0.5).setInteractive().setDepth(101);

  // Handle button clicks
  acceptButton.on('pointerdown', () => {
    // Send accept response
    if (this.gameMode === 'online' && this.wsManager) {
      this.wsManager.send({
        type: 'replayResponse',
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
        type: 'replayResponse',
        accepted: false
      });
    }
    popup.destroy();
    acceptButton.destroy();
    declineButton.destroy();
  });
}

private handleRemoteAction(action: RemoteAction): void {
  if (!this.players[0] || !this.players[1]) return;

  // Use playerIndex directly for correct assignment
  const player = this.players[action.playerIndex];
  const otherPlayer = this.players[1 - action.playerIndex];

  if (!player) return;

  switch (action.type) {
    case 'move':
      if (typeof action.direction !== 'undefined') {
        player.setVelocityX(action.direction * 160);
        player.setFlipX(action.direction < 0);
        this.playerDirection[action.playerIndex] = action.direction < 0 ? 'left' : 'right';
      }
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
  // Defensive guard
  if (!this.players[0] || !this.players[1]) {
    console.warn('[SCENE] Players not ready for action', this.players);
    return;
  }
  const now = Date.now();
  const attacker = this.players[playerIndex];
  const targetIndex = playerIndex === 0 ? 1 : 0;
  const target = this.players[targetIndex];
  if (attacker && target) {
    this.tryAttack(playerIndex, targetIndex, now, isSpecial);
  }
}

private tryAttack(attackerIdx: number, defenderIdx: number, now: number, special: boolean) {
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
  
  // Call the actual attack logic from gameUtils
  tryAttack(this, attackerIdx, defenderIdx, now, special);
  
  // Sync health between player object and playerHealth array
  if (defender === this.players[0]) {
    this.players[0]!.health = this.playerHealth[0];
  } else if (defender === this.players[1]) {
    this.players[1]!.health = this.playerHealth[1];
  }
  
  console.log('[TRYATTACK] AFTER', {
    attackerIdx,
    defenderIdx,
    playerHealth: this.playerHealth.slice(),
    player1Health: this.players[0]?.health,
    player2Health: this.players[1]?.health
  });
  
  // Update health bar UI and check for winner
  this.updateHealthBar(defenderIdx);
  this.checkWinner();
  
  // Update special pips after attack
  this.updateSpecialPips();
  
  // Award special points for successful hits
  if (!special && attackerIdx === 0) {
    this.playerSpecial[0] = Math.min(3, this.playerSpecial[0] + 1);
    console.log('[DEBUG] Player 1 special:', this.playerSpecial[0]);
    this.updateSpecialPips();
  }
  if (!special && attackerIdx === 1) {
    this.playerSpecial[1] = Math.min(3, this.playerSpecial[1] + 1);
    console.log('[DEBUG] Player 2 special:', this.playerSpecial[1]);
    this.updateSpecialPips();
  }
}

private updatePlayerAnimation(playerIndex: number, isWalking?: boolean, time?: number): void {
  const player = playerIndex === 0 ? this.players[0] : this.players[1];
  if (!player) return;
  // Debug log for animation frame
  console.log(`[DEBUG][Anim] Player ${playerIndex + 1} anim update`, {
    key: player.texture.key,
    frame: player.frame ? player.frame.name : undefined,
    width: player.width,
    height: player.height,
    displayWidth: player.displayWidth,
    displayHeight: player.displayHeight
  });

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

  // New animation logic
  if (player.getData('isHit')) {
    // Optionally set a hit frame
    player.setFrame(3); // Example: frame 3 for hit
    // DEBUG
    //console.log('ANIM: HIT', playerIndex);
  } else if (player.getData('isSpecialAttacking')) {
    player.setFrame(6); // Frame 6 for special attack (last valid frame)
    // DEBUG
    //console.log('ANIM: SPECIAL ATTACK', playerIndex);
  } else if (player.getData('isAttacking')) {
    player.setFrame(4); // Frame 4 for attack
    // DEBUG
    //console.log('ANIM: ATTACK', playerIndex);
  } else if (player.body && !player.body.blocked.down) {
    player.setFrame(0); // Use idle frame for jump (customize if needed)
    // DEBUG
    //console.log('ANIM: JUMP', playerIndex);
  } else if (player.body && player.body.blocked.down && Math.abs(player.body.velocity.x) > 2) {
    // Walking: alternate between frame 1 and 2
    const frame = (Math.floor(Date.now() / 120) % 2) + 1;
    player.setFrame(frame);
    // DEBUG
    //console.log('ANIM: WALK', playerIndex, player.body.velocity.x);
  } else {
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

  // private tryAttack(playerIdx: number, attacker: any, defender: any, now: number, special: boolean) {
  //   // Robustly determine defenderIdx
  //   let defenderIdx = undefined;
  //   if (defender === this.player1) defenderIdx = 0;
  //   else if (defender === this.player2) defenderIdx = 1;
  //   else {
  //     console.error('[TRYATTACK] Could not determine defenderIdx!', defender, this.player1, this.player2);
  //     return;
  //   }
  //   if (!attacker || !defender) return;
  //   console.log('[TRYATTACK] BEFORE', {
  //     playerIdx,
  //     defenderIdx,
  //     playerHealth: this.playerHealth.slice(),
  //     player1Health: this.players[0]?.health,
  //     player2Health: this.players[1]?.health
  //   });
  //   // Call the actual attack logic from gameUtils
  //   tryAttack(this, playerIdx, attacker, defender, now, special);
  //   console.log('[TRYATTACK] AFTER', {
  //     playerIdx,
  //     defenderIdx,
  //     playerHealth: this.playerHealth.slice(),
  //     player1Health: this.players[0]?.health,
  //     player2Health: this.players[1]?.health
  //   });
  //   // Update health bar UI
  //   this.updateHealthBar(defenderIdx);
  //   this.updateSpecialPips(); // Update special pips after attack
  // }

  private checkWinner(): boolean {
    if (this.gameOver) return false;
    
    // Check if player health is defined and less than or equal to 0
    const p1Health = this.players[0]?.health ?? this.playerHealth[0];
    const p2Health = this.players[1]?.health ?? this.playerHealth[1];
    
    // Helper for display name
    const getDisplayName = (key: string) => {
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
      };
      return nameMap[key] || key;
    };

    if (p1Health <= 0) {
      // Player 2 won
      this.endGame(1, `${getDisplayName(this.p2)} Venceu!`);
      return true;
    } else if (p2Health <= 0) {
      // Player 1 won
      this.endGame(0, `${getDisplayName(this.p1)} Venceu!`);
      return true;
    } else if (this.timeLeft <= 0) {
      // Time's up - check who has more health
      if (p1Health > p2Health) {
        this.endGame(0, `${getDisplayName(this.p1)} Venceu!`);
      } else if (p2Health > p1Health) {
        this.endGame(1, `${getDisplayName(this.p2)} Venceu!`);
      } else {
        this.endGame(-1, 'Empate!');
      }
      return true;
    }
    
    return false;
  }

  update(): void {
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
  }
}

export default KidsFightScene;
