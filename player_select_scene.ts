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
import WebSocketManager from './websocket_manager';
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
}

class PlayerSelectScene extends Phaser.Scene {
  // Properties made public for testability
  public CHARACTER_KEYS: string[];
  public selected: PlayerSelections;
  private mode: 'local' | 'online';
  private roomCode: string | null;
  private isHost: boolean;
  private p1Indicator!: Phaser.GameObjects.Sprite;
  private p2Indicator!: Phaser.GameObjects.Sprite;
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
    // Load character sprites
    this.load.image('player1_raw', player1RawImg);
    this.load.image('player2_raw', player2RawImg);
    this.load.image('player3_raw', player3RawImg);
    this.load.image('player4_raw', player4RawImg);
    this.load.image('player5_raw', player5RawImg);
    this.load.image('player6_raw', player6RawImg);
    this.load.image('player7_raw', player7RawImg);
    this.load.image('player8_raw', player8RawImg);
    this.load.image('player9_raw', player9RawImg);
    
    // Load selection indicator
    this.load.image('selector', 'selector.png');
    
    // Load background
    this.load.image('scenario', scenarioImg);
    
    // Load game logo
    this.load.image('game_logo', gameLogoImg);
  }

  create(): void {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    // Add background
    const bg = this.add.rectangle(w/2, h/2, w, h, 0x222222);

    // Add title
    const title = this.add.text(
      w/2,
      h * 0.1,
      'Escolha os Lutadores',
      {
        fontSize: `${Math.max(24, Math.round(w * 0.045))}px`,
        color: '#fff',
        fontFamily: 'monospace',
        align: 'center'
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
    const gridSize = 3;
    const spacing = w * 0.2;
    const startX = w * 0.25;
    const startY = h * 0.3;

    this.characters = [
      { name: 'Bento', key: 'player1', x: startX, y: startY, scale: 0.5 },
      { name: 'Davi R', key: 'player2', x: startX + spacing, y: startY, scale: 0.5 },
      { name: 'José', key: 'player3', x: startX + spacing * 2, y: startY, scale: 0.5 },
      { name: 'Davis', key: 'player4', x: startX, y: startY + spacing, scale: 0.5 },
      { name: 'Carol', key: 'player5', x: startX + spacing, y: startY + spacing, scale: 0.5 },
      { name: 'Roni', key: 'player6', x: startX + spacing * 2, y: startY + spacing, scale: 0.5 },
      { name: 'Jacqueline', key: 'player7', x: startX, y: startY + spacing * 2, scale: 0.5 },
      { name: 'Ivan', key: 'player8', x: startX + spacing, y: startY + spacing * 2, scale: 0.5 },
      { name: 'D. Isa', key: 'player9', x: startX + spacing * 2, y: startY + spacing * 2, scale: 0.5 }
    ];

    // Create character sprites
    this.characters.forEach((char, index) => {
      const sprite = this.add.sprite(char.x, char.y, `${char.key}_raw`);
      sprite.setScale(char.scale);
      sprite.setInteractive({ useHandCursor: true });
      
      // Store sprite reference
      this.characterSprites[char.key] = sprite;

      // Add name label
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

      // Click handler
      sprite.on('pointerdown', () => this.handleCharacterSelect(index));
    });
  }

  private createSelectionIndicators(): void {
    // Test expects selector circles with specific colors and alpha
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    // Player 1 selector circle (yellow)
    this.p1SelectorCircle = this.add.circle(w * 0.3, h * 0.6, 40, 0xffff00, 0.18);
    // Player 2 selector circle (blue)
    this.p2SelectorCircle = this.add.circle(w * 0.7, h * 0.6, 40, 0x0000ff, 0.18);

    // Player 1 indicator
    this.p1Indicator = this.add.sprite(0, 0, 'selector').setTint(0x00ff00).setAlpha(0.7);
    this.p1Text = this.add.text(0, 0, 'P1', {
      fontSize: '24px',
      color: '#00ff00',
      fontFamily: 'monospace'
    }).setOrigin(0.5);

    // Player 2 indicator
    this.p2Indicator = this.add.sprite(0, 0, 'selector').setTint(0xff0000).setAlpha(0.7);
    this.p2Text = this.add.text(0, 0, 'P2', {
      fontSize: '24px',
      color: '#ff0000',
      fontFamily: 'monospace'
    }).setOrigin(0.5);

    this.updateSelectionIndicators();
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
    const p1Sprite = this.characterSprites[this.selected.p1];
    const p2Sprite = this.characterSprites[this.selected.p2];

    if (p1Sprite) {
      this.p1Indicator.setPosition(p1Sprite.x, p1Sprite.y - 80);
      this.p1Text.setPosition(p1Sprite.x, p1Sprite.y - 80);
    }

    if (p2Sprite) {
      this.p2Indicator.setPosition(p2Sprite.x, p2Sprite.y - 80);
      this.p2Text.setPosition(p2Sprite.x, p2Sprite.y - 80);
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
    this.scene.start('ScenarioSelectScene', {
      mode: this.mode,
      selected: this.selected,
      roomCode: this.roomCode,
      isHost: this.isHost
    });
  }

  private updateLayout(gameSize: Phaser.Structs.Size): void {
    const w = gameSize.width;
    const h = gameSize.height;

    // Update character positions
    const spacing = w * 0.2;
    const startX = w * 0.25;
    const startY = h * 0.3;

    this.characters.forEach((char, index) => {
      const row = Math.floor(index / 3);
      const col = index % 3;
      char.x = startX + col * spacing;
      char.y = startY + row * spacing;

      const sprite = this.characterSprites[char.key];
      if (sprite) {
        sprite.setPosition(char.x, char.y);
        
        // Update name label
        const label = this.children.list.find((child: any) => 
          child instanceof Phaser.GameObjects.Text &&
          child.text === char.name
        ) as Phaser.GameObjects.Text;
        
        if (label) {
          label.setPosition(char.x, char.y + 100);
        }
      }
    });

    // Update selection indicators
    this.updateSelectionIndicators();

    // Update UI buttons
    if (this.readyButton) {
      this.readyButton.setPosition(w * 0.7, h * 0.85);
    }
    if (this.backButton) {
      this.backButton.setPosition(w * 0.3, h * 0.85);
    }
    if (this.waitingText) {
      this.waitingText.setPosition(w/2, h * 0.7);
    }
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
