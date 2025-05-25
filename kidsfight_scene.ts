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
const TOTAL_HEALTH = MAX_HEALTH; // Just one health bar
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
  private player1?: Phaser.Physics.Arcade.Sprite & PlayerProps;
  private player2?: Phaser.Physics.Arcade.Sprite & PlayerProps;
  private platform?: Phaser.GameObjects.Rectangle;
  private background?: Phaser.GameObjects.Image;
  private healthBar1?: Phaser.GameObjects.Graphics;
  private healthBar2?: Phaser.GameObjects.Graphics;
  private healthBarBg1?: Phaser.GameObjects.Rectangle;
  private healthBarBg2?: Phaser.GameObjects.Rectangle;
  private specialBar1?: Phaser.GameObjects.Rectangle;
  private specialBar2?: Phaser.GameObjects.Rectangle;
  private specialBarBg1?: Phaser.GameObjects.Rectangle;
  private specialBarBg2?: Phaser.GameObjects.Rectangle;
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
  private specialPips1: Phaser.GameObjects.Graphics[] = [];
  private specialPips2: Phaser.GameObjects.Graphics[] = [];
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

  private readonly TOTAL_HEALTH: number = 100;
  private readonly DAMAGE: number = 10;
  private readonly SPECIAL_DAMAGE: number = 20;
  private readonly SPECIAL_COST: number = 3;
  private readonly ROUND_TIME: number = 99;

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
    this.playerHealth = [MAX_HEALTH, MAX_HEALTH];
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
  }

  // Initialization methods
  init(data: SceneData): void {
    console.log('KidsFightScene init with data:', data);
    this.selected = data.selected || {p1: 'player1', p2: 'player2'};
    this.p1 = data.p1 || 'player1';
    this.p2 = data.p2 || 'player2';
    this.selectedScenario = data.selectedScenario || 'scenario1';
    this.gameMode = data.gameMode || 'single';
    this.roomCode = data.roomCode;
    this.isHost = data.isHost;
  }

  preload(): void {
    // Preload assets if needed
    this.load.image('scenario1', scenario1Img);
    this.load.image('scenario2', scenario2Img);
    this.load.spritesheet('player1', player1RawImg, { frameWidth: 264, frameHeight: 264 });
    this.load.spritesheet('player2', player2RawImg, { frameWidth: 264, frameHeight: 264 });
    this.load.spritesheet('player3', player3RawImg, { frameWidth: 264, frameHeight: 264 });
    this.load.spritesheet('player4', player4RawImg, { frameWidth: 264, frameHeight: 264 });
    this.load.spritesheet('player5', player5RawImg, { frameWidth: 264, frameHeight: 264 });
    this.load.spritesheet('player6', player6RawImg, { frameWidth: 264, frameHeight: 264 });
    this.load.spritesheet('player7', player7RawImg, { frameWidth: 264, frameHeight: 264 });
    this.load.spritesheet('player8', player8RawImg, { frameWidth: 264, frameHeight: 264 });
    this.load.spritesheet('player9', player9RawImg, { frameWidth: 264, frameHeight: 264 });
  }

  create(): void {
    // Get the current game dimensions
    const gameWidth = this.sys.game.canvas.width;
    const gameHeight = this.sys.game.canvas.height;
    
    console.log('Creating KidsFightScene with settings:', {
      dimensions: `${gameWidth}x${gameHeight}`,
      isMobile: this.sys.game.device.os.android || this.sys.game.device.os.iOS,
      selectedScenario: this.selectedScenario,
      p1: this.p1,
      p2: this.p2,
      selected: this.selected,
      gameMode: this.gameMode
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
    const upperPlatformY = platformHeight - gameHeight * 0.2;

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

    // Create players with proper positioning and selected characters
    // Place player feet directly on the upper platform
    this.player1 = this.physics.add.sprite(gameWidth * 0.25, upperPlatformY, this.p1) as Phaser.Physics.Arcade.Sprite & PlayerProps;
    this.player2 = this.physics.add.sprite(gameWidth * 0.75, upperPlatformY, this.p2) as Phaser.Physics.Arcade.Sprite & PlayerProps;
    this.player1.setOrigin(0.5, 1.0);
    this.player2.setOrigin(0.5, 1.0);

    // Enable collision between players and the new upper platform
    this.physics.add.collider(this.player1, upperPlatform);
    this.physics.add.collider(this.player2, upperPlatform);

    [this.player1, this.player2].forEach((player, index) => {
      const isPlayer1 = index === 0;
      player.setCollideWorldBounds(true);
      player.setBounce(0.2);
      player.setGravityY(300);
      player.setSize(80, 200);
      player.setOffset(92, 32);
      
      // Set custom properties
      player.health = MAX_HEALTH;
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

    // Apply scaling to player 1
    this.player1.setScale(0.4); // Decrease scale for appropriate size
    this.player1.setDepth(1);


    // Apply scaling to player 2
    this.player2.setScale(0.4); // Decrease scale for appropriate size
    this.player2.setCollideWorldBounds(true);
    this.player2.setBounce(0.2);
    this.player2.setDepth(1);

    // Adjust the physics bodies to match the scaled sprites
    if (this.player1.body && this.player2.body) {
      // Make hitbox slightly smaller than visual sprite for better gameplay
      this.player1.body.setSize(this.player1.width * 0.6, this.player1.height * 0.5);
      this.player2.body.setSize(this.player2.width * 0.6, this.player2.height * 0.5);

      // Set offset to center the hitbox
      this.player1.body.setOffset(this.player1.width * 0.2, this.player1.height * 0.25);
      this.player2.body.setOffset(this.player2.width * 0.2, this.player2.height * 0.25);

      // Increase gravity on mobile for better feel
      if (this.sys.game.device.os.android || this.sys.game.device.os.iOS) {
        this.player1.body.setGravityY(300);
        this.player2.body.setGravityY(300);
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

    // Create player names
    this.createPlayerNames(scaleX, scaleY);
  }

  private createHealthBars(scaleX: number, scaleY: number): void {
    const gameWidth = this.sys.game.canvas.width;

    // Create health bar backgrounds with proper scaling
    this.healthBarBg1 = this.add.rectangle(10 * scaleX, 10 * scaleY, 200 * scaleX, 20 * scaleY, 0xffffff) as Phaser.GameObjects.Rectangle;
    this.healthBarBg2 = this.add.rectangle(gameWidth - (210 * scaleX), 10 * scaleY, 200 * scaleX, 20 * scaleY, 0xffffff) as Phaser.GameObjects.Rectangle;

    // Create health bars
    this.healthBar1 = this.add.graphics() as Phaser.GameObjects.Graphics;
    this.healthBar2 = this.add.graphics() as Phaser.GameObjects.Graphics;

    // Initialize health bars
    this.updateHealthBar(0);
    this.updateHealthBar(1);
  }

  private createSpecialBars(scaleX: number, scaleY: number): void {
    const gameWidth = this.sys.game.canvas.width;

    // Create special bar backgrounds with proper scaling
    this.specialBarBg1 = this.add.rectangle(10 * scaleX, 40 * scaleY, 200 * scaleX, 20 * scaleY, 0xffffff) as Phaser.GameObjects.Rectangle;
    this.specialBarBg2 = this.add.rectangle(gameWidth - (210 * scaleX), 40 * scaleY, 200 * scaleX, 20 * scaleY, 0xffffff) as Phaser.GameObjects.Rectangle;

    // Create special bars with proper scaling
    this.specialBar1 = this.add.rectangle(10 * scaleX, 40 * scaleY, 0, 20 * scaleY, 0x00ff00) as Phaser.GameObjects.Rectangle;
    this.specialBar2 = this.add.rectangle(gameWidth - (210 * scaleX), 40 * scaleY, 0, 20 * scaleY, 0x00ff00) as Phaser.GameObjects.Rectangle;
  }

  private createPlayerNames(scaleX: number, scaleY: number): void {
    const gameWidth = this.sys.game.canvas.width;

    // Create player name texts with proper scaling
    const fontSize = Math.max(16, Math.floor(24 * scaleY)); // Ensure minimum readable size

    const playerName1 = this.add.text(
        10 * scaleX, 70 * scaleY, this.p1, {
          fontSize: `${fontSize}px`,
          color: '#000000'
        }) as Phaser.GameObjects.Text;

    const playerName2 = this.add.text(
        gameWidth - (210 * scaleX), 70 * scaleY, this.p2, {
          fontSize: `${fontSize}px`,
          color: '#000000'
        }) as Phaser.GameObjects.Text;
  }

  private updateHealthBar(playerIndex: number): void {
    if (playerIndex !== 0 && playerIndex !== 1) return;
    const health = this.playerHealth[playerIndex];
    const maxHealth = this.TOTAL_HEALTH || 100;
    const healthRatio = Math.max(0, health / maxHealth);
    const gameWidth = this.sys.game.canvas.width;
    const scaleX = gameWidth / 800; // Assume 800 is base width
    const maxBarWidth = 200 * scaleX;
    const newWidth = maxBarWidth * healthRatio;
    const healthBar = playerIndex === 0 ? this.healthBar1 : this.healthBar2;
    if (!healthBar) return;
    if (typeof healthBar.clear === 'function') {
      healthBar.clear();
      if (typeof healthBar.fillStyle === 'function') {
        healthBar.fillStyle(playerIndex === 0 ? 0x00ff00 : 0xff0000);
        if (typeof healthBar.fillRect === 'function') {
          const xPos = playerIndex === 0 ? 10 * scaleX : gameWidth - (210 * scaleX);
          const yPos = 10 * scaleX;
          healthBar.fillRect(xPos, yPos, newWidth, 20 * scaleX);
        }
      }
    }
  }

  private createTouchControls(): void {
    // Restore all touch controls with real game logic (no debug logs)
    const gameWidth = this.sys.game.canvas.width;
    const gameHeight = this.sys.game.canvas.height;
    const buttonSize = 80;
    const leftSideCenter = gameWidth * 0.25;
    const rightSideCenter = gameWidth * 0.75;
    const leftButtonX = leftSideCenter - buttonSize;
    const rightButtonX = leftSideCenter + buttonSize;
    const jumpButtonX = leftSideCenter;
    const attackButtonX = rightSideCenter - buttonSize;
    const specialButtonX = rightSideCenter;
    const blockButtonX = rightSideCenter + buttonSize;
    const buttonY = gameHeight - (buttonSize / 2) - 10;

    // LEFT
    const leftButton = this.add.rectangle(leftButtonX, buttonY, buttonSize, buttonSize, 0x4444ff)
        .setAlpha(0.7)
        .setDepth(1000)
        .setInteractive()
        .setScrollFactor(0);
    leftButton.on('pointerdown', this.handleLeftDown, this);
    leftButton.on('pointerup', this.handleLeftUp, this);
    leftButton.on('pointerout', this.handleLeftUp, this);

    // RIGHT
    const rightButton = this.add.rectangle(rightButtonX, buttonY, buttonSize, buttonSize, 0x4444ff)
        .setAlpha(0.7)
        .setDepth(1000)
        .setInteractive()
        .setScrollFactor(0);
    rightButton.on('pointerdown', this.handleRightDown, this);
    rightButton.on('pointerup', this.handleRightUp, this);
    rightButton.on('pointerout', this.handleRightUp, this);

    // JUMP
    const jumpButton = this.add.rectangle(jumpButtonX, buttonY - buttonSize - 10, buttonSize, buttonSize, 0x44ff44)
        .setAlpha(0.7)
        .setDepth(1000)
        .setInteractive()
        .setScrollFactor(0);
    jumpButton.on('pointerdown', this.handleJumpDown, this);
    jumpButton.on('pointerup', this.handleJumpUp, this);
    jumpButton.on('pointerout', this.handleJumpUp, this);

    // ATTACK
    const attackButton = this.add.rectangle(attackButtonX, buttonY, buttonSize, buttonSize, 0xff4444)
        .setAlpha(0.7)
        .setDepth(1000)
        .setInteractive()
        .setScrollFactor(0);
    attackButton.on('pointerdown', () => this.handleAttack());
    attackButton.on('pointerup', () => this.updateTouchControlState('attack', false));
    attackButton.on('pointerout', () => this.updateTouchControlState('attack', false));

    // SPECIAL
    const specialButton = this.add.rectangle(specialButtonX, buttonY, buttonSize, buttonSize, 0xff44ff)
        .setAlpha(0.7)
        .setDepth(1000)
        .setInteractive()
        .setScrollFactor(0);
    specialButton.on('pointerdown', () => this.handleSpecial());
    specialButton.on('pointerup', () => this.updateTouchControlState('special', false));
    specialButton.on('pointerout', () => this.updateTouchControlState('special', false));

    // BLOCK
    const blockButton = this.add.rectangle(blockButtonX, buttonY, buttonSize, buttonSize, 0xffff44)
        .setAlpha(0.7)
        .setDepth(1000)
        .setInteractive()
        .setScrollFactor(0);
    blockButton.on('pointerdown', () => {
      if (this.gameMode === 'online' && !this.isHost) {
        if (this.player2) this.playerBlocking[1] = true;
      } else {
        if (this.player1) this.playerBlocking[0] = true;
      }
    });
    blockButton.on('pointerup', () => {
      if (this.gameMode === 'online' && !this.isHost) {
        if (this.player2) this.playerBlocking[1] = false;
      } else {
        if (this.player1) this.playerBlocking[0] = false;
      }
    });
    blockButton.on('pointerout', () => {
      if (this.gameMode === 'online' && !this.isHost) {
        if (this.player2) this.playerBlocking[1] = false;
      } else {
        if (this.player1) this.playerBlocking[0] = false;
      }
    });
  }

  // --- Touch Button Handlers ---
  private handleLeftDown(): void {
    this.updateTouchControlState('left', true);
  }

  private handleLeftUp(): void {
    this.updateTouchControlState('left', false);
  }

  private handleRightDown(): void {
    this.updateTouchControlState('right', true);
  }

  private handleRightUp(): void {
    this.updateTouchControlState('right', false);
  }

  private handleJumpDown(): void {
    this.updateTouchControlState('jump', true);
  }

  private handleJumpUp(): void {
    this.updateTouchControlState('jump', false);
  }

  private updateTouchControlState(
    control: 'left' | 'right' | 'jump' | 'attack' | 'special' | 'block',
    active: boolean
  ): void {
    switch (control) {
      case 'left':
        if (this.player1 && active) this.player1.setVelocityX(-160);
        else if (this.player1) this.player1.setVelocityX(0);
        break;
      case 'right':
        if (this.player1 && active) this.player1.setVelocityX(160);
        else if (this.player1) this.player1.setVelocityX(0);
        break;
      case 'jump':
        if (this.player1 && active && this.player1.body.touching.down) this.player1.setVelocityY(-330);
        break;
      case 'attack':
        if (active) this.handleAttack();
        break;
      case 'special':
        if (active) this.handleSpecial();
        break;
      case 'block':
        if (this.player1) this.playerBlocking[0] = active;
        break;
    }
    // Optionally update button visuals here
  }

  private handleAttack(): void {
    // Example: Play attack animation or trigger hit logic
    if (this.player1 && !this.player1.getData('isAttacking')) {
      this.player1.setData('isAttacking', true);
      // Play attack animation or trigger hitbox
      // Reset attacking state after short delay
      this.time.delayedCall(500, () => {
        if (this.player1) this.player1.setData('isAttacking', false);
      });
    }
  }

  private handleSpecial(): void {
    // Example: Play special animation or trigger special logic
    if (this.player1 && !this.player1.getData('isSpecialAttacking')) {
      this.player1.setData('isSpecialAttacking', true);
      // Play special animation or trigger special effect
      // Reset special attacking state after short delay
      this.time.delayedCall(700, () => {
        if (this.player1) this.player1.setData('isSpecialAttacking', false);
      });
    }
  }

  private endGame(winnerIndex: number, message: string = ''): void {
    // Pause the game
    this.physics.pause();
    this.scene.pause();

    // Set game over state
    this.gameOver = true;

    // Show winner text
    const winnerText = this.add.text(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2,
        `Player ${winnerIndex + 1} Wins!`,
        {fontSize: '48px', fill: '#fff'}
    ).setOrigin(0.5);

//{{ ... }}

    // restartButton.on('pointerdown', () => {
    //   this.scene.restart();
    // });
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
  if (!this.player1 || !this.player2) return;

  // In online mode, player1 is controlled by host, player2 by guest
  const isHostAction = this.isHost ? action.playerIndex === 0 : action.playerIndex === 1;
  const player = isHostAction ? this.player1 : this.player2;
  const otherPlayer = isHostAction ? this.player2 : this.player1;

  if (!player) return;

  switch (action.type) {
    case 'move':
      if (typeof action.direction !== 'undefined') {
        player.setVelocityX(action.direction * 160);
        player.setFlipX(action.direction < 0);
        this.playerDirection[isHostAction ? 0 : 1] = action.direction < 0 ? 'left' : 'right';
      }
      break;

    case 'jump':
      if (player.body?.touching?.down) {
        player.setVelocityY(-330);
      }
      break;

    case 'attack':
      if (this.player1 && this.player2) {
        this.tryAction(
          isHostAction ? 0 : 1,
          'attack',
          false
        );
      }
      break;

    case 'special':
      if (this.player1 && this.player2) {
        this.tryAction(
          isHostAction ? 0 : 1,
          'special',
          true
        );
      }
      break;

    case 'block':
      if (action.active !== undefined) {
        player.setData('isBlocking', action.active);
        this.playerBlocking[isHostAction ? 0 : 1] = action.active;
      }
      break;
    default:
      console.log('Unknown action type:', action.type);
      break;
  }

  // Update animation
  this.updatePlayerAnimation(isHostAction ? 0 : 1);
}

private tryAction(playerIndex: number, actionType: 'attack' | 'special', isSpecial: boolean): void {
  const now = Date.now();
  const attacker = playerIndex === 0 ? this.player1 : this.player2;
  const target = playerIndex === 0 ? this.player2 : this.player1;
  
  if (attacker && target) {
    this.tryAttack(playerIndex, attacker, target, now, isSpecial);
  }
}

private updatePlayerAnimation(playerIndex: number, isWalking?: boolean, time?: number): void {
  const player = playerIndex === 0 ? this.player1 : this.player2;
  if (!player) return;

  // If called with isWalking parameter (legacy call)
  if (isWalking !== undefined) {
    player.anims.play(isWalking ? `${player.texture.key}_run` : `${player.texture.key}_idle`, true);
    return;
  }

  // New animation logic
  if (player.getData('isHit')) {
    player.anims.play(`${player.texture.key}_hit`, true);
  } else if (player.getData('isAttacking')) {
    // Animation already set in tryAttack
  } else if (player.body.velocity.y !== 0) {
    player.anims.play(`${player.texture.key}_jump`, true);
  } else if (player.body.velocity.x !== 0) {
    player.anims.play(`${player.texture.key}_run`, true);
  } else {
    player.anims.play(`${player.texture.key}_idle`, true);
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

}

export default KidsFightScene;
