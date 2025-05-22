import Phaser from 'phaser';
import scenarioImg from './scenario1.png';
import player1RawImg from './sprites-bento3.png';
import player2RawImg from './sprites-davir3.png';
import player3RawImg from './sprites-jose3.png';
import player4RawImg from './sprites-davis3.png';
import player5RawImg from './sprites-carol3.png';
import player6RawImg from './sprites-roni3.png';
import player7RawImg from './sprites-jacqueline3.png';
import player8RawImg from './sprites-ivan3.png';
import player9RawImg from './sprites-d_isa.png';
import gameLogoImg from './android-chrome-192x192.png';
import { WebSocketManager } from './websocket_manager';
import { DEV } from './globals';

interface PlayerSelections {
  p1: string;
  p2: string;
}

interface SceneData {
  mode?: 'local' | 'online';
  fromGameMode?: boolean;
  roomCode?: string;
  isHost?: boolean;
}

interface CharacterInfo {
  name: string;
  key: string;
  x: number;
  y: number;
  scale: number;
  frame?: number;
  bgCircle?: Phaser.GameObjects.Circle;
  nameLabel?: Phaser.GameObjects.Text;
  bgCircleOffsetY?: number;
}

class PlayerSelectScene extends Phaser.Scene {
  // Properties made public for testability
  public CHARACTER_KEYS: string[];
  public selected: PlayerSelections;
  private mode: 'local' | 'online';
  private roomCode: string | null;
  private isHost: boolean;
  private p1Indicator!: Phaser.GameObjects.Arc;
  private p2Indicator!: Phaser.GameObjects.Arc;
  private p1Text!: Phaser.GameObjects.Text;
  private p2Text!: Phaser.GameObjects.Text;
  private readyButton!: Phaser.GameObjects.Text;
  private backButton!: Phaser.GameObjects.Text;
  public waitingText!: Phaser.GameObjects.Text; // public for test injection
  private characters: CharacterInfo[];
  public wsManager: WebSocketManager;
  private characterSprites: { [key: string]: Phaser.GameObjects.Sprite };
  private selectedP1Index: number;
  private selectedP2Index: number;
  private p1SelectorCircle!: Phaser.GameObjects.Ellipse;
  private p2SelectorCircle!: Phaser.GameObjects.Ellipse;
  private startButtonRect!: Phaser.GameObjects.Rectangle;
  private title!: Phaser.GameObjects.Text;

  /**
   * Optional wsManager injection for testability
   */
  constructor(wsManagerInstance: WebSocketManager = WebSocketManager.getInstance()) {
    super({ key: 'PlayerSelectScene' });
    if (DEV) console.log('PlayerSelectScene constructor called');
    
    this.CHARACTER_KEYS = ['player1', 'player2', 'player3', 'player4', 'player5', 'player6', 'player7', 'player8', 'player9'];
    this.selected = { p1: 'player1', p2: 'player2' };
    this.wsManager = wsManagerInstance;

    this.mode = 'local';
    this.roomCode = null;
    this.isHost = false;
    this.characters = [];
    this.characterSprites = {};
    this.selectedP1Index = 0;
    this.selectedP2Index = 1;
  }

  init(data: SceneData): void {
    // ORIENTATION CHANGE PROTECTION: Check if this scene was triggered by an orientation change
    const now = Date.now();
    const lastOrientationTime = (window as any).lastOrientationChangeTime || 0;
    const fromGameMode = data && data.fromGameMode === true;
    const timeSinceOrientation = now - lastOrientationTime;
    
    // If scene was launched within 2 seconds of orientation change and not explicitly from GameMode
    if (timeSinceOrientation < 2000 && !fromGameMode) {
      console.log('[PlayerSelectScene] PROTECTION: Detected invalid scene navigation after orientation change');
      console.log('[PlayerSelectScene] Time since orientation change:', timeSinceOrientation + 'ms');
      console.log('[PlayerSelectScene] Redirecting to GameModeScene...');
      
      // Immediately redirect to GameModeScene instead of continuing initialization
      this.scene.stop('PlayerSelectScene');
      this.scene.start('GameModeScene');
      return;
    }
    
    // Reset selections when scene is restarted
    if (DEV) console.log('[PlayerSelectScene] Init called, resetting selections');
    
    // For online mode, always set Bento (player1) as the initial player for both players
    if (data && data.mode === 'online') {
      this.mode = 'online';
      this.roomCode = data.roomCode || null;
      this.isHost = data.isHost || false;
      this.selected = { p1: 'player1', p2: 'player1' };
    } else {
      this.mode = 'local';
      this.roomCode = null;
      this.isHost = false;
      this.selected = { p1: 'player1', p2: 'player2' };
    }
  }

  preload(): void {
    // Load character sprites as spritesheets (assuming 96x96 frame size)
    this.load.spritesheet('player1', player1RawImg, { frameWidth: 296, frameHeight: 296 });
    this.load.spritesheet('player2', player2RawImg, { frameWidth: 296, frameHeight: 296 });
    this.load.spritesheet('player3', player3RawImg, { frameWidth: 296, frameHeight: 296 });
    this.load.spritesheet('player4', player4RawImg, { frameWidth: 296, frameHeight: 296 });
    this.load.spritesheet('player5', player5RawImg, { frameWidth: 296, frameHeight: 296 });
    this.load.spritesheet('player6', player6RawImg, { frameWidth: 296, frameHeight: 296 });
    this.load.spritesheet('player7', player7RawImg, { frameWidth: 296, frameHeight: 296 });
    this.load.spritesheet('player8', player8RawImg, { frameWidth: 296, frameHeight: 296 });
    this.load.spritesheet('player9', player9RawImg, { frameWidth: 296, frameHeight: 296 });
    
    // Note: Removed selector.png and will use Phaser shapes instead
    
    // Load background
    this.load.image('scenario', scenarioImg);
    
    // Load game logo
    this.load.image('game_logo', gameLogoImg);
  }

  create(): void {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    // Add background
    const bg = this.add.rectangle(w/2, h/2, w, h, 0x222222, 1);
    
    // Add title (always two lines)
    this.title = this.add.text(
      w/2,
      h * 0.1,
      'Escolha os\nLutadores',
      {
        fontSize: `${Math.max(18, Math.round(Math.min(w, h) * 0.06))}px`,
        color: '#fff',
        fontFamily: 'monospace',
        align: 'center',
        wordWrap: { width: w * 0.8, useAdvancedWrap: true }
      }
    ).setOrigin(0.5);

    // Setup character grid
    this.setupCharacters();

    // Create selection indicators
    this.createSelectionIndicators();

    // Create UI buttons
    this.createUIButtons();

    // Setup WebSocket handlers for online mode
    if (this.mode === 'online') {
      this.setupWebSocketHandlers();
    }

    // Responsive layout update on resize
    this.scale.on('resize', this.updateLayout, this);
  }

  private setupCharacters(): void {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    // --- Responsive character grid setup (centered grid, smaller height section) ---
    const gridCols = 3;
    const gridRows = 3;
    const gridW = w * 0.7; // grid takes 70% of width
    const gridH = h * 0.38; // grid takes LESS height (38% instead of 50%)
    const spacingX = gridW / (gridCols - 1);
    const spacingY = gridH / (gridRows - 1);
    const startX = w / 2 - gridW / 2;
    const startY = h * 0.18;
    this.characters = [
      { name: 'Bento', key: 'player1', x: startX, y: startY, scale: 0.5 },
      { name: 'Davi R', key: 'player2', x: startX + spacingX, y: startY, scale: 0.5 },
      { name: 'José', key: 'player3', x: startX + spacingX * 2, y: startY, scale: 0.5 },
      { name: 'Davis', key: 'player4', x: startX, y: startY + spacingY, scale: 0.5 },
      { name: 'Carol', key: 'player5', x: startX + spacingX, y: startY + spacingY, scale: 0.5 },
      { name: 'Roni', key: 'player6', x: startX + spacingX * 2, y: startY + spacingY, scale: 0.5 },
      { name: 'Jacqueline', key: 'player7', x: startX, y: startY + spacingY * 2, scale: 0.5 },
      { name: 'Ivan', key: 'player8', x: startX + spacingX, y: startY + spacingY * 2, scale: 0.5 },
      { name: 'D. Isa', key: 'player9', x: startX + spacingX * 2, y: startY + spacingY * 2, scale: 0.5 }
    ];
    // --- END Responsive centered grid ---
    // Create character sprites with background circles
    this.characters.forEach((char, index) => {
      // When creating the background circle, store the original offset for later use
      const bgCircleOffsetY = 100; // move bgCircle 100px down from char.y
      const bgCircle = this.add.circle(char.x, char.y + bgCircleOffsetY, 60, 0x222222, 1);
      char.bgCircle = bgCircle;
      char.bgCircleOffsetY = bgCircleOffsetY;
      // Show only frame 0 and crop to head+shoulders area (classic style)
      const sprite = this.add.sprite(char.x, char.y + 40, char.key, 0);
      // Responsive scale: base scale for 296x296, shrink to 0.4 for default 1280x720, scale with min(screenW,screenH)
      const baseSize = 296;
      const screenW = this.sys.game.config.width as number;
      const screenH = this.sys.game.config.height as number;
      const scale = 0.4 * Math.min(screenW, screenH) / 720; // 0.4 at 720p, smaller for smaller screens
      sprite.setScale(scale);
      sprite.setInteractive({ useHandCursor: true });
      sprite.setCrop(0, 0, 296, 296); // crop to square head+shoulders for new frame size
      sprite.setOrigin(0.5, 0.4);
      // Store sprite reference
      this.characterSprites[char.key] = sprite;
      // Add name label and keep reference
      const label = this.add.text(
        char.x,
        char.y + 100,
        char.name,
        {
          fontSize: '20px',
          color: '#fff',
          fontFamily: 'monospace',
          align: 'center'
        }
      ).setOrigin(0.5);
      char.nameLabel = label;
      // Click handler
      sprite.on('pointerdown', () => this.handleCharacterSelect(index));
    });
  }

  private createSelectionIndicators(): void {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    // Responsive indicator radius (5% of min screen dimension, clamped)
    const indicatorRadius = Math.max(24, Math.min(60, Math.round(Math.min(w, h) * 0.05)));
    // Initialize selector circles at (0,0); will be positioned in updateSelectionIndicators
    this.p1SelectorCircle = this.add.circle(0, 0, indicatorRadius, 0xffff00, 0.18);
    this.p2SelectorCircle = this.add.circle(0, 0, indicatorRadius, 0x0000ff, 0.18);
    // Player 1 indicator (green circle)
    this.p1Indicator = this.add.circle(0, 0, indicatorRadius * 0.75, 0x00ff00, 0.7)
      .setStrokeStyle(3, 0xffffff, 1);
    this.p1Text = this.add.text(0, 0, 'P1', {
      fontSize: `${Math.round(indicatorRadius * 0.5)}px`,
      color: '#ffffff',
      fontFamily: 'monospace',
      fontWeight: 'bold'
    }).setOrigin(0.5);
    // Player 2 indicator (red circle)
    this.p2Indicator = this.add.circle(0, 0, indicatorRadius * 0.75, 0xff0000, 0.7)
      .setStrokeStyle(3, 0xffffff, 1);
    this.p2Text = this.add.text(0, 0, 'P2', {
      fontSize: `${Math.round(indicatorRadius * 0.5)}px`,
      color: '#ffffff',
      fontFamily: 'monospace',
      fontWeight: 'bold'
    }).setOrigin(0.5);
  }

  private createUIButtons(): void {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    // Start button (green, offset left)
    const buttonX = w * 0.5 - 18;
    this.startButtonRect = this.add.rectangle(buttonX, h * 0.85, 200, 60, 0x00ff00);
    this.readyButton = this.add.text(
      buttonX,
      h * 0.85,
      'COMEÇAR',
      {
        fontSize: '24px',
        color: '#fff',
        backgroundColor: '#4a4a4a',
        padding: { x: 20, y: 10 }
      }
    ).setOrigin(0.5).setInteractive({ useHandCursor: true });

    // Back button
    this.backButton = this.add.text(
      w * 0.3,
      h * 0.85,
      'Voltar',
      {
        fontSize: '24px',
        color: '#fff',
        backgroundColor: '#4a4a4a',
        padding: { x: 20, y: 10 }
      }
    ).setOrigin(0.5).setInteractive({ useHandCursor: true });

    // Button hover effects
    [this.readyButton, this.backButton].forEach(button => {
      button.on('pointerover', () => button.setBackgroundColor('#666666'));
      button.on('pointerout', () => button.setBackgroundColor('#4a4a4a'));
    });

    // Button click handlers
    this.readyButton.on('pointerdown', () => this.handleReady());
    this.backButton.on('pointerdown', () => this.handleBack());

    // Waiting text (hidden by default)
    this.waitingText = this.add.text(
      w/2,
      h * 0.7,
      'Aguardando outro jogador...',
      {
        fontSize: '20px',
        color: '#fff',
        fontFamily: 'monospace'
      }
    ).setOrigin(0.5).setVisible(false);
  }

  private handleCharacterSelect(index: number): void {
    if (this.mode === 'online') {
      // In online mode, host controls P1, client controls P2
      if (this.isHost) {
        this.selected.p1 = this.CHARACTER_KEYS[index];
        this.selectedP1Index = index;
        // Send selection to other player
        this.wsManager.send({
          type: 'player_selected',
          data: { player: 'p1', character: this.selected.p1 }
        });
      } else {
        this.selected.p2 = this.CHARACTER_KEYS[index];
        this.selectedP2Index = index;
        // Send selection to other player
        this.wsManager.send({
          type: 'player_selected',
          data: { player: 'p2', character: this.selected.p2 }
        });
      }
    } else {
      // In local mode, alternate between P1 and P2
      if (this.selectedP1Index === index) {
        this.selectedP1Index = this.selectedP2Index;
        this.selectedP2Index = index;
        this.selected.p1 = this.CHARACTER_KEYS[this.selectedP1Index];
        this.selected.p2 = this.CHARACTER_KEYS[this.selectedP2Index];
      } else if (this.selectedP2Index === index) {
        this.selectedP2Index = this.selectedP1Index;
        this.selectedP1Index = index;
        this.selected.p2 = this.CHARACTER_KEYS[this.selectedP2Index];
        this.selected.p1 = this.CHARACTER_KEYS[this.selectedP1Index];
      } else {
        this.selectedP1Index = index;
        this.selected.p1 = this.CHARACTER_KEYS[index];
      }
    }

    this.updateSelectionIndicators();
  }

  private updateSelectionIndicators(): void {
    // Move selector circles to selected character positions
    const p1Char = this.characters[this.selectedP1Index];
    const p2Char = this.characters[this.selectedP2Index];
    if (p1Char && this.p1SelectorCircle) {
      this.p1SelectorCircle.setPosition(p1Char.x, p1Char.y);
    }
    if (p2Char && this.p2SelectorCircle) {
      this.p2SelectorCircle.setPosition(p2Char.x, p2Char.y);
    }
    // Move indicator circles and text as before
    if (p1Char && this.p1Indicator && this.p1Text) {
      this.p1Indicator.setPosition(p1Char.x, p1Char.y - 80);
      this.p1Text.setPosition(p1Char.x, p1Char.y - 80);
    }
    if (p2Char && this.p2Indicator && this.p2Text) {
      this.p2Indicator.setPosition(p2Char.x, p2Char.y - 80);
      this.p2Text.setPosition(p2Char.x, p2Char.y - 80);
    }
  }

  private handleReady(): void {
    if (this.mode === 'online') {
      this.wsManager.send({
        type: 'player_ready',
        data: {
          roomCode: this.roomCode,
          selections: this.selected
        }
      });
      this.readyButton.setVisible(false);
      this.waitingText.setVisible(true);
    } else {
      this.startGame();
    }
  }

  private handleBack(): void {
    if (this.mode === 'online') {
      this.wsManager.disconnect();
    }
    this.scene.start('GameModeScene');
  }

  private setupWebSocketHandlers(): void {
    this.wsManager.setMessageCallback?.((event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'player_selected') {
          const { player, character } = data.data;
          this.selected[player as keyof PlayerSelections] = character;
          this.updateSelectionIndicators();
        } else if (data.type === 'player_ready') {
          this.startGame();
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });
  }

  private startGame(): void {
    if ((this as any).player1Ready && (this as any).player2Ready) {
      this.scene.start('GameScene', {
        player1Character: this.selected.p1,
        player2Character: this.selected.p2,
        mode: 'local'
      });
    }
  }

  private updateLayout(gameSize: Phaser.Structs.Size): void {
    const w = gameSize.width;
    const h = gameSize.height;
    // Responsive title position and font size
    if (this.title) {
      // Always break title into two lines
      this.title.setText('Escolha os\nLutadores');
      const vw = w / 100;
      const vh = h / 100;
      const titleFontSize = Math.max(14, Math.round(Math.min(vw, vh) * 6)); // 6vw/vh, min 14px
      this.title.setFontSize(titleFontSize);
      this.title.setWordWrapWidth(w * 0.8, true);
      this.title.setAlign('center');
      this.title.setPosition(w / 2, vh * 10); // 10vh from top
      this.title.setOrigin(0.5, 0.5);
    }
    // Responsive character positions (centered grid, smaller height section)
    const gridCols = 3;
    const gridRows = 3;
    const gridW = w * 0.7;
    const gridH = h * 0.38;
    const spacingX = gridW / (gridCols - 1);
    const spacingY = gridH / (gridRows - 1);
    const startX = w / 2 - gridW / 2;
    const startY = h * 0.18;
    this.characters.forEach((char, index) => {
      const row = Math.floor(index / 3);
      const col = index % 3;
      char.x = startX + col * spacingX;
      char.y = startY + row * spacingY;
      // Move background circle to its intended offset from char.y (not sprite)
      if (char.bgCircle) {
        const bgCircleOffsetY = char.bgCircleOffsetY || 100;
        char.bgCircle.setPosition(char.x, char.y + bgCircleOffsetY);
        char.bgCircle.setScale(scale);
        char.bgCircle.setDepth(sprite.depth - 1);
      }
      // Move and scale sprite
      const sprite = this.characterSprites[char.key];
      if (sprite) {
        sprite.setPosition(char.x, char.y + 40); // move sprite 40px further down
        sprite.setScale(scale);
      }
      // Update name label
      if (char.nameLabel) {
        const nameOffset = (baseSize * scale) / 2 + 24 + 40;
        char.nameLabel.setPosition(char.x, char.y + nameOffset);
      }
    });

    // Centralize the buttons at the bottom using edge alignment
    const buttonY = h * 0.97;
    const buttonSpacing = Math.max(24, w * 0.04);
    if (this.readyButton && this.backButton) {
      this.readyButton.setFontSize(Math.max(14, Math.round(h * 0.035)));
      this.backButton.setFontSize(Math.max(14, Math.round(h * 0.035)));
      if (this.readyButton.updateText) this.readyButton.updateText();
      if (this.backButton.updateText) this.backButton.updateText();
      const readyWidth = this.readyButton.width;
      const backWidth = this.backButton.width;
      const totalWidth = readyWidth + backWidth + buttonSpacing;
      const centerX = w / 2;
      // Set origins so that their inner edges meet at center
      this.backButton.setOrigin(1, 0.5); // right edge
      this.readyButton.setOrigin(0, 0.5); // left edge
      this.backButton.setPosition(centerX - buttonSpacing / 2, buttonY);
      this.readyButton.setPosition(centerX + buttonSpacing / 2, buttonY);
    }
    if (this.waitingText) {
      this.waitingText.setFontSize(Math.max(12, Math.round(h * 0.03)));
      this.waitingText.setPosition(w/2, h * 0.87);
      this.waitingText.setOrigin(0.5);
    }

    // Responsive selectors (start at correct positions)
    if (this.p1SelectorCircle) {
      this.p1SelectorCircle.setPosition(this.characters[0].x, this.characters[0].y);
    }
    if (this.p2SelectorCircle) {
      this.p2SelectorCircle.setPosition(this.characters[this.characters.length-1].x, this.characters[this.characters.length-1].y);
    }

    // Update selection indicators
    this.updateSelectionIndicators();
  }

  /**
   * Starts the fight process. In online mode, hosts select scenario first, then continue. Clients or local mode proceed directly.
   */
  public startFight(): void {
    if (this.mode === 'online') {
      // If host, launch scenario selection first
      if (this.isHost) {
        if (DEV) console.log('[PlayerSelectScene] Host selecting scenario before starting fight');
        this.scene.pause();
        this.scene.launch('ScenarioSelectScene', {
          p1: this.CHARACTER_KEYS.indexOf(this.selected.p1),
          p2: this.CHARACTER_KEYS.indexOf(this.selected.p2),
          fromPlayerSelect: true,
          onlineMode: true
        });
        // Listen for scenario selection (handled in ScenarioSelectScene)
        return;
      }
      // For non-host or after scenario selection, continue with normal process
      this.continueStartFight();
    } else {
      // Start immediately in local mode
      this.launchGame();
    }
  }

  /**
   * Continues the fight process after scenario selection or for non-hosts. Optionally accepts a character index for test compatibility.
   */
  public continueStartFight(charIndex?: number): void {
    // Send our character selection
    const myChar = this.isHost ? this.selected.p1 : this.selected.p2;
    const charIdx = (typeof charIndex === 'number') ? charIndex : this.CHARACTER_KEYS.indexOf(myChar);
    const playerNum = this.isHost ? 1 : 2;
    this.wsManager.send({
      type: 'player_ready',
      character: charIdx
    });
    if (DEV) console.log('[PlayerSelectScene] Sending player_ready:', {
      charKey: myChar,
      charIdx
    });

    // Add a debug button in online mode for testing and development
    if (this.mode === 'online' && this.isHost && DEV) {
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
        if (DEV) console.log('[PlayerSelectScene] Debug button clicked, forcing game start');
        this.launchGame();
      });
    }
  }

  /**
   * Launches the KidsFightScene with the selected characters and scenario.
   */
  private launchGame(): void {
    if (DEV) console.log('[PlayerSelectScene] Starting fight with:', {
      p1: this.selected.p1,
      p2: this.selected.p2,
      isHost: this.isHost
    });
    const p1Index = this.CHARACTER_KEYS.indexOf(this.selected.p1);
    const p2Index = this.CHARACTER_KEYS.indexOf(this.selected.p2);
    this.scene.start('KidsFightScene', {
      p1: this.selected.p1,
      p2: this.selected.p2,
      p1Index,
      p2Index,
      scenario: (this as any).scenarioKey,
      mode: this.mode,
      isHost: this.isHost
    });
  }
}

export default PlayerSelectScene;
